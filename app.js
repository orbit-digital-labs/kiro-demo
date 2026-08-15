/* =========================================================================
   บันทึกรายรับรายจ่าย — Foundation
   โครงไฟล์นี้แบ่งเป็น 5 โซนตายตัว: CONFIG → STATE → HELPERS → RENDER → EVENTS
   เพิ่มฟีเจอร์ใหม่ = เพิ่มค่าใน CONFIG + เขียน renderX() ของตัวเอง
   + ผูกเข้า renderAll() + ใส่ listener ในโซน EVENTS
   ห้ามคิดโครงใหม่ ห้ามเปลี่ยนชื่อฟังก์ชัน/id เดิม (ดู README.md)
   ========================================================================= */

/* ===== CONFIG — ทุกค่าที่ลูกค้าอาจขอเปลี่ยน แก้ที่นี่ที่เดียวจบ ===== */

const SCHEMA_VERSION = 1;
const STORAGE_KEY = 'fde.expense.v1';
// ธงว่าเคยเติมข้อมูลตัวอย่างให้เบราว์เซอร์นี้แล้ว (ดู bootstrap ท้ายไฟล์)
const SEEDED_KEY = 'fde.expense.seeded';

// หมวดหมู่ทั้งหมด: เพิ่ม / ลบ / แก้ ทำที่ object นี้ที่เดียว
const CATEGORIES = {
  food:      'อาหาร',
  transport: 'เดินทาง',
  shopping:  'ช้อปปิ้ง',
  bills:     'บิล',
  salary:    'เงินเดือน',
  other:     'อื่นๆ',
};

const FALLBACK_CATEGORY = 'other';

// ข้อความคงที่ (หัวข้อ ป้าย ปุ่ม) เขียนตรง ๆ ใน index.html
// ข้อความที่ JS สร้างขึ้นเอง เขียนตรง ๆ ตรงจุดที่ใช้ในไฟล์นี้

const LOCALE = 'th-TH';
const CURRENCY = 'THB';
const STATUS_TIMEOUT = 4000;

// เดือนที่กำลังดูอยู่: 'all' = ทุกเดือน หรือคีย์รูปแบบ 'YYYY-MM'
let activeMonth = 'all';

/* ===== STATE ===== */

// รูปแบบ 1 รายการ:
// { id, type:'income'|'expense', amount:Number, category:String,
//   date:'YYYY-MM-DD', note:String, createdAt:ISOString }
// field อื่นที่ทีมเพิ่มเองจะถูกเก็บไว้เสมอตอน migrate

const store = {
  transactions: [],
  editingId: null,
  newId: null,          // ไฮไลต์รายการที่เพิ่งเพิ่ม 1 ครั้ง
  storageBroken: false,
  _subs: [],

  subscribe(fn) { store._subs.push(fn); },

  // เรียกทุกครั้งที่ข้อมูลเปลี่ยน: เซฟลงเครื่องแล้ว re-render
  commit() {
    storage.write(store.transactions);
    store._subs.forEach(fn => fn());
  },
};

/* ===== HELPERS ===== */

const $ = id => document.getElementById(id);

function catLabel(key) {
  return CATEGORIES[key] || CATEGORIES[FALLBACK_CATEGORY] || key;
}

