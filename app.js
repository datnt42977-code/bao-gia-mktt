// Báo Giá MKTT — form logic, format vi-VN, localStorage, VAT toggle, dynamic mác rows
(function () {
  'use strict';

  const STORAGE_KEY = 'baogia-mktt-v2';
  const MAX_ROWS = 10;

  // Gợi ý mác — bấm chip để thêm nhanh
  const SUGGESTIONS = [
    'M150R28', 'M200R28', 'M250R28', 'M300R28', 'M350R28', 'M400R28',
    'C8', 'C12', 'C16', 'C20', 'C25', 'C30',
    'B20', 'B25', 'B30', 'B40',
  ];

  // ---------- number format ----------
  const digitsOnly = (s) => String(s || '').replace(/\D/g, '');
  const formatVN = (s) => {
    const d = digitsOnly(s);
    if (!d) return '';
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  function attachNumberFormatter(input) {
    input.addEventListener('input', () => {
      const before = input.value;
      const caret = input.selectionStart ?? before.length;
      const digitsBeforeCaret = digitsOnly(before.slice(0, caret)).length;
      const formatted = formatVN(before);
      input.value = formatted;
      let pos = 0, seen = 0;
      while (pos < formatted.length && seen < digitsBeforeCaret) {
        if (/\d/.test(formatted[pos])) seen++;
        pos++;
      }
      try { input.setSelectionRange(pos, pos); } catch (_) {}
      onAnyChange();
    });
  }

  // ---------- simple bind: form → preview (non-mác fields) ----------
  const bindings = [
    ['f-day', 'q-day'],
    ['f-month', 'q-month'],
    ['f-year', 'q-year'],
    ['f-customer', 'q-customer'],
    ['f-project', 'q-project'],
    ['f-pump1-ca', 'q-pump1-ca', true],
    ['f-pump1-m3', 'q-pump1-m3', true],
    ['f-pump2-ca', 'q-pump2-ca', true],
    ['f-pump2-m3', 'q-pump2-m3', true],
  ];

  function syncBinding([fId, qId, isNum]) {
    const input = document.getElementById(fId);
    const out = document.getElementById(qId);
    if (!input || !out) return;
    const val = input.value.trim();
    if (isNum) {
      out.textContent = val || '________';
    } else {
      out.textContent = val || (qId === 'q-customer' || qId === 'q-project' ? '________________________' : '__');
    }
  }

  function syncAll() {
    bindings.forEach(syncBinding);
    syncVat();
    syncMacPreview();
  }

  // ---------- VAT ----------
  function syncVat() {
    const checked = document.getElementById('f-vat').checked;
    const note = document.getElementById('q-vat-note');
    note.textContent = checked ? 'Giá đã bao gồm VAT' : 'Giá chưa bao gồm VAT';
  }

  // ---------- dynamic mác rows ----------
  let rows = []; // [{name, price}]

  function renderChips() {
    const root = document.getElementById('mac-chips');
    root.innerHTML = '';
    SUGGESTIONS.forEach((name) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.textContent = name;
      btn.addEventListener('click', () => {
        if (rows.length >= MAX_ROWS) return;
        rows.push({ name, price: '' });
        renderRowList();
        onAnyChange();
        // focus the new price input for fast entry
        const last = document.querySelector('#mac-list .extra-row:last-child input[data-field="price"]');
        if (last) last.focus();
      });
      root.appendChild(btn);
    });
  }

  function renderRowList() {
    const root = document.getElementById('mac-list');
    root.innerHTML = '';
    rows.forEach((row, idx) => {
      const div = document.createElement('div');
      div.className = 'extra-row';
      div.innerHTML = `
        <input type="text" placeholder="Tên mác" data-field="name" value="${escapeHtml(row.name)}">
        <input type="text" placeholder="Đơn giá" inputmode="decimal" data-field="price" value="${escapeHtml(row.price)}">
        <button type="button" class="btn-del" aria-label="Xóa">×</button>
      `;
      const [nameInput, priceInput, delBtn] = div.querySelectorAll('input, button');
      nameInput.addEventListener('input', () => { rows[idx].name = nameInput.value; onAnyChange(); });
      priceInput.addEventListener('input', () => {
        priceInput.value = formatVN(priceInput.value);
        rows[idx].price = priceInput.value;
        onAnyChange();
      });
      delBtn.addEventListener('click', () => {
        rows.splice(idx, 1);
        renderRowList();
        onAnyChange();
      });
      root.appendChild(div);
    });
    document.getElementById('btn-add-mac').disabled = rows.length >= MAX_ROWS;
  }

  function syncMacPreview() {
    const body = document.getElementById('q-mac-body');
    body.innerHTML = '';
    // chỉ hiện những dòng có tên HOẶC có giá
    const visible = rows.filter((r) => (r.name || '').trim() || (r.price || '').trim());
    visible.forEach((row, i) => {
      const tr = document.createElement('tr');
      const stt = String(i + 1).padStart(2, '0');
      tr.innerHTML = `
        <td>${stt}</td>
        <td><span class="r">${escapeHtml(row.name) || '________'}</span></td>
        <td>M³</td>
        <td>10±2</td>
        <td class="num"><span class="r">${escapeHtml(row.price) || '________'}</span></td>
        <td></td>
      `;
      body.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  // ---------- persistence ----------
  function saveState() {
    const state = {
      day: val('f-day'), month: val('f-month'), year: val('f-year'),
      customer: val('f-customer'), project: val('f-project'),
      pump1Ca: val('f-pump1-ca'), pump1M3: val('f-pump1-m3'),
      pump2Ca: val('f-pump2-ca'), pump2M3: val('f-pump2-m3'),
      vat: document.getElementById('f-vat').checked,
      rows,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function loadState() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    if (!state) {
      const now = new Date();
      setVal('f-day', String(now.getDate()));
      setVal('f-month', String(now.getMonth() + 1));
      setVal('f-year', String(now.getFullYear()));
      return;
    }
    setVal('f-day', state.day); setVal('f-month', state.month); setVal('f-year', state.year);
    setVal('f-customer', state.customer); setVal('f-project', state.project);
    setVal('f-pump1-ca', state.pump1Ca); setVal('f-pump1-m3', state.pump1M3);
    setVal('f-pump2-ca', state.pump2Ca); setVal('f-pump2-m3', state.pump2M3);
    document.getElementById('f-vat').checked = !!state.vat;
    rows = Array.isArray(state.rows) ? state.rows.slice(0, MAX_ROWS) : [];
  }

  const val = (id) => (document.getElementById(id)?.value || '');
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };

  // ---------- wiring ----------
  let saveTimer = null;
  function onAnyChange() {
    syncAll();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 250);
  }

  function init() {
    document.querySelectorAll('#form input.num').forEach(attachNumberFormatter);
    document.querySelectorAll('#form input[type="text"], #form input[type="number"]').forEach((el) => {
      if (el.classList.contains('num')) return;
      el.addEventListener('input', onAnyChange);
    });
    document.getElementById('f-vat').addEventListener('change', onAnyChange);

    document.getElementById('btn-add-mac').addEventListener('click', () => {
      if (rows.length >= MAX_ROWS) return;
      rows.push({ name: '', price: '' });
      renderRowList();
      onAnyChange();
      const last = document.querySelector('#mac-list .extra-row:last-child input[data-field="name"]');
      if (last) last.focus();
    });

    document.getElementById('btn-print').addEventListener('click', () => {
      saveState();
      window.print();
    });

    loadState();
    renderChips();
    renderRowList();
    syncAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
