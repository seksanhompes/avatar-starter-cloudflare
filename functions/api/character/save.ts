export const onRequestPost = async ({ request, env }) => {
  const { json, bad, getCookie } = await import("../../../_utils.ts");
  const sid = getCookie(request, "sid");
  if (!sid) return bad("unauth", 401);
  const sess = await env.SESSIONS.get(`sid:${sid}`);
  if (!sess) return bad("session expired", 401);

  const body = await request.json().catch(() => null);
  if (!body || !body.avatar_config) return bad("missing avatar_config");

  const cfgStr = JSON.stringify(body.avatar_config);
  await env.DB.prepare(`
    INSERT INTO characters (user_id, avatar_config, avatar_vrm_key, updated_at)
    VALUES (?, ?, COALESCE(?, (SELECT avatar_vrm_key FROM characters WHERE user_id=?)), strftime('%s','now')*1000)
    ON CONFLICT(user_id) DO UPDATE SET avatar_config=excluded.avatar_config, updated_at=excluded.updated_at
  `).bind(sid, cfgStr, body.avatar_vrm_key || null, sid).run();

  return json({ ok:true });
};
