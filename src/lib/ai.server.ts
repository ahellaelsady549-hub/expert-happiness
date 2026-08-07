const SYSTEM_PROMPT = `أنت "ترتيل"، مساعد إسلامي عربي مهذّب ورصين داخل موقع "أمتي".
قواعدك:
- أجب باللغة العربية الفصحى المبسطة وبأسلوب راقٍ ومختصر ومنظّم.
- استند إلى القرآن الكريم والسنة النبوية الصحيحة وأقوال جمهور أهل العلم، واذكر الدليل عند الإمكان.
- إذا كانت المسألة خلافية، اذكر أن فيها خلافًا بين العلماء واعرض القول الراجح عند الجمهور.
- لا تُفتِ في مسائل خطيرة أو شخصية معقّدة (طلاق، مواريث، دماء، معاملات مالية معقدة) بل انصح بسؤال عالم أو دار إفتاء موثوقة.
- لا تختلق أحاديث ولا تنسب قولًا لعالم دون تيقّن.
- اختم بنصيحة قصيرة أو دعاء عند المناسبة.
- إن كان السؤال خارج المجال الديني، أجب بلطف واذكر أن تخصصك الأسئلة الدينية.`;

export async function askIslamicAi(question: string, apiKey: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: question },
      ],
    }),
  });

  if (res.status === 429) throw new Error("عدد الطلبات كبير الآن، حاول بعد قليل.");
  if (res.status === 402) throw new Error("انتهى رصيد الذكاء الاصطناعي، يرجى إضافة رصيد.");
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, detail);
    throw new Error("تعذّر الحصول على إجابة الآن، حاول مرة أخرى.");
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content?.trim() || "لم أتمكن من صياغة إجابة، أعد صياغة سؤالك.";
}
