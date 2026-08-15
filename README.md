# Kiro FDE Workshop — แอพบันทึกรายรับรายจ่าย

โจทย์เดโม: สร้างแอพให้ลูกค้าสดใน session เดียว **โดยแต่ละทีมต้องได้หน้าตาไม่ซ้ำกัน**

## โปรเจกต์นี้ให้อะไรมา

- `app.js` — เครื่องยนต์ที่ทำไว้แล้ว (เพิ่ม/แก้ไข/ลบรายการ · ยอดสรุป · ลิสต์แบ่งกลุ่มรายเดือน ·
  ตัวเลือกเดือน · กราฟรายจ่ายตามหมวด · เก็บลง `localStorage` · ข้อมูลตัวอย่างย้อนหลัง 3 เดือน)
- `.kiro/steering/rules.md` — **กฎทั้งหมดอยู่ที่นี่ที่เดียว** (contract + เพดานคุณภาพ + กติกาใช้ design skill)
- `.kiro/steering/ui-ux-pro-max/` — design intelligence ที่ agent ใช้เลือก palette / ฟอนต์ / สไตล์
  (โหลดอัตโนมัติ · เป็น skill ของบุคคลที่สาม รวมมาไว้ในโปรเจกต์เดโมนี้เพื่อให้ clone แล้วใช้ได้เลย)
- hook 2 ตัว: QA ก่อนโชว์ลูกค้า · สรุปฟีเจอร์ท้าย session

**ไม่มี `index.html` และ `style.css` ให้** — สองไฟล์นี้แต่ละทีมสร้างเองตอนทำงาน
นั่นคือจุดที่ทำให้งานออกมาต่างกัน ถ้าแจกโครงไว้ให้ ทุกทีมจะได้หน้าตาเหมือนกันหมด

## ลำดับใช้งาน

1. **Quick Spec** — ให้ Kiro ถาม requirement (ต้องมีคำถามเรื่องหน้าตา 1 ข้อ แล้วสรุปเป็นบรรทัด `Design read:`)
2. **query `ui-ux-pro-max`** (อยู่ใน `.kiro/steering/ui-ux-pro-max/` โหลดอัตโนมัติ) ก่อนเขียน `style.css`
   `python3 .kiro/steering/ui-ux-pro-max/scripts/search.py "<product + vibe>" --design-system`
3. **สร้าง `index.html` + `style.css`** ตาม contract ใน `rules.md`
4. ทำฟีเจอร์ตาม spec
5. อยาก de-slop ค่อยเรียก `taste-skill` (optional แล้วแต่คนทำ)
6. กด hook **QA ก่อนโชว์ลูกค้า** → กด hook **สรุปฟีเจอร์ทั้งหมด** ปิดท้าย

## รัน

```bash
python3 -m http.server 8000
# เปิด http://localhost:8000
```

## กฎย่อ (ฉบับเต็มอยู่ใน `.kiro/steering/rules.md`)

- ผลลัพธ์ต้องเป็น 3 ไฟล์เท่านั้น: `index.html` · `app.js` · `style.css` ห้ามสร้างไฟล์ใหม่
- ห้าม dependency ทุกชนิด ยกเว้น `<link>` Google Fonts (ฟอนต์ต้องมี glyph ไทย)
- id ที่ `app.js` เรียก 23 ตัวต้องมีครบ (อีก 6 ตัวมี guard) — รายชื่ออยู่ใน `rules.md`
- เพดานคุณภาพห้ามต่อรอง: 44px · AA 4.5:1 ทั้งสองโหมด · focus ring · 390px ไม่มี scroll แนวนอน ·
  reduced-motion · มี empty/error/status ครบ
- หน้าตานอกเหนือจากนั้น **อิสระเต็มที่ ไม่มีค่า default ให้**

รายละเอียด contract ทั้งหมดอยู่ใน `rules.md` ไฟล์เดียว **ห้ามก๊อปมาไว้ที่อื่น** — ที่ผ่านมาข้อมูลเพี้ยน
เพราะกระจายอยู่หลายไฟล์แล้วอัปเดตไม่ครบ
