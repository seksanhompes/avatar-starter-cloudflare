# Patch 3
- api/character/get.ts: คืนค่า avatar_vrm_url โดยใช้ R2_PUBLIC_URL
- app.js: ถ้ามี avatar_vrm_url จะโหลดไฟล์จาก R2; ถ้าไม่มีจะพยายามโหลด /models/base.vrm และแสดง hint ถ้ายังไม่มี