function uid() {
  return 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function isDateStr(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

const _moneyFmt = new Intl.NumberFormat(LOCALE, {
  style: 'currency', currency: CURRENCY,
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
function fmtMoney(n) {
  return _moneyFmt.format(n);
}

const _dateFmt = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric', month: 'short', year: 'numeric',
});
function fmtDate(str) {
  if (!isDateStr(str)) return str;
  const [y, m, d] = str.split('-').map(Number);
  return _dateFmt.format(new Date(y, m - 1, d));
}

// หัวข้อกลุ่มเดือน เช่น "สิงหาคม 2569" — รับคีย์รูปแบบ 'YYYY-MM'
const _monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
function fmtMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return _monthFmt.format(new Date(y, m - 1, 1));
}

// สร้าง element สั้น ๆ — ใช้ textContent เสมอ ข้อความจากผู้ใช้จึงปลอดภัย
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// ปรับ record ให้ครบรูปแบบ โดยคง field แปลกปลอมของทีมไว้เสมอ
function normalizeTx(rec) {
  if (!rec || typeof rec !== 'object') return null;
  const amount = Number(rec.amount);
  if (!isFinite(amount) || amount <= 0) return null;
  return {
    ...rec,
    id: typeof rec.id === 'string' && rec.id ? rec.id : uid(),
    type: rec.type === 'income' ? 'income' : 'expense',
    amount,
    category: CATEGORIES[rec.category] ? rec.category : FALLBACK_CATEGORY,
    date: isDateStr(rec.date) ? rec.date : todayStr(),
    note: typeof rec.note === 'string' ? rec.note : '',
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : new Date().toISOString(),
  };
}

// รับได้ทั้งรูปแบบใหม่ { schemaVersion, transactions } และ array เปล่า ๆ ของเวอร์ชันเก่า
function migrate(payload) {
  const list = Array.isArray(payload) ? payload
    : (payload && Array.isArray(payload.transactions) ? payload.transactions : null);
  if (!list) throw new Error('unrecognised payload');
  return list.map(normalizeTx).filter(Boolean);
}

const storage = {
  read() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return migrate(JSON.parse(raw));
    } catch (err) {
      store.storageBroken = true;   // ไม่ throw ต่อ — แอพต้องเปิดขึ้นมาได้เสมอ
      return [];
    }
  },

  write(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        schemaVersion: SCHEMA_VERSION,
        transactions: list,
      }));
    } catch (err) {
      setStatus('บันทึกลงเครื่องไม่สำเร็จ ข้อมูลจะหายเมื่อปิดหน้านี้');
    }
  },

  clear() {
    // ล้างธง seed ด้วย ลูกค้าที่กดล้างข้อมูลเสียจะได้ข้อมูลตัวอย่างกลับมาตอนเปิดใหม่ ไม่เจอจอว่าง
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SEEDED_KEY);
    } catch (err) { /* โดนบล็อกก็ปล่อยผ่าน */ }
  },
};

let _statusTimer = null;
function setStatus(text) {
  const node = $('statusMsg');
  if (!node) return;
  node.textContent = text;
  clearTimeout(_statusTimer);
  if (text) _statusTimer = setTimeout(() => { node.textContent = ''; }, STATUS_TIMEOUT);
}

function showFieldError(inputId, message) {
  const input = $(inputId);
  const slot = $(inputId + 'Err');
  if (input) input.setAttribute('aria-invalid', 'true');
  if (slot) { slot.textContent = message; slot.hidden = false; }
}

function clearFieldErrors() {
  ['txAmount', 'txCategory', 'txDate'].forEach(id => {
    const input = $(id);
    const slot = $(id + 'Err');
    if (input) input.removeAttribute('aria-invalid');
    if (slot) { slot.textContent = ''; slot.hidden = true; }
  });
}

// ยอดรวมของเดือนเดียว ('YYYY-MM') ใช้กับหัวกลุ่มเดือนในลิสต์
function monthTotals(rows, month) {
  let income = 0, expense = 0;
  rows.forEach(tx => {
    if (tx.date.slice(0, 7) !== month) return;
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });
  return { income, expense };
}

