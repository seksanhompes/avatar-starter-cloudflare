# Avatar Creator • Cloudflare-only (Pages + Functions + D1 + KV + R2 + Turnstile)

## ขั้นตอนเร็ว
1) สร้าง D1, KV, R2, Turnstile ใน Cloudflare
2) ตั้งค่า Pages → Functions Bindings:
   - D1: DB
   - KV: SESSIONS
   - R2: AVATARS
   - Env: TURNSTILE_SECRET, R2_PUBLIC_URL
3) เปิดไฟล์ `index.html` แล้วแทนที่ `__TURNSTILE_SITE_KEY__` ด้วย site key จริง
4) ใส่โมเดลที่ `models/base.vrm`
5) อัปโหลดโฟลเดอร์นี้ด้วย Direct Upload ไปที่ Cloudflare Pages

เสร็จ! ล็อกอินผ่าน Turnstile → ปรับอวาตาร์ → บันทึก (D1) → อัปโหลด VRM (R2)
