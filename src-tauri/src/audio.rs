use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::sync::{Arc, Mutex};

/// Audio recorder state - stores samples and metadata
pub struct AudioRecorder {
    samples: Arc<Mutex<Vec<f32>>>,
    sample_rate: Arc<Mutex<u32>>,
    stream: Mutex<Option<Box<dyn std::any::Any>>>,
}

impl Default for AudioRecorder {
    fn default() -> Self {
        Self {
            samples: Arc::new(Mutex::new(Vec::new())),
            sample_rate: Arc::new(Mutex::new(44100)),
            stream: Mutex::new(None),
        }
    }
}

// SAFETY: AudioRecorder is only accessed from Tauri commands which run on the main thread.
// The stream is never actually sent between threads - it's only stored and accessed from
// the main thread. The Arc<Mutex<>> for samples ensures thread-safe access to shared data.
unsafe impl Send for AudioRecorder {}
unsafe impl Sync for AudioRecorder {}


/// Start recording audio from the default input device
#[tauri::command]
pub fn start_recording(recorder: tauri::State<AudioRecorder>) -> Result<(), String> {
    // Clear previous samples
    {
        let mut samples = recorder.samples.lock().unwrap();
        samples.clear();
    }

    // Get the default host and input device
    let host = cpal::default_host();
    let device = host
        .default_input_device()
        .ok_or("No input device available")?;

    // Get the default input config
    let config = device
        .default_input_config()
        .map_err(|e| format!("Failed to get input config: {}", e))?;

    // Store the sample rate
    {
        let mut sample_rate = recorder.sample_rate.lock().unwrap();
        *sample_rate = config.sample_rate().0;
    }

    // Clone Arc references for the audio callback thread
    let samples_arc = Arc::clone(&recorder.samples);

    // Build the input stream - directly collect samples without channel
    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => build_input_stream::<f32>(&device, &config.into(), samples_arc),
        cpal::SampleFormat::I16 => build_input_stream::<i16>(&device, &config.into(), samples_arc),
        cpal::SampleFormat::U16 => build_input_stream::<u16>(&device, &config.into(), samples_arc),
        _ => return Err("Unsupported sample format".to_string()),
    }
    .map_err(|e| format!("Failed to build input stream: {}", e))?;

    // Start the stream
    stream
        .play()
        .map_err(|e| format!("Failed to play stream: {}", e))?;

    // Store the stream (type-erased to avoid Send requirements)
    let mut stream_lock = recorder.stream.lock().unwrap();
    *stream_lock = Some(Box::new(stream));

    Ok(())
}

/// Stop recording and return the audio data as base64-encoded WAV
#[tauri::command]
pub fn stop_recording(recorder: tauri::State<AudioRecorder>) -> Result<String, String> {
    // Stop the stream by dropping it
    {
        let mut stream_lock = recorder.stream.lock().unwrap();
        *stream_lock = None;
    }

    // Get the recorded samples
    let samples = {
        let mut samples = recorder.samples.lock().unwrap();
        let data = samples.clone();
        samples.clear(); // Clear for next recording
        data
    };

    let sample_rate = *recorder.sample_rate.lock().unwrap();

    if samples.is_empty() {
        return Err("No audio data recorded".to_string());
    }

    // Convert to WAV format
    let wav_data = samples_to_wav(&samples, sample_rate)
        .map_err(|e| format!("Failed to convert to WAV: {}", e))?;

    // Encode as base64
    use base64::Engine;
    let base64_data = base64::engine::general_purpose::STANDARD.encode(&wav_data);

    Ok(base64_data)
}

/// Build an input stream for a specific sample format
fn build_input_stream<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples_arc: Arc<Mutex<Vec<f32>>>,
) -> Result<cpal::Stream, cpal::BuildStreamError>
where
    T: cpal::Sample + cpal::SizedSample,
    f32: cpal::FromSample<T>,
{
    let err_fn = |err| eprintln!("An error occurred on the audio stream: {}", err);

    device.build_input_stream(
        config,
        move |data: &[T], _: &cpal::InputCallbackInfo| {
            let chunk: Vec<f32> = data.iter().map(|&s| s.to_sample()).collect();
            if let Ok(mut samples) = samples_arc.lock() {
                samples.extend(chunk);
            }
        },
        err_fn,
        None,
    )
}

/// Convert f32 samples to WAV format (16-bit PCM)
fn samples_to_wav(samples: &[f32], sample_rate: u32) -> Result<Vec<u8>, hound::Error> {
    let mut cursor = std::io::Cursor::new(Vec::new());

    {
        let spec = hound::WavSpec {
            channels: 1,
            sample_rate,
            bits_per_sample: 16,
            sample_format: hound::SampleFormat::Int,
        };

        let mut writer = hound::WavWriter::new(&mut cursor, spec)?;

        for &sample in samples {
            let amplitude = (sample * i16::MAX as f32) as i16;
            writer.write_sample(amplitude)?;
        }

        writer.finalize()?;
    }

    Ok(cursor.into_inner())
}