function sortedTransactions() {
  return store.transactions.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

// เดือนทั้งหมดที่มีข้อมูลจริง เรียงใหม่ → เก่า
function monthKeys() {
  const seen = new Set();
  store.transactions.forEach(tx => seen.add(tx.date.slice(0, 7)));
  return Array.from(seen).sort().reverse();
}

// รายการที่ต้องแสดงตามเดือนที่เลือก (ใช้ทั้งลิสต์และการ์ดสรุป)
function visibleTransactions() {
  const rows = sortedTransactions();
  if (activeMonth === 'all') return rows;
  return rows.filter(tx => tx.date.slice(0, 7) === activeMonth);
}

// เลื่อนเดือน: dir -1 = เดือนก่อน (เก่ากว่า), +1 = เดือนถัดไป (ใหม่กว่า)
// อยู่ที่ 'ทุกเดือน' แล้วกดเดือนก่อน = เริ่มที่เดือนล่าสุด
function shiftMonth(dir) {
  const keys = monthKeys();
  if (!keys.length) return;
  if (activeMonth === 'all') {
    if (dir < 0) activeMonth = keys[0];
    return;
  }
  const index = keys.indexOf(activeMonth);
  if (index < 0) { activeMonth = 'all'; return; }
  const next = index - dir;                       // keys เรียงใหม่→เก่า ทิศจึงกลับกัน
  if (next < 0 || next >= keys.length) return;
  activeMonth = keys[next];
}

// ข้อมูลตัวอย่างย้อนหลัง ~3 เดือน สร้างวันที่สัมพันธ์กับ "วันนี้" เสมอ ข้อมูลจึงไม่เก่า
// ใช้ seed เฉพาะตอนเปิดครั้งแรกที่ยังไม่มีข้อมูล (ดู bootstrap) — ไม่ทับข้อมูลเดิมของลูกค้า
function buildSeedData() {
  const base = new Date();
  const dateAgo = n => {
    const d = new Date(base);
    d.setDate(d.getDate() - n);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  };

  const rows = [];
  let seq = 0;
  const add = (offset, type, amount, category, note) => {
    const date = dateAgo(offset);
    rows.push({
      id: `seed-${date}-${seq}`,
      type, amount, category, note, date,
      // เที่ยงคืนเสมอ รายการที่ลูกค้าเพิ่มสดวันนี้จึงมี createdAt ใหม่กว่า และขึ้นบนสุดของลิสต์
      createdAt: `${date}T00:00:00.000Z`,
    });
    seq++;
  };

  const foodAmts  = [55, 90, 120, 65, 150, 80, 45, 210, 70, 110];
  const foodNotes = ['ข้าวมันไก่', 'กาแฟ', 'ข้าวเย็นกับเพื่อน', 'ก๋วยเตี๋ยว', 'ชานมไข่มุก', 'ข้าวกล่อง', 'ส้มตำไก่ย่าง', 'หมูกระทะ', 'ขนมปัง', 'อาหารตามสั่ง'];
  const tpAmts    = [30, 45, 25, 600, 40];
  const tpNotes   = ['รถไฟฟ้า', 'วินมอเตอร์ไซค์', 'รถเมล์', 'เติมน้ำมัน', 'แท็กซี่'];
  const shopAmts  = [350, 890, 1290, 450, 690];
  const shopNotes = ['เสื้อผ้า', 'ของใช้ในบ้าน', 'รองเท้าผ้าใบ', 'เครื่องสำอาง', 'หนังสือ'];

  // ช่วงข้อมูล = ตั้งแต่วันที่ 1 ของเดือนที่ย้อนหลัง 3 เดือน จนถึงวันนี้
  // เริ่มที่วันที่ 1 เสมอ กลุ่มเดือนในลิสต์จึงเป็นเดือนเต็ม เทียบกันได้ ไม่มีเดือนแหว่งหัวท้าย
  const firstDay = new Date(base.getFullYear(), base.getMonth() - 3, 1);
  const SPAN = Math.round((base - firstDay) / 86400000);

  // รายจ่ายกระจายตลอดช่วง: กิน (บ่อย) เดินทาง (ปานกลาง) ช้อปปิ้ง (นาน ๆ ครั้ง)
  for (let d = SPAN; d >= 0; d--) {
    if (d % 3 === 0)  add(d, 'expense', foodAmts[d % foodAmts.length], 'food', foodNotes[d % foodNotes.length]);
    if (d % 5 === 0)  add(d, 'expense', tpAmts[d % tpAmts.length], 'transport', tpNotes[d % tpNotes.length]);
    if (d % 13 === 6) add(d, 'expense', shopAmts[d % shopAmts.length], 'shopping', shopNotes[d % shopNotes.length]);
  }

  // เงินเดือน + บิล ผูกกับ "วันที่ของเดือน" ไม่ใช่จำนวนวันย้อนหลัง
  // ทุกเดือนที่แสดงจึงมีรอบเงินเดือนและบิลครบ กลุ่มเดือนในลิสต์เลยเทียบกันได้จริง
  const addOn = (monthsBack, day, type, amount, category, note) => {
    const d = new Date(base.getFullYear(), base.getMonth() - monthsBack, day);
    if (d > base || d < firstDay) return;                    // ยังไม่ถึง หรือเลยช่วงที่ seed ไว้
    add(Math.round((base - d) / 86400000), type, amount, category, note);
  };

  for (let m = 3; m >= 0; m--) {
    addOn(m,  1, 'income',  32000, 'salary', 'เงินเดือน');
    addOn(m,  2, 'expense',  8500, 'bills',  'ค่าเช่าห้อง');
    addOn(m,  5, 'expense',   599, 'bills',  'ค่าเน็ตและมือถือ');
    addOn(m,  8, 'expense',   780, 'bills',  'ค่าไฟ');
    addOn(m,  8, 'expense',   350, 'bills',  'ค่าน้ำ');
  }

  // รายรับเสริมนาน ๆ ครั้ง ทำให้แต่ละเดือนไม่หน้าตาเหมือนกันเป๊ะ
  addOn(2, 20, 'income', 5500, 'other', 'งานฟรีแลนซ์');
  addOn(1, 12, 'income', 1200, 'other', 'เงินคืนภาษี');

  return rows;
}

/* ===== RENDER — หนึ่งหน้าที่ต่อหนึ่งฟังก์ชัน ===== */

// เติม option ของ #txCategory จาก CATEGORIES — เพิ่ม/ลบหมวดหมู่แก้ที่ CONFIG ที่เดียว
function renderCategoryOptions() {
  const select = $('txCategory');
  const keep = select.value;
  select.textContent = '';
  Object.keys(CATEGORIES).forEach(key => {
    const opt = el('option', null, catLabel(key));
    opt.value = key;
    select.appendChild(opt);
  });
  if (keep && CATEGORIES[keep]) select.value = keep;
}

// ฟอร์มมี 2 โหมด: เพิ่มใหม่ กับ แก้ไขของเดิม
function renderFormMode() {
  const editing = store.editingId != null;
  $('formTitle').textContent = editing ? 'แก้ไขรายการ' : 'เพิ่มรายการ';
  $('submitBtn').textContent = editing ? 'อัปเดต' : 'บันทึก';
  $('cancelEditBtn').hidden = !editing;
}

// ปุ่มเลื่อนเดือน + ป้ายบอกว่ากำลังดูเดือนไหน
function renderMonthNav() {
  const keys = monthKeys();

  // เดือนที่เลือกไว้หายไป (ลบรายการสุดท้ายของเดือนนั้น) = กลับไปดูทุกเดือน
  if (activeMonth !== 'all' && !keys.includes(activeMonth)) activeMonth = 'all';

  const index = keys.indexOf(activeMonth);
  $('monthLabel').textContent = activeMonth === 'all' ? 'ทุกเดือน' : fmtMonth(activeMonth);
  $('monthPrevBtn').disabled = !keys.length || (index > -1 && index === keys.length - 1);
  $('monthNextBtn').disabled = activeMonth === 'all' || index === 0;
  $('monthAllBtn').disabled = activeMonth === 'all';
}

function renderSummary() {
  let income = 0, expense = 0;
  visibleTransactions().forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });

  $('incomeAmt').textContent = fmtMoney(income);
  $('expenseAmt').textContent = fmtMoney(expense);
  $('balanceAmt').textContent = fmtMoney(income - expense);
}

