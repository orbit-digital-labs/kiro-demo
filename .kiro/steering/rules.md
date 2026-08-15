---
inclusion: always
---

# กฎของโปรเจกต์นี้ (อ่านก่อนแตะโค้ดทุกครั้ง)

> โค้ดนี้ถูกแก้ **สดต่อหน้าลูกค้า** ทุก diff มีคนดู — เร็ว + ไม่พัง สำคัญกว่าสมบูรณ์แบบ
> **หน้าตาไม่มีเทมเพลตให้** ทุกทีมออกแบบเอง ไฟล์นี้คุมแค่ "อะไรห้ามพัง" ไม่ได้คุมว่า "ต้องสวยแบบไหน"

## 1. ผลลัพธ์ต้องเป็น 3 ไฟล์เท่านั้น

`index.html` · `app.js` · `style.css` ที่ root — **ห้ามสร้างไฟล์หรือโฟลเดอร์ใหม่ทุกกรณี**
ไม่มีไฟล์ component แยก ไม่มี module ใหม่ ไม่มีไฟล์ util (ไฟล์ `.md` เป็นเอกสาร ไม่นับเป็นไฟล์แอพ)

**ห้าม dependency ทุกชนิด** — npm / CDN / framework / React / Tailwind / bundler / build step
CSS เขียนมือใน `style.css` · JS วานิลลาใน `app.js` · กราฟถ้าถูกขอให้วาดด้วย CSS หรือ SVG inline
**ข้อยกเว้นเดียว:** `<link>` Google Fonts — ฟอนต์ต้องมี glyph ไทย ต้องมี `display=swap`
และ fallback เป็น system font (ฟอนต์ Latin ที่ไม่มีไทยจะทำให้ข้อความไทยตก fallback แล้วหน้าเว็บดูพัง)

**ห้ามลบหรือรีเซ็ต `localStorage`** เว้นแต่ user สั่งตรง ๆ — รายการที่ลูกค้ากรอกสดหายเมื่อไหร่ เดโมจบเมื่อนั้น

## 2. DOM contract — `app.js` คือแหล่งความจริงเดียว

ไม่มี `index.html` ต้นแบบให้ลอก **สร้าง markup เองได้เต็มที่** แต่ต้องมีของพวกนี้ครบ ไม่งั้นแอพพัง

**id ที่ต้องมี 23 ตัว (หายแล้วแอพไม่ boot / กดแล้วพัง)**
`txForm` `txList` `txCategory` `txDate` `txNote` `txAmount` `txType` `txTypeExpense` `txTypeIncome`
`formTitle` `submitBtn` `cancelEditBtn` `incomeAmt` `expenseAmt` `balanceAmt` `emptyState` `txCount`
`monthLabel` `monthPrevBtn` `monthNextBtn` `monthAllBtn` `storageBanner` `resetStorageBtn`

**id ที่ไม่มีก็ได้ 6 ตัว (โค้ดมี guard แล้ว ไม่มี = แค่ฟีเจอร์นั้นหายไปเงียบ ๆ)**
`statusMsg` (ข้อความสถานะ) · `txAmountErr` `txCategoryErr` `txDateErr` (ช่อง error ใต้ field —
ชื่อผูกกับสูตร `<inputId> + "Err"`) · `spendingChart` `spendingTotal` (กราฟรายจ่ายตามหมวด)

**ชนิด element ที่บังคับ**
- `#txForm` = `<form novalidate>` — **ไม่มี `novalidate` = error ของแอพเองไม่ทำงาน** เบราว์เซอร์เด้ง tooltip ตัวเองแทน
- `#submitBtn` = ปุ่ม submit ที่อยู่ใน form (ไม่มีใครฟัง click ของมัน)
- `#txCategory` = `<select>` — option ถูกสร้างใหม่ทั้งหมดโดย JS ที่เขียนมือไว้จะโดนลบ
- `#txDate` = `<input type="date">` · `#txAmount` ต้อง focus ได้ (ตอนกดแก้ไขจะ focus ให้)
- `#txList` = `<ul>` หรือ `<ol>` (JS ใส่ `<li>` เข้าไป) · `#txType` ต้องครอบ radio 2 ตัว
- ปุ่ม/ลิงก์ที่มี `data-act` ห้ามอยู่ใน `#txList` นอกแถว `.tx`

