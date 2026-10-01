import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  configured,
  anon,
  createTestUser,
  deleteTestUser,
  grantAdmin,
  isPermissionError,
} from "./helpers.mjs";

if (!configured) {
  test("DB 테스트 환경 미설정 — 건너뜀 (.env.test.local 필요)", { skip: true }, () => {});
} else {
  let normal, adminUser;
  before(async () => {
    normal = await createTestUser("normal");
    adminUser = await createTestUser("admin");
    await grantAdmin(adminUser.id);
  });
  after(async () => {
    const a = (await import("./helpers.mjs")).admin();
    await a.from("posts").delete().like("slug", "rls-test-%");
    await deleteTestUser(normal.id);
    await deleteTestUser(adminUser.id);
  });

  test("일반 사용자는 posts INSERT가 거부된다", async () => {
    const { error } = await normal.client
      .from("posts")
      .insert({ slug: "rls-test-normal", title: "x" });
    assert.ok(isPermissionError(error), `expected permission error, got ${error?.message}`);
  });

  test("관리자는 초안을 만들 수 있고, anon·일반 사용자는 초안을 볼 수 없다", async () => {
    const slug = `rls-test-draft-${Date.now()}`;
    const ins = await adminUser.client
      .from("posts")
      .insert({ slug, title: "draft" })
      .select("id")
      .single();
    assert.equal(ins.error, null, ins.error?.message);

    const asAnon = await anon().from("posts").select("id").eq("slug", slug);
    assert.equal(asAnon.data?.length, 0);
    const asNormal = await normal.client.from("posts").select("id").eq("slug", slug);
    assert.equal(asNormal.data?.length, 0);
    const asAdmin = await adminUser.client.from("posts").select("id").eq("slug", slug);
    assert.equal(asAdmin.data?.length, 1);
  });

  test("anon은 private 스키마에 접근할 수 없다", async () => {
    const { error } = await anon().schema("private").from("admins").select("*");
    assert.ok(error, "expected an error for private schema access");
  });

  test("is_admin RPC: 관리자 true, 일반 false, anon은 실행 불가", async () => {
    assert.equal((await adminUser.client.rpc("is_admin")).data, true);
    assert.equal((await normal.client.rpc("is_admin")).data, false);
    const asAnon = await anon().rpc("is_admin");
    assert.ok(asAnon.error, "anon should not execute is_admin");
  });

  test("record_view·maintenance_daily는 anon/authenticated가 호출할 수 없다", async () => {
    const r1 = await anon().rpc("record_view", { p_slug: "x", p_visitor_hash: "a".repeat(64) });
    assert.ok(r1.error);
    const r2 = await normal.client.rpc("maintenance_daily");
    assert.ok(r2.error);
  });

  test("일반 사용자는 guestbook_set_hidden / admin_block_user에서 FORBIDDEN", async () => {
    const r1 = await normal.client.rpc("guestbook_set_hidden", {
      p_id: "00000000-0000-0000-0000-000000000000",
      p_hidden: true,
    });
    assert.match(r1.error?.message ?? "", /FORBIDDEN/);
    const r2 = await normal.client.rpc("admin_block_user", {
      p_user: adminUser.id,
      p_reason: "x",
      p_hide_all: false,
    });
    assert.match(r2.error?.message ?? "", /FORBIDDEN/);
  });

  test("관리자는 자기 자신을 차단할 수 없다", async () => {
    const r = await adminUser.client.rpc("admin_block_user", {
      p_user: adminUser.id,
      p_reason: "x",
      p_hide_all: false,
    });
    assert.match(r.error?.message ?? "", /CANNOT_BLOCK_SELF/);
  });
}
