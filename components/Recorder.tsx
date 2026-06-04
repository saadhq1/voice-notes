"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onResult: (transcript: string, groups: { category: string; actions: { text: string; deadline: string | null }[] }[]) => void;
};

export default function Recorder({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function startRecording() {
    setError("");
    setSeconds(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);

      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Microphone access denied. Please allow mic access and try again.");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
    setProcessing(true);
  }

  async function processAudio(blob: Blob) {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const res = await fetch("/api/process", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onResult(data.transcript, data.groups);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setError("");
    const form = new FormData();
    form.append("audio", file);
    try {
      const res = await fetch("/api/process", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onResult(data.transcript, data.groups);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
      e.target.value = "";
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={processing}
        className={`w-24 h-24 rounded-full text-white font-bold text-sm transition-all shadow-lg ${
          recording
            ? "bg-red-500 scale-110"
            : processing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
        }`}
      >
        {recording ? (
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg">⏹</span>
            <span>{formatTime(seconds)}</span>
          </div>
        ) : processing ? (
          "Processing…"
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🎙</span>
            <span>Record</span>
          </div>
        )}
      </button>

      {recording && (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-400 rounded-full animate-pulse"
              style={{
                height: `${12 + Math.random() * 16}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {processing && (
        <p className="text-sm text-gray-500">Transcribing & extracting actions…</p>
      )}

      <div className="text-sm text-gray-400">or</div>
      <label className="cursor-pointer text-sm text-indigo-600 underline">
        Upload audio file
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileUpload}
          disabled={processing || recording}
        />
      </label>

      {error && <p className="text-sm text-red-500 text-center px-2">{error}</p>}
    </div>
  );
}
