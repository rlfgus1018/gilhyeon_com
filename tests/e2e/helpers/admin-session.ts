import { createClient, type Session } from "@supabase/supabase-js";
import postgres from "postgres";
import { loadLocalEnv } from "./env";

loadLocalEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SECRET = process.env.SUPABASE_SECRET_KEY!;
const DB_URL = process.env.SUPABASE_DB_URL!;

export const e2eConfigured = Boolean(URL && ANON && SECRET && DB_URL);

const opts = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
export const anonClient = () => createClient(URL, ANON, opts);
export const adminClient = () => createClient(URL, SECRET, opts);

/** @supabase/ssr 쿠키 인코딩: "base64-" + base64url(JSON(session)), 3180자 초과 시 name.0, name.1 … 조각 */
export function sessionToCookies(session: Session, domain: string) {
  const ref = new globalThis.URL(URL).hostname.split(".")[0];
  const name = `sb-${ref}-auth-token`;
  const encoded = "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const CHUNK = 3180;
  const values = encoded.length <= CHUNK ? [[name, encoded] as const] : [];
  if (!values.length) {
    for (let i = 0, n = 0; i < encoded.length; i += CHUNK, n++)
      values.push([`${name}.${n}`, encoded.slice(i, i + CHUNK)] as const);
  }
  return values.map(([n, v]) => ({
    name: n,
    value: v,
    domain,
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  }));
}

export type TestAdmin = {
  id: string;
  email: string;
  cookies: ReturnType<typeof sessionToCookies>;
  cleanup: () => Promise<void>;
};

/** 임시 이메일/비밀번호 관리자: Auth Admin API로 생성 → private.admins 등록 → 비밀번호 로그인으로 세션 획득 */
export async function createTestAdmin(baseURL: string): Promise<TestAdmin> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `e2e-admin-${stamp}@example.com`;
  const password = `E2e!${stamp}${Math.random().toString(36).slice(2)}`;
  const admin = adminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "E2E 관리자" },
  });
  if (created.error) throw created.error;
  const id = created.data.user.id;

  const sql = postgres(DB_URL, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await sql`insert into private.admins (user_id, note) values (${id}, 'e2e') on conflict do nothing`;
  } finally {
    await sql.end();
  }

  const signIn = await anonClient().auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.session) throw signIn.error ?? new Error("no session");
  const domain = new globalThis.URL(baseURL).hostname;

  return {
    id,
    email,
    cookies: sessionToCookies(signIn.data.session, domain),
    cleanup: async () => {
      const db = postgres(DB_URL, { max: 1, prepare: false, onnotice: () => {} });
      try {
        await db`delete from public.posts where slug like 'e2e-%'`;
        await db`delete from public.media where alt_default like 'e2e-%'`;
      } finally {
        await db.end();
      }
      await admin.auth.admin.deleteUser(id);
    },
  };
}
