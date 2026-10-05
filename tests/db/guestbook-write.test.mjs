/**
 * 방명록 직접 DB 접근·작성 제한 매트릭스 (plan.md §12 검증 기준).
 * 테스트 전용 Supabase 프로젝트(.env.test.local)에서만 실행한다: npm run test:db
 * 시간 조건(59초/60초, 24시간)은 private.guestbook_writes.created_at을 직접 옮겨 재현한다.
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  configured,
  anon,
  sql,
  createTestUser,
  deleteTestUser,
  grantAdmin,
  isPermissionError,
} from "./helpers.mjs";

if (!configured) {
  test("DB 테스트 환경 미설정 — 건너뜀 (.env.test.local 필요)", { skip: true }, () => {});
} else {
  let db;
  const users = [];
  const newUser = async (label) => {
    const u = await createTestUser(label);
    users.push(u);
    return u;
  };
  const create = (u, message = "안녕하세요", color = "brand") =>
    u.client.rpc("guestbook_create", { p_message: message, p_color: color });
  /** 이 사용자의 작성 이력을 seconds초 전으로 옮긴다 */
  const ageWrites = (u, seconds) =>
    db`update private.guestbook_writes set created_at = now() - make_interval(secs => ${seconds}) where user_id = ${u.id}`;

  before(() => {
    db = sql();
  });
  after(async () => {
    for (const u of users) {
      await db`delete from private.blocked_users where user_id = ${u.id} or blocked_by = ${u.id}`;
      await db`delete from private.guestbook_writes where user_id = ${u.id}`;
      await db`delete from private.admins where user_id = ${u.id}`;
      await deleteTestUser(u.id);
    }
    await db.end();
  });

  test("anon은 guestbook_create를 실행할 수 없고 테이블도 읽을 수 없다", async () => {
    const r = await anon().rpc("guestbook_create", { p_message: "x", p_color: "brand" });
    assert.ok(r.error, "anon should not execute guestbook_create");
    const t = await anon().from("guestbook").select("id").limit(1);
    assert.ok(isPermissionError(t.error), `expected permission error, got ${t.error?.message}`);
  });

  test("입력 검증: 길이·링크·색상", async () => {
    const u = await newUser("validate");
    assert.match((await create(u, "   ")).error?.message ?? "", /INVALID_LENGTH/);
    assert.match((await create(u, "가".repeat(281))).error?.message ?? "", /INVALID_LENGTH/);
    assert.match((await create(u, "보세요 https://x.io")).error?.message ?? "", /LINK_NOT_ALLOWED/);
    assert.match((await create(u, "놀러와 example.com")).error?.message ?? "", /LINK_NOT_ALLOWED/);
    assert.match((await create(u, "안녕", "red")).error?.message ?? "", /INVALID_COLOR/);
    assert.equal((await create(u, "가".repeat(280), "mint")).error, null);
  });

  test("동시 10건 → 정확히 1건만 성공 (advisory lock)", async () => {
    const u = await newUser("concurrent");
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => create(u, `동시 ${i}`)));
    assert.equal(results.filter((r) => !r.error).length, 1);
    for (const r of results.filter((r) => r.error))
      assert.match(r.error.message, /RATE_LIMIT_MINUTE/);
    const rows = await db`select count(*)::int as n from public.guestbook where user_id = ${u.id}`;
    assert.equal(rows[0].n, 1);
  });

  test("59초 거부 / 60초 허용, 삭제 후 재작성도 거부", async () => {
    const u = await newUser("minute");
    const first = await create(u, "첫 글");
    assert.equal(first.error, null, first.error?.message);

    // 글을 지워도 작성 이력은 남아 제한이 유지된다
    const del = await u.client.from("guestbook").delete().eq("id", first.data[0].id).select("id");
    assert.equal(del.data?.length, 1);
    assert.match((await create(u, "삭제 후 재작성")).error?.message ?? "", /RATE_LIMIT_MINUTE/);

    await ageWrites(u, 59);
    assert.match((await create(u, "59초")).error?.message ?? "", /RATE_LIMIT_MINUTE/);
    await ageWrites(u, 61);
    assert.equal((await create(u, "60초 경과")).error, null);
  });

  test("24시간 5개: 5번째 허용, 6번째 거부, 24시간 지나면 다시 허용", async () => {
    const u = await newUser("daily");
    for (let i = 1; i <= 5; i++) {
      const r = await create(u, `하루 ${i}`);
      assert.equal(r.error, null, `#${i}: ${r.error?.message}`);
      await ageWrites(u, 120 + i); // 1분 제한만 통과시키고 24시간 창 안에 둔다
    }
    assert.match((await create(u, "하루 6")).error?.message ?? "", /RATE_LIMIT_DAY/);
    await ageWrites(u, 24 * 3600 + 60);
    assert.equal((await create(u, "다음 날")).error, null);
  });

  test("임의 INSERT·UPDATE 불가 (created_at·is_hidden·작성자 위조 차단)", async () => {
    const u = await newUser("forge");
    const ins = await u.client.from("guestbook").insert({
      user_id: u.id,
      author_name: "위조",
      message: "직접 삽입",
      color: "brand",
      created_at: "2000-01-01T00:00:00Z",
    });
    assert.ok(isPermissionError(ins.error), `expected permission error, got ${ins.error?.message}`);

    const made = await create(u, "정상 글");
    assert.equal(made.error, null);
    const id = made.data[0].id;
    const upd = await u.client.from("guestbook").update({ message: "수정" }).eq("id", id);
    assert.ok(isPermissionError(upd.error), `expected permission error, got ${upd.error?.message}`);
    // RPC가 준 시각은 서버 now()
    assert.ok(Math.abs(Date.now() - new Date(made.data[0].created_at).getTime()) < 60_000);
    // 표시 컬럼만 반환 (user_id 없음)
    assert.equal("user_id" in made.data[0], false);
  });

  test("삭제는 소유자·관리자만, 숨김 글은 공개 뷰·일반 사용자에게 보이지 않는다", async () => {
    const owner = await newUser("owner");
    const other = await newUser("other");
    const mod = await newUser("mod");
    await grantAdmin(mod.id);

    const made = await create(owner, "숨김 대상");
    const id = made.data[0].id;

    const byOther = await other.client.from("guestbook").delete().eq("id", id).select("id");
    assert.equal(byOther.data?.length ?? 0, 0, "다른 사용자는 삭제할 수 없다");

    const hideByOther = await other.client.rpc("guestbook_set_hidden", {
      p_id: id,
      p_hidden: true,
    });
    assert.match(hideByOther.error?.message ?? "", /FORBIDDEN/);
    assert.equal(
      (await mod.client.rpc("guestbook_set_hidden", { p_id: id, p_hidden: true })).error,
      null,
    );

    assert.equal((await anon().from("guestbook_public").select("id").eq("id", id)).data?.length, 0);
    assert.equal((await other.client.from("guestbook").select("id").eq("id", id)).data?.length, 0);
    assert.equal((await mod.client.from("guestbook").select("id").eq("id", id)).data?.length, 1);
    // 공개 뷰에는 user_id·is_hidden 컬럼이 없다
    const cols = await anon().from("guestbook_public").select("user_id").limit(1);
    assert.ok(cols.error, "guestbook_public must not expose user_id");

    const byAdmin = await mod.client.from("guestbook").delete().eq("id", id).select("id");
    assert.equal(byAdmin.data?.length, 1);
  });

  test("차단: 비관리자 FORBIDDEN, 차단 사용자 작성 거부, 일괄 숨김, 해제 후 복귀", async () => {
    const target = await newUser("blocked");
    const mod = await newUser("mod2");
    await grantAdmin(mod.id);
    const made = await create(target, "차단 전 글");
    assert.equal(made.error, null);

    const denied = await target.client.rpc("admin_block_user", {
      p_user: mod.id,
      p_reason: "x",
      p_hide_all: false,
    });
    assert.match(denied.error?.message ?? "", /FORBIDDEN/);
    assert.equal((await target.client.rpc("admin_list_blocked")).data?.length ?? 0, 0);

    const block = await mod.client.rpc("admin_block_user", {
      p_user: target.id,
      p_reason: "테스트",
      p_hide_all: true,
    });
    assert.equal(block.error, null, block.error?.message);
    await ageWrites(target, 3600); // 시간 제한이 아니라 차단 때문에 거부되는지 확인
    assert.match((await create(target, "차단 후")).error?.message ?? "", /USER_BLOCKED/);
    assert.equal(
      (await anon().from("guestbook_public").select("id").eq("id", made.data[0].id)).data?.length,
      0,
    );
    const list = await mod.client.rpc("admin_list_blocked");
    assert.ok(list.data.some((b) => b.user_id === target.id));

    assert.equal((await mod.client.rpc("admin_unblock_user", { p_user: target.id })).error, null);
    assert.equal((await create(target, "해제 후")).error, null);
  });

  test("작성 이력(private 스키마)은 사용자에게 노출되지 않는다", async () => {
    const u = await newUser("private");
    const r = await u.client.schema("private").from("guestbook_writes").select("*");
    assert.ok(r.error, "private schema must not be reachable");
  });
}
