export const onRequestPost = async ({ request, env }) => {
  const { token, handle } = await request.json().catch(() => ({}));
  if (!token) return new Response("missing turnstile token", { status: 400 });

  const ip = request.headers.get("CF-Connecting-IP");
  const { verifyTurnstile, setCookieHeader } = await import("../../_utils.ts");
  const ok = await verifyTurnstile(env.TURNSTILE_SECRET, token, ip);
  if (!ok) return new Response("turnstile failed", { status: 403 });

  const sid = crypto.randomUUID();
  await env.SESSIONS.put(`sid:${sid}`, JSON.stringify({ user_id: sid, t: Date.now() }), { expirationTtl: 60*60*24*30 });

  await env.DB.prepare("INSERT OR IGNORE INTO users (id, handle) VALUES (?, ?)").bind(sid, handle || null).run();

  return new Response(JSON.stringify({ ok:true, user_id: sid }), {
    headers: {
      "content-type":"application/json",
      "set-cookie": setCookieHeader("sid", sid)
    }
  });
};