**attribute ที่ห้ามเปลี่ยนชื่อ:** `data-act` · `data-id` · class `tx`

**class ที่ JS สร้างเอง — ต้องมี CSS รองรับครบ (เปลี่ยนชื่อได้ถ้าแก้ใน `app.js` พร้อมกัน)**
`tx` `tx--editing` `tx--new` `tx__main` `tx__note` `tx__meta` `tx__amt` `tx__amt--in` `tx__amt--out`
`tx__actions` `tx__btn` `tx__btn--danger` · `tx-month` `tx-month__name` `tx-month__net`
`tx-month__net--in` `tx-month__net--out` · `spending__row` `spending__head` `spending__label`
`spending__amt` `spending__track` `spending__bar` `spending__empty`

**ต้องมีใน `style.css` เสมอ:** `[hidden] { display: none !important; }` และห้าม class ไหนตั้ง `display`
ทับ `#storageBanner` `#cancelEditBtn` `#emptyState` และช่อง error ทั้งสาม
(ถ้าหาย banner ข้อมูลเสียกับปุ่มยกเลิกจะโผล่ค้างถาวร)

**ต้องมีใน `index.html`:** `<script defer src="app.js">` · `<meta name="viewport">` ·
`<title>บันทึกรายรับรายจ่าย</title>` (ไม่มีแล้วแท็บเบราว์เซอร์ว่างตอนโชว์ลูกค้า — ไม่มี JS ตั้งให้)

### 3 กับดักที่พังแบบเงียบ (ไม่มี error ให้เห็น แต่ผลลัพธ์ผิด)

1. **ถอด `name="type"` จาก radio** → ติ๊กได้ทั้งคู่ ระบบอ่านตัวแรกใน document order → ลูกค้าเลือก "รายรับ" แต่ได้รายจ่าย
2. **ถอด `checked` จาก radio ตัวใดตัวหนึ่ง** → `form.reset()` คืนค่าตาม content attribute ฟอร์มจะเพี้ยนทุกครั้งหลังบันทึก
3. **เอา `<input>` ไปไว้ข้างใน `<label>`** โดยไม่แก้ selector → ถ้า CSS ใช้ `input:checked + label`
   สถานะที่เลือกจะไม่แสดง ผู้ใช้ไม่เห็นว่ากำลังเลือกอะไรอยู่ (ถ้าจะครอบ ให้ใช้ `label:has(input:checked)`)

### ข้อความ

แอพนี้ **ภาษาไทยอย่างเดียว** ไม่มีตารางข้อความกลาง เขียนข้อความตรงจุดที่ใช้เลย
- หัวข้อ ป้าย ปุ่มที่อยู่นิ่ง ๆ → เขียนเป็นข้อความไทยตรง ๆ ใน `index.html`
- ข้อความที่ JS สร้าง (ปุ่มแก้ไข/ลบ, error ใต้ field, empty state, ข้อความสถานะ) → อยู่ใน `app.js` แล้ว
  แก้ตรงจุดที่ใช้ ห้ามยกกลับไปทำเป็น object รวม

**ยกเว้นหมวดหมู่:** ชื่อหมวดหมู่แก้ที่ `CATEGORIES` (โซน CONFIG) ที่เดียว
`renderCategoryOptions()` สร้าง `<option>` ของ `#txCategory` ใหม่ทั้งหมดจากตัวนี้

**element ที่ JS เขียนทับข้อความ ต้องไม่มีลูก** — JS เซ็ต `textContent` ซึ่งลบของข้างในทิ้งหมด
เอา `<span>` `<svg>` ไปใส่ในนี้แล้วหายเงียบ ๆ:
`formTitle` `submitBtn` `monthLabel` `incomeAmt` `expenseAmt` `balanceAmt` `emptyState` `txCount` `spendingTotal`

## 3. เพดานคุณภาพ — เป็นกฎ ไม่ใช่รสนิยม ห้ามต่อรอง

