/**
 * 공개 서버 번들 점검 (plan.md §10 성능·P6 DoD).
 * `next build` 결과(.next/server/app)에서 관리자 밖 경로의 서버 청크에
 * 마크다운 컴파일러(shiki·unified·katex)나 에디터(CodeMirror)가 들어가지 않았는지 확인한다.
 *   npm run build && node scripts/check-bundle.mjs
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SERVER_APP = path.join(ROOT, ".next", "server", "app");
const FORBIDDEN = [
  { name: "shiki", re: /node_modules[\\/](?:shiki|@shikijs)[\\/]/ },
  {
    name: "unified/remark/rehype",
    re: /node_modules[\\/](?:unified|remark-[a-z-]+|rehype-[a-z-]+)[\\/]/,
  },
  { name: "katex", re: /node_modules[\\/](?:katex|rehype-katex)[\\/]/ },
  {
    name: "codemirror",
    re: /node_modules[\\/](?:@codemirror|@uiw[\\/]react-codemirror|codemirror)[\\/]/,
  },
];
// 관리자 경로는 컴파일러·에디터를 쓰는 곳이므로 제외
const ALLOWED_DIR = /^admin[\\/]/;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

try {
  await stat(SERVER_APP);
} catch {
  console.error(`'${SERVER_APP}' 가 없습니다. 먼저 npm run build 를 실행하세요.`);
  process.exit(2);
}

// 각 라우트의 .js.nft.json(트레이스)에서 참조 파일 목록을 본다 — 런타임에 실제 로드되는 의존성 기준
const traces = (await walk(SERVER_APP)).filter(
  (f) => f.endsWith(".nft.json") && !ALLOWED_DIR.test(path.relative(SERVER_APP, f)),
);
if (traces.length === 0) {
  console.error("트레이스 파일(*.nft.json)을 찾지 못했습니다.");
  process.exit(2);
}

const problems = [];
for (const t of traces) {
  const { files = [] } = JSON.parse(await readFile(t, "utf8"));
  for (const rule of FORBIDDEN) {
    const hit = files.find((f) => rule.re.test(f));
    if (hit) problems.push({ route: path.relative(SERVER_APP, t), rule: rule.name, hit });
  }
}

console.log(`검사한 공개 라우트 트레이스: ${traces.length}개`);
if (problems.length) {
  console.error("공개 서버 번들에 금지된 의존성이 있습니다:");
  for (const p of problems) console.error(`  ${p.route}  ←  ${p.rule}  (${p.hit})`);
  process.exit(1);
}
console.log("OK: 공개 서버 번들에 shiki·unified·katex·CodeMirror 없음");
