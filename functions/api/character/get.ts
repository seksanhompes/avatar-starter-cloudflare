export const onRequestGet = async ({ request, env }) => {
  const { json, bad, getCookie } = await import("../../_utils.ts");
  const sid = getCookie(request, "sid");
  if (!sid) return bad("unauth", 401);
  const sess = await env.SESSIONS.get(`sid:${sid}`);
  if (!sess) return bad("session expired", 401);

  const row = await env.DB.prepare("SELECT avatar_config, avatar_vrm_key FROM characters WHERE user_id=?").bind(sid).first();
  return json({ ok:true, data: row ? { 
    avatar_config: JSON.parse(row.avatar_config), 
    avatar_vrm_key: row.avatar_vrm_key || null 
  } : null });
};
