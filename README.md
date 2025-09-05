# Avatar Creator • Cloudflare-only (Pages + Functions + D1 + KV + R2 + Turnstile)

Bindings ที่ต้องมี: DB=D1, SESSIONS=KV, AVATARS=R2; ENV: TURNSTILE_SECRET, R2_PUBLIC_URL

1) รัน D1 ด้วย d1/001_init.sql
2) ใส่ Site Key ลง index.html (`__TURNSTILE_SITE_KEY__`)
3) อัปโหลด Direct Upload ไป Pages
