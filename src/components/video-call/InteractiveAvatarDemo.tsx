/**
 * InteractiveAvatarDemo
 *
 * Example component demonstrating how to use the InteractiveAvatar
 * component and useInteractiveAvatar hook.
 *
 * This shows both approaches:
 * 1. Component-based (InteractiveAvatar)
 * 2. Hook-based (useInteractiveAvatar)
 */

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Play,
  Square,
  Mic,
  MicOff,
  MessageSquare,
  Sparkles,
} from "lucide-react";

// ============================================================================
// APPROACH 1: Using the Component
// ============================================================================

import InteractiveAvatar, {
  InteractiveAvatarHandle,
  AvatarQuality,
  VoiceEmotion,
} from "./InteractiveAvatar";

export function ComponentBasedDemo() {
  const avatarRef = useRef<InteractiveAvatarHandle>(null);
  const [isActive, setIsActive] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);

  const handleStart = async () => {
    await avatarRef.current?.start();
  };

  const handleStop = async () => {
    await avatarRef.current?.stop();
  };

  const handleSpeak = async () => {
    if (!textInput.trim()) return;
    await avatarRef.current?.speak(textInput);
    setTranscript((prev) => [...prev, `Tu (REPEAT): ${textInput}`]);
    setTextInput("");
  };

  const handleTalk = async () => {
    if (!textInput.trim()) return;
    await avatarRef.current?.talk(textInput);
    setTranscript((prev) => [...prev, `Tu (TALK): ${textInput}`]);
    setTextInput("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Approccio 1: Component-Based</h2>

      {/* Avatar Video Container */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
        <InteractiveAvatar
          ref={avatarRef}
          avatarId="Bryan_IT_Sitting_public"
          quality={AvatarQuality.High}
          emotion={VoiceEmotion.FRIENDLY}
          language="it"
          className="w-full h-full"
          onStateChange={(state) => setIsActive(state === "active")}
          onAvatarMessage={(msg) =>
            setTranscript((prev) => [...prev, `Avatar: ${msg}`])
          }
          onUserMessage={(msg) =>
            setTranscript((prev) => [...prev, `Tu (Voice): ${msg}`])
          }
          onError={(err) => console.error("Avatar error:", err)}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isActive ? (
          <Button onClick={handleStart} className="gap-2">
            <Play className="w-4 h-4" />
            Avvia Sessione
          </Button>
        ) : (
          <Button onClick={handleStop} variant="destructive" className="gap-2">
            <Square className="w-4 h-4" />
            Termina Sessione
          </Button>
        )}

        <Button
          onClick={() => avatarRef.current?.startVoiceChat()}
          disabled={!isActive}
          variant="outline"
          className="gap-2"
        >
          <Mic className="w-4 h-4" />
          Voice Chat
        </Button>
      </div>

      {/* Text Input */}
      <div className="flex gap-3">
        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Scrivi qualcosa per l'avatar..."
          disabled={!isActive}
          onKeyDown={(e) => e.key === "Enter" && handleSpeak()}
        />
        <Button onClick={handleSpeak} disabled={!isActive} className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Speak
        </Button>
        <Button
          onClick={handleTalk}
          disabled={!isActive}
          variant="secondary"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Talk (LLM)
        </Button>
      </div>

      {/* Transcript */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 max-h-48 overflow-y-auto">
        <h3 className="font-medium mb-2">Transcript</h3>
        {transcript.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessun messaggio ancora...
          </p>
        ) : (
          <div className="space-y-1">
            {transcript.map((msg, i) => (
              <p key={i} className="text-sm">
                {msg}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// APPROACH 2: Using the Hook
// ============================================================================

import { useInteractiveAvatar } from "@/hooks/useInteractiveAvatar";

export function HookBasedDemo() {
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [voiceChatOn, setVoiceChatOn] = useState(false);

  const {
    videoRef,
    state,
    isSpeaking,
    isUserSpeaking,
    error,
    start,
    stop,
    speak,
    talk,
    startVoiceChat,
    stopVoiceChat,
    interrupt,
  } = useInteractiveAvatar({
    avatarId: "Anna_public", // Female avatar
    language: "it",
    quality: "high",
    emotion: "friendly",
    onAvatarStartSpeaking: () => console.log("Avatar started speaking"),
    onAvatarStopSpeaking: () => console.log("Avatar stopped speaking"),
    onAvatarMessage: (msg) =>
      setTranscript((prev) => [...prev, `Avatar: ${msg}`]),
    onUserStartSpeaking: () => console.log("User started speaking"),
    onUserStopSpeaking: () => console.log("User stopped speaking"),
    onUserMessage: (msg) =>
      setTranscript((prev) => [...prev, `Tu (Voice): ${msg}`]),
    onSessionReady: (id) => console.log("Session ready:", id),
    onError: (err) => console.error("Error:", err),
  });

  const handleSpeak = async () => {
    if (!textInput.trim()) return;
    try {
      await speak(textInput);
      setTranscript((prev) => [...prev, `Tu: ${textInput}`]);
      setTextInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVoiceChat = async () => {
    if (voiceChatOn) {
      await stopVoiceChat();
      setVoiceChatOn(false);
    } else {
      await startVoiceChat();
      setVoiceChatOn(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Approccio 2: Hook-Based</h2>

      {/* Avatar Video Container */}
      <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* State Overlays */}
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
          </div>
        )}

        {state === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white">Connessione in corso...</p>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
            <div className="text-center text-white">
              <p className="text-lg">Errore</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary/80 px-3 py-1 rounded-full">
            <span className="text-sm text-white">Sta parlando...</span>
          </div>
        )}

        {/* User Speaking Indicator */}
        {isUserSpeaking && (
          <div className="absolute top-4 right-4 bg-green-500/80 px-3 py-1 rounded-full">
            <span className="text-sm text-white">Ti ascolto...</span>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">Stato:</span>
        <span
          className={`px-2 py-0.5 rounded ${
            state === "active"
              ? "bg-green-100 text-green-800"
              : state === "error"
              ? "bg-red-100 text-red-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {state}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        {state !== "active" ? (
          <Button
            onClick={start}
            disabled={state === "loading" || state === "connecting"}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            Avvia
          </Button>
        ) : (
          <>
            <Button onClick={stop} variant="destructive" className="gap-2">
              <Square className="w-4 h-4" />
              Stop
            </Button>

            <Button
              onClick={toggleVoiceChat}
              variant={voiceChatOn ? "secondary" : "outline"}
              className="gap-2"
            >
              {voiceChatOn ? (
                <>
                  <MicOff className="w-4 h-4" />
                  Stop Voice
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Voice Chat
                </>
              )}
            </Button>

            <Button
              onClick={interrupt}
              variant="outline"
              disabled={!isSpeaking}
            >
              Interrompi
            </Button>
          </>
        )}
      </div>

      {/* Text Input */}
      <div className="flex gap-3">
        <Input
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Scrivi qui..."
          disabled={state !== "active"}
          onKeyDown={(e) => e.key === "Enter" && handleSpeak()}
          className="flex-1"
        />
        <Button onClick={handleSpeak} disabled={state !== "active"}>
          Parla
        </Button>
        <Button
          onClick={async () => {
            if (!textInput.trim()) return;
            await talk(textInput);
            setTranscript((prev) => [...prev, `Tu (LLM): ${textInput}`]);
            setTextInput("");
          }}
          disabled={state !== "active"}
          variant="secondary"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Talk
        </Button>
      </div>

      {/* Transcript */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 max-h-48 overflow-y-auto">
        <h3 className="font-medium mb-2">Transcript</h3>
        {transcript.length === 0 ? (
          <p className="text-sm text-muted-foreground">In attesa...</p>
        ) : (
          <div className="space-y-1">
            {transcript.map((msg, i) => (
              <p key={i} className="text-sm">
                {msg}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DEMO PAGE
// ============================================================================

export default function InteractiveAvatarDemo() {
  const [approach, setApproach] = useState<"component" | "hook">("hook");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">LiveAvatar Demo</h1>

        {/* Approach Selector */}
        <div className="flex gap-2 mb-8">
          <Button
            variant={approach === "component" ? "default" : "outline"}
            onClick={() => setApproach("component")}
          >
            Component-Based
          </Button>
          <Button
            variant={approach === "hook" ? "default" : "outline"}
            onClick={() => setApproach("hook")}
          >
            Hook-Based
          </Button>
        </div>

        {/* Demo Content */}
        {approach === "component" ? <ComponentBasedDemo /> : <HookBasedDemo />}

        {/* Usage Guide */}
        <div className="mt-12 prose dark:prose-invert max-w-none">
          <h2>Guida Rapida</h2>

          <h3>1. REPEAT Mode (speak)</h3>
          <p>
            L'avatar ripete esattamente il testo che invii. Usa questo quando hai
            già l'audio da un altro sistema (es. VAPI) e vuoi solo il lip-sync.
          </p>

          <h3>2. TALK Mode (talk)</h3>
          <p>
            L'avatar usa l'LLM di HeyGen per generare una risposta. Utile per
            conversazioni standalone senza un LLM esterno.
          </p>

          <h3>3. Voice Chat</h3>
          <p>
            Abilita il microfono dell'utente. L'avatar ascolta, trascrive e
            risponde automaticamente (usa TALK mode internamente).
          </p>

          <h3>Differenza tra Component e Hook</h3>
          <ul>
            <li>
              <strong>Component:</strong> Più semplice, include già UI per stati
              loading/error. Ideale per casi d'uso standard.
            </li>
            <li>
              <strong>Hook:</strong> Più flessibile, ti dà pieno controllo sul
              rendering. Ideale per UI personalizzate.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
