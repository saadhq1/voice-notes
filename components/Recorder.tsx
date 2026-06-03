"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  onResult: (transcript: string, actions: string[]) => void;
};

export default function Recorder({ onResult }: Props) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalRef = useRef("");

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function startRecording() {
    setError("");
    setInterim("");
    finalRef.current = "";

    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Your browser doesn't support speech recognition. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalRef.current += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      setError(`Mic error: ${event.error}`);
      setRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setRecording(true);
  }

  async function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterim("");
    const transcript = finalRef.current.trim();
    if (!transcript) {
      setError("No speech detected. Try again.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onResult(transcript, data.actions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={processing}
        className={`w-20 h-20 rounded-full text-white font-bold text-sm transition-all shadow-lg ${
          recording
            ? "bg-red-500 animate-pulse scale-110"
            : processing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {recording ? "Stop" : processing ? "…" : "Record"}
      </button>

      {recording && interim && (
        <p className="text-sm text-gray-400 italic text-center px-4">{interim}</p>
      )}

      {processing && (
        <p className="text-sm text-gray-500">Extracting actions…</p>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
