import { readFileSync } from "node:fs";
import path from "node:path";

/** .env.local 을 읽어 process.env 에 없는 키만 채운다 (dotenv 의존성 없이). */
export function loadLocalEnv(file = ".env.local") {
  try {
    const raw = readFileSync(path.resolve(process.cwd(), file), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, k, v] = m;
      if (process.env[k] === undefined) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {
    /* 파일 없음 */
  }
}
