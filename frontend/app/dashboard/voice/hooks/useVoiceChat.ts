"use client";

import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";

export function useVoiceChat(onTranscription: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());

        // Send to API
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        try {
          const res = await api.post("/api/voice/transcribe", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (res.data && res.data.text) {
            onTranscription(res.data.text);
          }
        } catch (error) {
          console.error("Transcription failed:", error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  }, [onTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const synthesizeAndPlay = useCallback(async (text: string) => {
    try {
      setIsPlaying(true);
      const res = await api.post("/api/voice/synthesize", { text, voice: "alloy" }, {
        responseType: "blob"
      });
      
      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      audioPlayerRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (err) {
      console.error("TTS failed:", err);
      setIsPlaying(false);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return {
    isRecording,
    isPlaying,
    isProcessing,
    startRecording,
    stopRecording,
    synthesizeAndPlay,
    stopPlayback
  };
}
