/**
 * DB 권한 테스트 하네스. 테스트 전용 Supabase 프로젝트를 가리키는 .env.test.local 의
 *   TEST_SUPABASE_URL, TEST_SUPABASE_PUBLISHABLE_KEY, TEST_SUPABASE_SECRET_KEY, TEST_SUPABASE_DB_URL
 * 를 사용한다. 실행: node --env-file=.env.test.local --test tests/db/
 * 테스트 사용자는 secret key의 Auth Admin API로 만들고 끝나면 지운다 (이메일/비밀번호 로그인은 테스트 프로젝트에서만 활성화).
 */
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

export const ENV = {
  url: process.env.TEST_SUPABASE_URL,
  anonKey: process.env.TEST_SUPABASE_PUBLISHABLE_KEY,
  secretKey: process.env.TEST_SUPABASE_SECRET_KEY,
  dbUrl: process.env.TEST_SUPABASE_DB_URL,
};
export const configured = Boolean(ENV.url && ENV.anonKey && ENV.secretKey && ENV.dbUrl);

const opts = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
export const anon = () => createClient(ENV.url, ENV.anonKey, opts);
export const admin = () => createClient(ENV.url, ENV.secretKey, opts);
export const sql = () => postgres(ENV.dbUrl, { max: 1, prepare: false, onnotice: () => {} });

/** 테스트 사용자 생성 + 로그인된 클라이언트 반환 */
export async function createTestUser(label) {
  const email = `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = `pw-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const { data, error } = await admin().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  const client = createClient(ENV.url, ENV.anonKey, opts);
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, email, client };
}

export async function deleteTestUser(id) {
  await admin().auth.admin.deleteUser(id);
}

export async function grantAdmin(userId) {
  const db = sql();
  try {
    await db`insert into private.admins (user_id, note) values (${userId}, 'test') on conflict do nothing`;
  } finally {
    await db.end();
  }
}

export const isPermissionError = (error) =>
  Boolean(error) &&
  (/permission denied|violates row-level security|42501/i.test(error.message) ||
    error.code === "42501");
