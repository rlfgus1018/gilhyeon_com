export { cn } from "cn";

/** 날짜만 표시 (Asia/Seoul 기준, 한국어 형식) */
export function formatDate(input: string | Date, opts?: { withYear?: boolean }) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: opts?.withYear === false ? undefined : "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(d);
}