function renderList() {
  const list = $('txList');
  const rows = visibleTransactions();

  list.textContent = '';
  $('emptyState').textContent = activeMonth === 'all'
    ? 'ยังไม่มีรายการ เพิ่มรายการแรกจากฟอร์มได้เลย'
    : 'เดือนนี้ยังไม่มีรายการ';
  $('emptyState').hidden = rows.length > 0;
  $('txCount').textContent = rows.length ? `${rows.length} รายการ` : '';

  const frag = document.createDocumentFragment();
  let currentMonth = null;

  rows.forEach(tx => {
    const isIncome = tx.type === 'income';

    // ขึ้นหัวเดือนใหม่ทุกครั้งที่ข้ามเดือน พร้อมยอดสุทธิของเดือนนั้น
    const month = tx.date.slice(0, 7);
    if (month !== currentMonth) {
      currentMonth = month;
      const total = monthTotals(rows, month);
      const head = el('li', 'tx-month');
      head.appendChild(el('span', 'tx-month__name', fmtMonth(month)));
      const net = total.income - total.expense;
      const sum = el('span', `tx-month__net ${net < 0 ? 'tx-month__net--out' : 'tx-month__net--in'}`,
        (net < 0 ? '−' : '+') + fmtMoney(Math.abs(net)));
      head.appendChild(sum);
      frag.appendChild(head);
    }

    const row = el('li', 'tx');
    row.dataset.id = tx.id;
    if (tx.id === store.editingId) row.classList.add('tx--editing');
    if (tx.id === store.newId) row.classList.add('tx--new');

    const main = el('div', 'tx__main');
    main.appendChild(el('span', 'tx__note', tx.note || catLabel(tx.category)));
    main.appendChild(el('span', 'tx__meta', `${catLabel(tx.category)} · ${fmtDate(tx.date)}`));

    // เครื่องหมาย + / − กำกับเสมอ ไม่สื่อความหมายด้วยสีอย่างเดียว
    const amt = el('span', `tx__amt ${isIncome ? 'tx__amt--in' : 'tx__amt--out'}`,
      (isIncome ? '+' : '−') + fmtMoney(tx.amount));

    const actions = el('div', 'tx__actions');
    const editBtn = el('button', 'tx__btn', 'แก้ไข');
    editBtn.type = 'button';
    editBtn.dataset.act = 'edit';
    const delBtn = el('button', 'tx__btn tx__btn--danger', 'ลบ');
    delBtn.type = 'button';
    delBtn.dataset.act = 'delete';
    actions.append(editBtn, delBtn);

    row.append(main, amt, actions);
    frag.appendChild(row);
  });

  list.appendChild(frag);
  store.newId = null;
}

