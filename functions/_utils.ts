export const json = (data: any, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" }, ...init });

export const bad = (msg = "bad request", code = 400) =>
  json({ ok: false, error: msg }, { status: code });

export const getCookie = (req: Request, name: string) => {
  const c = req.headers.get("cookie") || "";
  const m = c.match(new RegExp("(^|; )"+name+"=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
};

export const setCookieHeader = (name: string, value: string, maxAgeSec = 60*60*24*30) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;

export async function verifyTurnstile(secret: string, token: string, ip?: string|null) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method:"POST", body:form });
  const data = await r.json();
  return !!data.success;
}
