---
inclusion: manual
---

# /qa-review — QA ก่อนโชว์ลูกค้า (รายงานอย่างเดียว ห้ามแก้โค้ดใด ๆ)

ตรวจ `index.html` + `app.js` + `style.css` ตามลำดับนี้ เทียบกับ `.kiro/steering/rules.md`

## 1. DOM contract (ตรวจก่อนเสมอ — พังแล้วไม่มี error ให้เห็น)

- **id ที่ต้องมี 23 ตัว** ครบตามรายการในหัวข้อ 2 ของ `rules.md` และแต่ละตัวถูกอ้างใน `app.js` จริง
  (อีก 6 ตัวที่มี guard — `statusMsg` `txAmountErr` `txCategoryErr` `txDateErr` `spendingChart`
  `spendingTotal` — ไม่มีก็ได้ แต่ให้รายงานว่าฟีเจอร์ไหนหายไป)
- **`[hidden] { display: none !important; }` ยังอยู่ใน `style.css`** และไม่มี class ไหนตั้ง `display` ทับ
  `#storageBanner` `#cancelEditBtn` `#emptyState` และช่อง error ทั้งสาม
- **radio ประเภทรายการ:** ทั้งสองตัวมี `name="type"` ร่วมกัน และมี `checked` อยู่ตัวเดียว
- **`#txForm` มี `novalidate`** (ถ้าหาย ระบบ error ภาษาไทยของแอพจะไม่ทำงาน)
- **สถานะที่เลือกของตัวเลือกรายรับ/รายจ่ายยังมองเห็น** — ถ้า `<input>` อยู่ใน `<label>`
  ต้องใช้ `label:has(input:checked)` ไม่ใช่ `input:checked + label`
- **`[data-i18n]` ทุกตัวอยู่บน element ที่ไม่มีลูก** และข้อความที่ผู้ใช้เห็นทุกจุดมี `data-i18n`
  พร้อม key ที่มีจริงใน `STRINGS`
- **class ที่ JS สร้าง** (`tx__*` `tx-month__*` `spending__*` ตามรายการใน `rules.md`) มี CSS รองรับครบ
- `<script defer src="app.js">` และ `<meta name="viewport">` อยู่ครบ

## 2. Interaction ครบ

ไล่ปุ่ม ฟอร์ม input select ทุกตัวใน `index.html` ว่ามี handler ผูกจริงใน `app.js` (id ตรงกัน
ฟังก์ชันที่อ้างถึงมีจริง) — ระบุตัวที่ขาดเป็นรายตัว เช็คว่า `#submitBtn` ยังเป็นปุ่ม submit ใน `<form>`
และไม่มี element ที่มี `[data-act]` อยู่ใน `#txList` นอกแถว `.tx`

## 3. Error ที่มองเห็นได้จากโค้ด

`getElementById`/`querySelector` ที่ชี้ id ไม่มีจริง · ตัวแปรหรือฟังก์ชันสะกดผิด ·
form submit ที่ไม่มี `preventDefault` · หารด้วยศูนย์ · ค่าที่อาจ undefined ตอน render

## 4. โครงสร้างตาม `rules.md`

มีแค่ 3 ไฟล์ ไม่มีไฟล์ใหม่โผล่มา · ไม่มี dependency / CDN / framework เพิ่ม ·
โค้ดใหม่อยู่ในโซน CONFIG/STATE/HELPERS/RENDER/EVENTS ถูกโซน · ฟังก์ชัน render ใหม่ผูกเข้า `renderAll()` แล้ว

## 5. เพดานคุณภาพ + pre-flight

จุดกด ≥ 44px · contrast AA 4.5:1 ทั้งสองโหมด · `:focus-visible` มองเห็น ·
label อยู่เหนือ input ไม่ใช้ placeholder แทน · 390px ไม่มี scroll แนวนอน ·
เคารพ `prefers-reduced-motion` · มี empty/error/status ครบ ·
ห้าม em-dash ในข้อความที่ผู้ใช้เห็น · ธีมเดียวทั้งหน้า · accent สีเดียว · ระบบ radius เดียว ·
`100dvh` ไม่ใช่ `100vh` · ไม่มี AI tell (gradient ม่วง-ฟ้า, Inter ล้วน, การ์ด 3 ใบเท่ากัน)

## 6. รูปแบบรายงาน

checklist ภาษาไทยสั้น ๆ: ✅ ผ่าน / ⚠️ ปัญหา + วิธีแก้ 1 บรรทัด
ปิดท้ายบรรทัดเดียวว่า **"พร้อมโชว์"** หรือ **"ต้องแก้ N จุดก่อนโชว์"**
