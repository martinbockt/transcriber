'use client';

import { useState, useRef, useCallback } from 'react';
import { validateAudioBlob } from '@/lib/validation';
import { logError } from '@/lib/error-sanitizer';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioLevel: number;
  audioBlob: Blob | null;
  countdown: number | null;
  elapsedTime: number;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<number | null>(null);
  const elapsedTimeIntervalRef = useRef<number | null>(null);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, []);

  const startActualRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Validate audio blob before setting it
        try {
          const validationResult = await validateAudioBlob(blob);

          if (!validationResult.valid) {
            setError(validationResult.error || 'Audio validation failed');
            logError('Audio validation failed', {
              error: validationResult.error,
              details: validationResult.details,
            });
            setAudioBlob(null);
          } else {
            setAudioBlob(blob);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Audio validation error');
          logError('Audio validation error', err);
          setAudioBlob(null);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateAudioLevel();

      // Start elapsed time counter
      setElapsedTime(0);
      elapsedTimeIntervalRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      logError('Error starting recording', err);
    }
  }, [updateAudioLevel]);

  const start = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setElapsedTime(0);
      chunksRef.current = [];

      // Start countdown
      setCountdown(3);
      let currentCount = 3;

      countdownIntervalRef.current = window.setInterval(() => {
        currentCount -= 1;
        if (currentCount === 0) {
          // Countdown finished
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCountdown(null);
          // Start actual recording
          startActualRecording().catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to start recording');
          });
        } else {
          setCountdown(currentCount);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [startActualRecording]);

  const stop = useCallback(() => {
    // Clean up countdown timer if still running
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setCountdown(null);
    }

    // Clean up elapsed time timer if running
    if (elapsedTimeIntervalRef.current) {
      clearInterval(elapsedTimeIntervalRef.current);
      elapsedTimeIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      setAudioLevel(0);
    }
  }, [isRecording]);

  return {
    isRecording,
    audioLevel,
    audioBlob,
    countdown,
    elapsedTime,
    start,
    stop,
    error,
  };
}
