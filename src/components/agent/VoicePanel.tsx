import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoicePanelProps {
  onTranscript: (text: string) => void;
  lastAssistantMessage: string | null;
  isStreaming: boolean;
}

export default function VoicePanel({ onTranscript, lastAssistantMessage, isStreaming }: VoicePanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) return; // too short

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: formData,
            }
          );

          if (!resp.ok) throw new Error("Transcription failed");
          const data = await resp.json();
          if (data.text?.trim()) {
            onTranscript(data.text.trim());
          }
        } catch (err) {
          console.error("STT error:", err);
          toast.error("Voice transcription failed");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!text || isSpeaking) return;

    // Clean markdown for TTS
    const cleanText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*{1,2}(.*?)\*{1,2}/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[-*]\s/g, "")
      .slice(0, 2000);

    setIsSpeaking(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!resp.ok) throw new Error("TTS failed");

      const audioBlob = await resp.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("TTS error:", err);
      toast.error("Voice playback failed");
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-8">
      {/* Mic button */}
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isStreaming}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isRecording
              ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30"
              : "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isTranscribing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </button>
      </div>

      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {isTranscribing
          ? "Transcribing your speech…"
          : isRecording
          ? "Listening… tap to stop"
          : isStreaming
          ? "AI is responding…"
          : "Tap microphone to speak"}
      </p>

      {/* Speak last response */}
      {lastAssistantMessage && !isStreaming && (
        <button
          onClick={() => (isSpeaking ? stopSpeaking() : speakText(lastAssistantMessage))}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
            isSpeaking
              ? "border-destructive text-destructive hover:bg-destructive/10"
              : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <Volume2 className="h-3.5 w-3.5" />
          {isSpeaking ? "Stop speaking" : "Play response"}
        </button>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        AI responses are for informational purposes only and do not constitute legal advice.
      </p>
    </div>
  );
}
