"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { languageSpeechCode, type LanguageCode } from "./types";

type SpeechResultLike = { isFinal: boolean; 0?: { transcript?: string } };
type RecognitionEvent = { results: ArrayLike<SpeechResultLike> };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionConstructor = new () => RecognitionLike;

function getConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition(language: LanguageCode) {
  const supported = typeof window !== "undefined" && Boolean(getConstructor());
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const languageRef = useRef(language);
  const onErrorRef = useRef<(message: string) => void>(() => {});

  useEffect(() => { languageRef.current = language; }, [language]);

  const setErrorHandler = useCallback((handler: (message: string) => void) => {
    onErrorRef.current = handler;
  }, []);

  const reset = useCallback(() => {
    setFinalText("");
    setInterimText("");
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Constructor = getConstructor();
    if (!Constructor) {
      onErrorRef.current("Live transcription isn't supported in this browser. Try Chrome, or switch to Groq Whisper in Settings.");
      return false;
    }

    const recognition = new Constructor();
    recognitionRef.current = recognition;
    recognition.lang = languageSpeechCode(languageRef.current);
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) final += `${transcript} `;
        else interim += transcript;
      }
      setFinalText(final.trim());
      setInterimText(interim.trim());
    };

    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was blocked. Allow it in your browser to dictate.",
        "service-not-allowed": "Speech service was blocked. Check your browser permissions.",
        "no-speech": "No speech detected. Tap the mic and try again.",
        "audio-capture": "No microphone found. Connect one and try again.",
        network: "Speech recognition needs an internet connection.",
      };
      onErrorRef.current(messages[event.error] ?? `Speech recognition error: ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);
    setFinalText("");
    setInterimText("");

    try {
      recognition.start();
      setListening(true);
      return true;
    } catch {
      onErrorRef.current("Could not start the microphone. Please try again.");
      return false;
    }
  }, []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, listening, finalText, interimText, start, stop, reset, setErrorHandler };
}
