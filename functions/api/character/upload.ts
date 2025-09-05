export const onRequestPost = async ({ request, env }) => {
  const { json, bad, getCookie } = await import("../../../_utils.ts");
  const sid = getCookie(request, "sid");
  if (!sid) return bad("unauth", 401);
  const sess = await env.SESSIONS.get(`sid:${sid}`);
  if (!sess) return bad("session expired", 401);

  const ct = request.headers.get("content-type") || "application/octet-stream";
  const key = `avatars/${sid}/${Date.now()}.vrm`;
  const ab = await request.arrayBuffer();
  await env.AVATARS.put(key, ab, { httpMetadata: { contentType: ct } });

  await env.DB.prepare(`
    INSERT INTO characters (user_id, avatar_config, avatar_vrm_key, updated_at)
    VALUES (?, COALESCE((SELECT avatar_config FROM characters WHERE user_id=?), '{}'), ?, strftime('%s','now')*1000)
    ON CONFLICT(user_id) DO UPDATE SET avatar_vrm_key=excluded.avatar_vrm_key, updated_at=excluded.updated_at
  `).bind(sid, sid, key).run();

  const url = `${env.R2_PUBLIC_URL}/${key}`;
  return json({ ok:true, key, url });
};