// สัดส่วนรายจ่ายตามหมวดหมู่ของช่วงที่เลือก — แท่งแนวนอน CSS ล้วน
function renderSpending() {
  const host = $('spendingChart');
  if (!host) return;                       // ทน re-skin ที่อาจถอด container ออก

  const totalNode = $('spendingTotal');
  const rows = visibleTransactions().filter(tx => tx.type === 'expense');

  host.textContent = '';

  if (!rows.length) {
    if (totalNode) totalNode.textContent = '';
    host.appendChild(el('p', 'spending__empty', 'ช่วงที่เลือกยังไม่มีรายจ่าย'));
    return;
  }

  // รวมยอดต่อหมวดหมู่ แล้วเรียงมากไปน้อย
  const byCat = {};
  let total = 0;
  rows.forEach(tx => {
    byCat[tx.category] = (byCat[tx.category] || 0) + tx.amount;
    total += tx.amount;
  });
  const ordered = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a]);

  if (totalNode) totalNode.textContent = '−' + fmtMoney(total);

  const max = byCat[ordered[0]];           // แท่งยาวสุด = หมวดที่จ่ายเยอะสุด
  ordered.forEach(cat => {
    const sum = byCat[cat];
    const pct = Math.round((sum / total) * 100);

    const row = el('div', 'spending__row');

    const head = el('div', 'spending__head');
    head.appendChild(el('span', 'spending__label', catLabel(cat)));
    head.appendChild(el('span', 'spending__amt', `−${fmtMoney(sum)} · ${pct}%`));
    row.appendChild(head);

    const track = el('div', 'spending__track');
    const bar = el('div', 'spending__bar');
    bar.style.width = (max ? (sum / max) * 100 : 0) + '%';   // สัดส่วนเทียบแท่งยาวสุด
    track.appendChild(bar);
    row.appendChild(track);

    host.appendChild(row);
  });
}

function renderAll() {
  renderMonthNav();
  renderSummary();
  renderSpending();
  renderList();
}

/* ===== EVENTS — อยู่ล่างสุดเสมอ ===== */

function readForm() {
  // ทนต่อการจัดวางใหม่: ถ้า re-skin ทำให้ไม่มี radio ตัวไหนถูกเลือก ให้ถือเป็นรายจ่าย ไม่พัง
  const picked = $('txType').querySelector('input:checked');
  return {
    type: picked ? picked.value : 'expense',
    amount: Number($('txAmount').value),
    category: $('txCategory').value,
    date: $('txDate').value,
    note: $('txNote').value.trim(),
  };
}

function validate(draft) {
  clearFieldErrors();
  let ok = true;
  if (!isFinite(draft.amount) || draft.amount <= 0) { showFieldError('txAmount', 'กรอกจำนวนเงินมากกว่า 0'); ok = false; }
  if (!CATEGORIES[draft.category]) { showFieldError('txCategory', 'เลือกหมวดหมู่'); ok = false; }
  if (!isDateStr(draft.date)) { showFieldError('txDate', 'เลือกวันที่'); ok = false; }
  return ok;
}

