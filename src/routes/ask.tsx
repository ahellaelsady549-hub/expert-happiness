import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { askQuestion } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "اسأل ترتيل — مساعد ديني ذكي | أمتي" },
      {
        name: "description",
        content: "اطرح أسئلتك الدينية واحصل على إجابة مؤصلة من مساعد ترتيل الذكي داخل موقع أمتي.",
      },
      { property: "og:title", content: "اسأل ترتيل — مساعد ديني ذكي" },
      { property: "og:description", content: "إجابات دينية مبسّطة ومؤصّلة على مدار الساعة." },
    ],
  }),
  component: AskPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "ما فضل قيام الليل وكيف أواظب عليه؟",
  "كيف أخشع في صلاتي؟",
  "ما حكم قضاء الصيام المتأخر؟",
  "ما هي آداب الدعاء المستجاب؟",
];

function AskPage() {
  const ask = useServerFn(askQuestion);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text: string) => {
    const question = text.trim();
    if (question.length < 3 || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { question } });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="flex items-center gap-2 text-3xl font-bold gold-gradient-text">
        <Sparkles className="h-7 w-7 text-gold" /> اسأل ترتيل
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        مساعد ديني ذكي يجيب عن أسئلتك بأسلوب مبسّط ومؤصّل. للمسائل الخاصة والدقيقة يُرجى مراجعة أهل
        العلم.
      </p>

      {messages.length === 0 && (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              className="surface p-4 text-right text-sm transition-all hover:-translate-y-0.5 hover:border-gold"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`animate-fade-up rounded-2xl p-5 ${
              m.role === "user" ? "border border-gold/40 bg-secondary/70" : "surface leading-9"
            }`}
          >
            <p className="mb-1 text-xs text-gold">{m.role === "user" ? "سؤالك" : "ترتيل"}</p>
            {m.role === "assistant" ? (
              <div className="markdown-answer leading-9">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <p>{m.content}</p>
            )}
          </div>
        ))}
        {loading && (
          <div className="surface flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> ترتيل يبحث لك عن الإجابة...
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="surface sticky bottom-4 mt-6 flex items-center gap-2 p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب سؤالك الديني هنا..."
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl hero-gradient text-gold disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
