"use client";

import { FormEvent, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { AiDisclaimer } from "@/components/ai/AiDisclaimer";
import { chatAssistant } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string; sources?: string[] };

export default function AsistentePage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Soy tu copiloto agrícola. Pregúntame sobre fertilización, siembra, plagas o clima en Manabí.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const history = next
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await chatAssistant(text, history);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.reply, sources: res.sources },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? `No pude responder: ${err.message}`
              : "Error de conexión con la API.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4rem)] max-w-2xl flex-col animate-fade-up">
      <header className="mb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-leaf">Copiloto</p>
        <h1 className="font-display text-3xl text-forest mt-1">Asistente IA</h1>
        <div className="mt-3">
          <AiDisclaimer compact />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-forest/10 bg-cream p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-8 rounded-2xl rounded-br-md bg-leaf px-3.5 py-2.5 text-sm text-white"
                : "mr-8 rounded-2xl rounded-bl-md bg-white border border-forest/10 px-3.5 py-2.5 text-sm text-ink"
            }
          >
            <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
            {m.sources && m.sources.length > 0 && (
              <p className="mt-2 text-[10px] text-ink/40">Fuentes: {m.sources.join(" · ")}</p>
            )}
          </div>
        ))}
        {loading && (
          <p className="flex items-center gap-2 text-xs text-ink/45">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando clima e historial…
          </p>
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="¿Puedo fertilizar cacao hoy?"
          className="flex-1 rounded-xl border border-forest/15 bg-white px-4 py-3 text-sm outline-none focus:border-leaf"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="grid h-12 w-12 place-items-center rounded-xl bg-forest text-cream disabled:opacity-40 hover:bg-leaf-dark"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
