import { createHmac, createHash } from "node:crypto";

/**
 * 방문자 해시 = sha256(ip | ua | 일별 솔트). 일별 솔트 = HMAC(VIEW_HASH_SECRET, YYYY-MM-DD, Asia/Seoul)
 * → 날짜 간 연결 불가, 원본 IP는 저장하지 않는다 (plan.md §8.7).
 */
export function visitorHash(ip: string, userAgent: string, now = new Date()) {
  const secret = process.env.VIEW_HASH_SECRET ?? "dev-only-salt";
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now); // YYYY-MM-DD
  const salt = createHmac("sha256", secret).update(day).digest("hex");
  return createHash("sha256").update(`${ip}|${userAgent}|${salt}`).digest("hex");
}

export function clientIp(headers: Headers) {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "0.0.0.0";
}