- จุดกดสูง/กว้าง ≥ 44px ทุกปุ่ม input select
- contrast ผ่าน WCAG AA 4.5:1 ทุกคู่สีของข้อความ **ทั้งโหมดสว่างและมืด**
- `:focus-visible` ต้องมองเห็นชัด ห้ามลบ outline ทิ้งเฉย ๆ
- label อยู่เหนือ input เสมอ **ห้ามใช้ placeholder แทน label**
- ที่ 390px ต้องไม่มี scroll แนวนอน และยังกดใช้งานได้ครบ
- เคารพ `prefers-reduced-motion` · เคลื่อนไหวแค่ `transform` / `opacity`
- ต้องมีครบทุก state: ว่าง (empty) · ผิดพลาด (error ใต้ field ของตัวเอง + `aria-invalid`) · สำเร็จ (status)
- console ต้องสะอาด ไม่มี error ไม่มี warning

## 4. หน้าตา — อิสระเต็มที่ ไม่มีค่า default ให้

โครงหน้าจอ · ลำดับ element ใน `<body>` · ชุดสี · ฟอนต์ · ความมนของมุม · เงา · ความหนาแน่น ·
จะใช้การ์ดหรือไม่ใช้ · จะมี dark mode แบบไหน — **ตัดสินใจเองทั้งหมดจากบรีฟของลูกค้า**

**ห้ามมีเทมเพลต ห้ามมีชุดสีตั้งต้น ห้ามมี preset ให้เลือก** — ทุกทีมต้องได้หน้าตาที่ไม่ซ้ำกัน
ถ้าลอกโครงเดิมหรือใช้ค่าเริ่มต้นเดิมทุกครั้ง แปลว่าทำผิดข้อนี้

**ก่อนเขียนโค้ดต้องประกาศ Design Read 1 บรรทัดเสมอ** (ต่อให้ไม่ได้เรียก skill ใด ๆ):

```
อ่านงานนี้เป็น: <ใครใช้> · <ใช้ตอนไหน> · ภาษาภาพแนว <vibe จากลูกค้า> · ทิศทาง <ที่จะทำ>
```

### design skill

**ลำดับอำนาจ: ไฟล์นี้ > skill > ความเห็นของ agent**

**`ui-ux-pro-max` = ตัวหลัก อยู่ในโปรเจกต์แล้ว ใช้ทุกครั้งโดยไม่ต้องรอให้สั่ง**
ก่อนเขียน `style.css` ให้ query จาก Design Read (รันจาก root ของโปรเจกต์):

```bash
python3 .kiro/steering/ui-ux-pro-max/scripts/search.py "<product + vibe จาก Design Read>" --design-system
python3 .kiro/steering/ui-ux-pro-max/scripts/search.py "<keyword>" --domain ux|color|typography|style|chart
```

- เอามาใช้: **palette · คู่ฟอนต์ · style keywords · UX guideline** และตาราง priority 1–10 ของมัน
  (ทับกับหัวข้อ 3 ที่นี่พอดี ใช้เป็น checklist ซ้ำได้)
- **ไม่เอา:** โครง section แบบ landing page ที่มันเสนอ (Hero / Features / CTA) — แอพนี้เป็น product UI
  ไม่ใช่หน้าขายของ · และคำแนะนำ Tailwind / shadcn / framework ให้ **แปลงเป็น CSS เขียนมือเสมอ ห้ามติดตั้ง stack**
- ฟอนต์ที่มันเสนอถ้าไม่มี glyph ไทย ให้เปลี่ยนเป็นฟอนต์ไทยที่อารมณ์ใกล้กัน (เช่น mono → IBM Plex Mono
  คู่กับ IBM Plex Sans Thai) แล้วบอกในสรุปว่าเปลี่ยนเพราะอะไร
- ถ้าเครื่องไม่มี `python3` ให้ใช้ Design Read + pre-flight ด้านล่างแทน **อย่าหยุดงาน**

**`taste-skill` = ตัวเสริม optional** คนขับเรียกเอง ใช้ตอน de-slop หลังหน้าจอเสร็จ
เอาเฉพาะ §0.D anti-default · §9 AI tells (รวม §9.G ห้าม em-dash) · §4.1/4.2/4.4/4.5 เท่าที่เกี่ยวกับ product UI
→ **ข้าม** §2.A (ทุกแถวคือ npm package) · §3 (stack / icon library / emoji) · §5 GSAP · §11 · §12 · §13
และครึ่ง marketing ของ §14 (hero / eyebrow / bento / logo wall / marquee / image strategy)
— §13 ของมันเขียนเองว่าไม่ใช่สำหรับ product UI แบบนี้

