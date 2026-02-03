'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { logError } from '@/lib/error-sanitizer';
import { getApiKey } from '@/lib/ai';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioLevel: number;
  audioBlob: Blob | null; // For local verify
  transcript: string;
  countdown: number | null;
  elapsedTime: number;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

const SAMPLE_RATE = 24000;

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const countdownIntervalRef = useRef<number | null>(null);
  const elapsedTimeIntervalRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startActualRecording = useCallback(async () => {
    try {
      // 1. Get Ephemeral Token
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('API Key missing');

      const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-10-01',
          modalities: ['text'],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        logError('Session Fetch Error Body:', err);
        throw new Error(err.error?.message || 'Failed to get session token');
      }
      const data = await response.json();
      const token = data.client_secret?.value;
      if (!token) throw new Error('No token found');

      // 2. Setup WebRTC Peer Connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Handle remote audio (if model speaks back)
      pc.ontrack = (e) => {
        const audio = new Audio();
        audio.srcObject = e.streams[0];
        audio.play().catch((e) => logError('Remote audio playback failed', e));
      };

      // Setup Local Audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      pc.addTrack(stream.getTracks()[0]);

      // Audio Level Visualization setup
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);

      const updateLevel = () => {
        if (!analyserRef.current || !isRecording) return;
        const array = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(array);
        const avg = array.reduce((a, b) => a + b, 0) / array.length;
        setAudioLevel(avg / 255); // Normalize 0-1
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      // 3. Data Channel for Events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.onopen = () => {
        // Configure Session via DC
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions: 'You are a transcriber. Transcribe the audio exactly.',
            turn_detection: { type: 'server_vad' },
            input_audio_transcription: { model: 'whisper-1' },
          },
        };
        dc.send(JSON.stringify(sessionUpdate));
      };

      dc.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'conversation.item.input_audio_transcription.delta') {
            const delta = msg.delta || '';
            setTranscript((prev) => {
              return prev + delta;
            });
          }

          if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            setTranscript((prev) => prev + ' ');
          }

          if (msg.type === 'error') {
            logError('Realtime Event Error', msg);
          }
        } catch (err) {
          logError('DC Message Error', err);
        }
      };

      // 4. Offer / Answer Exchange
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/sdp',
          },
        },
      );

      if (!sdpResponse.ok) {
        throw new Error('SDP exchange failed');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      // Start Recording State
      setIsRecording(true);
      setElapsedTime(0);
      elapsedTimeIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      updateLevel();

      // Local recording for Blob using MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      (pcRef.current as any)._mediaRecorder = mediaRecorder;
    } catch (err) {
      logError('Start Recording Sequence Error:', err);
      setError(err instanceof Error ? err.message : 'Detailed error in console');
      setIsRecording(false);
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    setTranscript('');
    audioChunksRef.current = [];
    setCountdown(3);
    let count = 3;

    // Clear existing
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Use WebRTC recording in both browser and Tauri modes for real-time transcription
    const recordingMethod = startActualRecording;

    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count === 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        recordingMethod();
      }
    }, 1000);
  }, [startActualRecording]);

  const stop = useCallback(() => {
    // Use WebRTC recording cleanup for both browser and Tauri modes
    setIsRecording(false);

    if (elapsedTimeIntervalRef.current) {
      clearInterval(elapsedTimeIntervalRef.current);
      elapsedTimeIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (pcRef.current) {
      // Stop MediaRecorder
      const mr = (pcRef.current as any)._mediaRecorder as MediaRecorder;
      if (mr && mr.state !== 'inactive') {
        mr.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
        };
        mr.stop();
      } else {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      }

      pcRef.current.close();
      pcRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }, []);

  return {
    isRecording,
    audioLevel,
    audioBlob,
    transcript,
    countdown,
    elapsedTime,
    start,
    stop,
    error,
  };
}
