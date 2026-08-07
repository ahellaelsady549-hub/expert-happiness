import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Vibrate } from "lucide-react";
import { tasbihPhrases } from "@/data/azkar";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/tasbih")({
  head: () => ({
    meta: [
      { title: "السبحة الإلكترونية — أمتي" },
      { name: "description", content: "سبحة إلكترونية أنيقة مع عدّاد للتسبيح والحمد والتكبير والاستغفار." },
      { property: "og:title", content: "السبحة الإلكترونية — أمتي" },
      { property: "og:description", content: "سبّح واحسب أذكارك بسهولة مع حفظ العدّاد." },
    ],
  }),
  component: TasbihPage,
});

const KEY = "emty-tasbih";

function TasbihPage() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pulse, setPulse] = useState(false);

  const phrase = tasbihPhrases[index]!;
  const count = counts[phrase.text] ?? 0;

  useEffect(() => {
    try {
      setCounts(JSON.parse(localStorage.getItem(KEY) ?? "{}"));
    } catch {
      /* ignore */
    }
  }, []);

  const save = (next: Record<string, number>) => {
    setCounts(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const tap = () => {
    const next = { ...counts, [phrase.text]: count + 1 };
    save(next);
    setPulse(true);
    setTimeout(() => setPulse(false), 220);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(18);
    if (user) {
      void supabase
        .from("tasbih_counts")
        .upsert({ user_id: user.id, phrase: phrase.text, count: count + 1, updated_at: new Date().toISOString() });
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const progress = Math.min(100, Math.round((count / phrase.target) * 100));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold gold-gradient-text">السبحة</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {tasbihPhrases.map((p, i) => (
          <button
            key={p.text}
            onClick={() => setIndex(i)}
            className={`rounded-xl border px-3 py-1.5 text-xs transition-all ${
              i === index ? "border-gold bg-secondary text-gold" : "border-border bg-card"
            }`}
          >
            {p.text}
          </button>
        ))}
      </div>

      <div className="surface mt-6 p-8 text-center">
        <p className="font-display text-3xl leading-relaxed text-gold">{phrase.text}</p>

        <button
          onClick={tap}
          className={`mx-auto mt-8 flex h-48 w-48 select-none items-center justify-center rounded-full hero-gradient text-5xl font-bold text-gold transition-transform duration-150 animate-pulse-ring ${
            pulse ? "scale-95" : "scale-100"
          }`}
        >
          {count}
        </button>

        <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundImage: "var(--gradient-gold)" }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          الهدف {phrase.target} · إجمالي تسبيحاتك {total}
        </p>

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => save({ ...counts, [phrase.text]: 0 })}
            className="inline-flex items-center gap-1 rounded-xl bg-secondary px-4 py-2 text-sm"
          >
            <RotateCcw className="h-4 w-4" /> تصفير هذا الذكر
          </button>
          <button
            onClick={() => save({})}
            className="inline-flex items-center gap-1 rounded-xl border border-border px-4 py-2 text-sm"
          >
            <Vibrate className="h-4 w-4" /> تصفير الكل
          </button>
        </div>
      </div>
    </div>
  );
}