**ข้อที่โปรเจกต์ชนะทุก skill:** 3 ไฟล์วานิลลาไม่มี dependency · `<link>` Google Fonts ใช้ได้ (ต้องมีไทย) ·
ไม่มี icon library → วาด inline SVG เองหรือไม่ใช้ icon · CSS transition/animation เท่านั้น ไม่มี Motion/GSAP

### pre-flight ก่อนส่งงาน (ใช้ทุกกรณี ไม่ว่าจะเรียก skill หรือไม่)

ห้าม em-dash ในข้อความที่ผู้ใช้เห็น · ธีมเดียวทั้งหน้าไม่สลับโหมดกลางหน้า · accent สีเดียวทั้งหน้า ·
ระบบ radius เดียว · ปุ่มหลัก contrast ผ่าน · ฟอร์ม/placeholder/focus ring contrast ผ่าน ·
เทสต์จริงทั้งโหมดสว่างและมืด · 390px ใช้งานได้ · `100dvh` ไม่ใช่ `100vh` ·
มี empty/error/status ครบ · reduced-motion · ไม่มี AI tell (gradient ม่วง-ฟ้า, Inter ล้วน, การ์ด 3 ใบเท่ากัน)

## 5. Requirement — ใช้ Quick Spec ของ Kiro

ทุกคำขอที่เป็นการสร้าง/เพิ่มฟีเจอร์ **ทำ spec ก่อนลงมือ ห้ามเดา requirement เอง**

- คำถาม clarify ตอบเป็น**ภาษาไทย** และต้องมีตัวเลือกที่จับต้องได้พร้อม trade-off สั้น ๆ
  ไม่ใช่คำถามปลายเปิดลอย ๆ ("อยากได้แบบไหน" คือคำถามที่แย่)
- **ต้องมี 1 คำถามเรื่องหน้าตาเสมอ** — ใครใช้ · อยากให้รู้สึกยังไง · มีเว็บที่ชอบไหม
  แล้วสรุปเป็นบรรทัดนี้ลงไฟล์ spec:
  `Design read: <ใคร> ใช้ <ทำอะไร> · vibe <คำที่ลูกค้าให้> · reference <URL / ไม่มี>`
  ถ้าข้ามข้อนี้ งานทุกทีมจะออกมาหน้าตาเหมือนกัน ซึ่งทำลายจุดขายทั้งเวิร์กช็อป
- ลำดับงาน: **spec + Design Read → query `ui-ux-pro-max` → สร้าง `index.html` + `style.css`
  → ทำฟีเจอร์ → (อยาก de-slop ค่อยเรียก `taste-skill`) → กด hook QA ก่อนโชว์**

## 6. เขียนโค้ดยังไง

`app.js` แบ่ง 5 โซนตายตัว **ของใหม่เข้าโซนเดิม ห้ามคิดโครงใหม่**

```
CONFIG → STATE → HELPERS → RENDER → EVENTS
```

ค่าที่ปรับได้ (หมวดหมู่ ข้อความ ค่าคงที่) → CONFIG บนสุด · ฟังก์ชันวาดหน้าจอ → RENDER แล้วผูกเข้า
`renderAll()` · event listener + bootstrap → EVENTS ล่างสุด · ข้อมูลเปลี่ยนแล้วเรียก `store.commit()`
(เซฟและ re-render ให้เอง)

แก้แบบ **surgical** แตะเฉพาะบรรทัดที่เกี่ยวข้อง ยกเว้นรอบแรกที่สร้าง `index.html` + `style.css` ขึ้นใหม่
ซึ่งเขียนรวดเดียวจบได้เต็มที่ · เจอจุดกำกวมเล็ก ๆ ให้เลือกการตีความที่เดโมได้เร็วและเห็นผลชัดสุด
แล้วแจ้งท้ายงาน 1 บรรทัดว่า `ตีความว่า...`

จบงานตอบเป็น **1–3 bullet ภาษาไทย** ว่าแก้อะไร ตรงไหน (ไฟล์/ฟังก์ชัน) ห้าม lecture โค้ด