function resetForm() {
  store.editingId = null;
  $('txForm').reset();
  $('txDate').value = todayStr();
  clearFieldErrors();
  renderFormMode();
}

function startEdit(id) {
  const tx = store.transactions.find(item => item.id === id);
  if (!tx) return;

  store.editingId = id;
  $('txTypeIncome').checked = tx.type === 'income';
  $('txTypeExpense').checked = tx.type !== 'income';
  $('txAmount').value = tx.amount;
  $('txCategory').value = tx.category;
  $('txDate').value = tx.date;
  $('txNote').value = tx.note;

  clearFieldErrors();
  renderFormMode();
  renderList();
  $('txAmount').focus();
}

$('txForm').addEventListener('submit', event => {
  event.preventDefault();
  const draft = readForm();
  if (!validate(draft)) return;

  if (store.editingId) {
    const index = store.transactions.findIndex(item => item.id === store.editingId);
    if (index > -1) store.transactions[index] = { ...store.transactions[index], ...draft };
  } else {
    const tx = normalizeTx({ ...draft, id: uid(), createdAt: new Date().toISOString() });
    store.transactions.push(tx);
    store.newId = tx.id;
    // เพิ่มรายการของเดือนอื่นระหว่างที่กรองอยู่ = เด้งไปเดือนนั้นให้ ไม่งั้นดูเหมือนบันทึกไม่ติด
    if (activeMonth !== 'all') activeMonth = tx.date.slice(0, 7);
  }

  resetForm();
  store.commit();
});

$('cancelEditBtn').addEventListener('click', () => {
  resetForm();
  renderList();
});

$('txList').addEventListener('click', event => {
  const btn = event.target.closest('[data-act]');
  if (!btn) return;

  // ปุ่ม [data-act] ที่อยู่ใน #txList แต่ไม่ได้อยู่ในแถว (เช่น ปุ่มกรอง/เรียงในหัวลิสต์)
  // ต้องไม่ทำให้พัง — ปล่อยให้ handler ของฟีเจอร์นั้นจัดการเอง
  const row = btn.closest('.tx');
  if (!row) return;
  const id = row.dataset.id;

  if (btn.dataset.act === 'edit') {
    startEdit(id);
    return;
  }

  if (btn.dataset.act === 'delete') {
    if (!confirm('ลบรายการนี้ใช่ไหม')) return;
    store.transactions = store.transactions.filter(item => item.id !== id);
    if (store.editingId === id) resetForm();
    store.commit();
  }
});

$('monthPrevBtn').addEventListener('click', () => { shiftMonth(-1); renderAll(); });
$('monthNextBtn').addEventListener('click', () => { shiftMonth(1); renderAll(); });
$('monthAllBtn').addEventListener('click', () => { activeMonth = 'all'; renderAll(); });

$('resetStorageBtn').addEventListener('click', () => {
  storage.clear();
  store.storageBroken = false;
  $('storageBanner').hidden = true;
  setStatus('ล้างข้อมูลที่เสียเรียบร้อยแล้ว');
});

/* bootstrap */
store.subscribe(renderAll);
store.transactions = storage.read();

// ข้อมูลตัวอย่างย้อนหลัง ~3 เดือน: เติมให้ครั้งเดียวต่อเบราว์เซอร์ แล้วปักธงไว้
// เติมแบบ "รวมกับของเดิม" ไม่ลบและไม่ทับรายการที่ลูกค้ากรอกไว้เด็ดขาด
// เครื่องที่มีข้อมูลอยู่ก่อนแล้วจึงได้ตัวอย่างด้วย และลบตัวอย่างทิ้งแล้วมันจะไม่กลับมาอีก
if (!store.storageBroken && !localStorage.getItem(SEEDED_KEY)) {
  const seen = new Set(store.transactions.map(tx => tx.id));
  const fresh = buildSeedData().map(normalizeTx).filter(tx => tx && !seen.has(tx.id));
  if (fresh.length) {
    store.transactions = store.transactions.concat(fresh);
    storage.write(store.transactions);
  }
  try { localStorage.setItem(SEEDED_KEY, '1'); } catch (err) { /* โดนบล็อกก็ปล่อยผ่าน */ }
}

$('storageBanner').hidden = !store.storageBroken;
$('txDate').value = todayStr();
renderCategoryOptions();
renderFormMode();
renderAll();
