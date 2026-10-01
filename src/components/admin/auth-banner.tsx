const MESSAGES: Record<string, { tone: string; text: string }> = {
  cancelled: { tone: "border-amber bg-amber-soft", text: "로그인이 취소됐어요." },
  failed: { tone: "border-coral bg-coral-soft", text: "로그인에 실패했어요. 다시 시도해 주세요." },
  unavailable: {
    tone: "border-coral bg-coral-soft",
    text: "로그인 서비스를 잠시 사용할 수 없어요.",
  },
  expired: { tone: "border-amber bg-amber-soft", text: "세션이 만료됐어요. 다시 로그인해 주세요." },
};

export function AuthBanner({ code }: { code?: string }) {
  if (!code || !MESSAGES[code]) return null;
  const m = MESSAGES[code];
  return (
    <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${m.tone}`}>
      {m.text}
    </p>
  );
}
