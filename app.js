// Báo Giá MKTT — form logic, format vi-VN, localStorage, VAT toggle, extra mác
(function () {
  'use strict';

  const STORAGE_KEY = 'baogia-mktt-v1';
  const MAX_EXTRA = 3;

  // ---------- number format ----------
  const digitsOnly = (s) => String(s || '').replace(/\D/g, '');
  const formatVN = (s) => {
    const d = digitsOnly(s);
    if (!d) return '';
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Re-format input as user types; keep caret reasonably in place
  function attachNumberFormatter(input) {
    input.addEventListener('input', () => {
      const before = input.value;
      const caret = input.selectionStart ?? before.length;
      const digitsBeforeCaret = digitsOnly(before.slice(0, caret)).length;
      const formatted = formatVN(before);
      input.value = formatted;
      // restore caret position (count from dots)
      let pos = 0, seen = 0;
      while (pos < formatted.length && seen < digitsBeforeCaret) {
        if (/\d/.test(formatted[pos])) seen++;
        pos++;
      }
      try { input.setSelectionRange(pos, pos); } catch (_) { /* ignore */ }
      onAnyChange();
    });
  }

  // ---------- simple bind: form → preview ----------
  const bindings = [
    ['f-day', 'q-day'],
    ['f-month', 'q-month'],
    ['f-year', 'q-year'],
    ['f-customer', 'q-customer'],
    ['f-project', 'q-project'],
    ['f-m150', 'q-m150', true],
    ['f-m200', 'q-m200', true],
    ['f-m250', 'q-m250', true],
    ['f-m300', 'q-m300', true],
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
    syncExtraPreview();
  }

  // ---------- VAT toggle ----------
  function syncVat() {
    const checked = document.getElementById('f-vat').checked;
    const note = document.getElementById('q-vat-note');
    note.textContent = checked ? 'Giá đã bao gồm VAT' : 'Giá chưa bao gồm VAT';
  }

  // ---------- extra mác ----------
  // state: [{name, price}]
  let extras = [];

  function renderExtraList() {
    const root = document.getElementById('extra-list');
    root.innerHTML = '';
    extras.forEach((row, idx) => {
      const div = document.createElement('div');
      div.className = 'extra-row';
      div.innerHTML = `
        <input type="text" placeholder="Tên mác" data-field="name" value="${escapeHtml(row.name)}">
        <input type="text" placeholder="Đơn giá" inputmode="decimal" data-field="price" value="${escapeHtml(row.price)}">
        <button type="button" class="btn-del" aria-label="Xóa">×</button>
      `;
      const [nameInput, priceInput, delBtn] = div.querySelectorAll('input, button');
      nameInput.addEventListener('input', () => { extras[idx].name = nameInput.value; onAnyChange(); });
      priceInput.addEventListener('input', () => {
        priceInput.value = formatVN(priceInput.value);
        extras[idx].price = priceInput.value;
        onAnyChange();
      });
      delBtn.addEventListener('click', () => {
        extras.splice(idx, 1);
        renderExtraList();
        onAnyChange();
      });
      root.appendChild(div);
    });
    document.getElementById('btn-add-mac').disabled = extras.length >= MAX_EXTRA;
  }

  function syncExtraPreview() {
    const body = document.getElementById('q-mac-body');
    // remove existing extra rows (keep first 4 fixed)
    [...body.querySelectorAll('tr.extra')].forEach((tr) => tr.remove());
    extras.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.className = 'extra';
      const stt = String(5 + i).padStart(2, '0');
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
      m150: val('f-m150'), m200: val('f-m200'), m250: val('f-m250'), m300: val('f-m300'),
      pump1Ca: val('f-pump1-ca'), pump1M3: val('f-pump1-m3'),
      pump2Ca: val('f-pump2-ca'), pump2M3: val('f-pump2-m3'),
      vat: document.getElementById('f-vat').checked,
      extras,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function loadState() {
    let state = null;
    try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
    if (!state) {
      // first run — default date = today, rest blank
      const now = new Date();
      setVal('f-day', String(now.getDate()));
      setVal('f-month', String(now.getMonth() + 1));
      setVal('f-year', String(now.getFullYear()));
      return;
    }
    setVal('f-day', state.day); setVal('f-month', state.month); setVal('f-year', state.year);
    setVal('f-customer', state.customer); setVal('f-project', state.project);
    setVal('f-m150', state.m150); setVal('f-m200', state.m200);
    setVal('f-m250', state.m250); setVal('f-m300', state.m300);
    setVal('f-pump1-ca', state.pump1Ca); setVal('f-pump1-m3', state.pump1M3);
    setVal('f-pump2-ca', state.pump2Ca); setVal('f-pump2-m3', state.pump2M3);
    document.getElementById('f-vat').checked = !!state.vat;
    extras = Array.isArray(state.extras) ? state.extras.slice(0, MAX_EXTRA) : [];
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
    // attach format to all .num inputs
    document.querySelectorAll('#form input.num').forEach(attachNumberFormatter);
    // attach generic change listeners
    document.querySelectorAll('#form input[type="text"], #form input[type="number"]').forEach((el) => {
      if (el.classList.contains('num')) return; // already attached
      el.addEventListener('input', onAnyChange);
    });
    document.getElementById('f-vat').addEventListener('change', onAnyChange);

    document.getElementById('btn-add-mac').addEventListener('click', () => {
      if (extras.length >= MAX_EXTRA) return;
      extras.push({ name: '', price: '' });
      renderExtraList();
      onAnyChange();
    });

    document.getElementById('btn-print').addEventListener('click', () => {
      saveState();
      window.print();
    });

    loadState();
    renderExtraList();
    // re-format loaded numeric values
    document.querySelectorAll('#form input.num').forEach((el) => { el.value = formatVN(el.value); });
    syncAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
