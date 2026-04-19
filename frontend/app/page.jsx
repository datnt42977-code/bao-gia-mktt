'use client';
import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const LS_KEY = 'bg-history-v1';

const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};
const saveHistory = (h) => localStorage.setItem(LS_KEY, JSON.stringify(h));
const pushUnique = (arr, v, max = 30) => {
  if (!v) return arr;
  const next = [v, ...arr.filter(x => x !== v)];
  return next.slice(0, max);
};

const today = () => {
  const d = new Date();
  return { ngay: String(d.getDate()).padStart(2, '0'), thang: String(d.getMonth() + 1).padStart(2, '0'), nam: String(d.getFullYear()) };
};

export default function Page() {
  const [form, setForm] = useState({
    ...today(),
    ten_khach: '',
    cong_trinh: '',
    mac_list: [{ ten: '', gia: '' }],
    gia_bom_1: '', gia_bom_2: '', gia_bom_3: '', gia_bom_4: '',
  });
  const [hist, setHist] = useState({ ten_khach: [], cong_trinh: [], ten_mac: [], gia_mac: [], gia_bom: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => { setHist({ ten_khach: [], cong_trinh: [], ten_mac: [], gia_mac: [], gia_bom: [], ...loadHistory() }); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setMac = (i, k, v) => setForm(f => ({ ...f, mac_list: f.mac_list.map((m, j) => j === i ? { ...m, [k]: v } : m) }));
  const addMac = () => setForm(f => ({ ...f, mac_list: [...f.mac_list, { ten: '', gia: '' }] }));
  const rmMac = (i) => setForm(f => ({ ...f, mac_list: f.mac_list.filter((_, j) => j !== i) }));

  const submit = async () => {
    setErr(''); setLoading(true);
    try {
      const payload = { ...form, mac_list: form.mac_list.filter(m => m.ten || m.gia) };
      const r = await fetch(`${API}/render`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
      const blob = await r.blob();
      const cd = r.headers.get('Content-Disposition') || '';
      const fname = (cd.match(/filename="([^"]+)"/) || [])[1] || 'bao-gia.pdf';

      const newHist = {
        ten_khach: pushUnique(hist.ten_khach, form.ten_khach),
        cong_trinh: pushUnique(hist.cong_trinh, form.cong_trinh),
        ten_mac: form.mac_list.reduce((a, m) => pushUnique(a, m.ten), hist.ten_mac),
        gia_mac: form.mac_list.reduce((a, m) => pushUnique(a, m.gia), hist.gia_mac),
        gia_bom: [form.gia_bom_1, form.gia_bom_2, form.gia_bom_3, form.gia_bom_4].reduce((a, v) => pushUnique(a, v), hist.gia_bom),
      };
      setHist(newHist); saveHistory(newHist);

      const file = new File([blob], fname, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: fname }); return; } catch {}
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fname; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setErr(e.message || 'Lỗi không xác định');
    } finally { setLoading(false); }
  };

  const listId = (k) => `dl-${k}`;

  return (
    <main className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-red-600">Báo Giá MKTT</h1>

      <datalist id={listId('ten_khach')}>{hist.ten_khach.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={listId('cong_trinh')}>{hist.cong_trinh.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={listId('ten_mac')}>{hist.ten_mac.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={listId('gia_mac')}>{hist.gia_mac.map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={listId('gia_bom')}>{hist.gia_bom.map(v => <option key={v} value={v} />)}</datalist>

      <section className="bg-white rounded-lg p-4 shadow space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Ngày" value={form.ngay} onChange={v => set('ngay', v)} />
          <Field label="Tháng" value={form.thang} onChange={v => set('thang', v)} />
          <Field label="Năm" value={form.nam} onChange={v => set('nam', v)} />
        </div>
        <Field label="Tên khách" value={form.ten_khach} onChange={v => set('ten_khach', v)} list={listId('ten_khach')} />
        <Field label="Công trình" value={form.cong_trinh} onChange={v => set('cong_trinh', v)} list={listId('cong_trinh')} />
      </section>

      <section className="bg-white rounded-lg p-4 shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Mác bê tông</h2>
          <button onClick={addMac} className="text-sm bg-red-600 text-white px-3 py-1 rounded">+ Thêm mác</button>
        </div>
        {form.mac_list.map((m, i) => (
          <div key={i} className="flex gap-2 items-end">
            <Field label={`Mác ${i + 1}`} value={m.ten} onChange={v => setMac(i, 'ten', v)} list={listId('ten_mac')} />
            <Field label="Giá" value={m.gia} onChange={v => setMac(i, 'gia', v)} list={listId('gia_mac')} />
            {form.mac_list.length > 1 && <button onClick={() => rmMac(i)} className="mb-2 text-red-600 px-2">✕</button>}
          </div>
        ))}
      </section>

      <section className="bg-white rounded-lg p-4 shadow space-y-3">
        <h2 className="font-semibold">Giá bơm</h2>
        <Field label="Bơm 1 (trọn gói)" value={form.gia_bom_1} onChange={v => set('gia_bom_1', v)} list={listId('gia_bom')} />
        <Field label="Bơm 2 (theo m³)" value={form.gia_bom_2} onChange={v => set('gia_bom_2', v)} list={listId('gia_bom')} />
        <Field label="Bơm 3 (trọn gói)" value={form.gia_bom_3} onChange={v => set('gia_bom_3', v)} list={listId('gia_bom')} />
        <Field label="Bơm 4 (theo m³)" value={form.gia_bom_4} onChange={v => set('gia_bom_4', v)} list={listId('gia_bom')} />
      </section>

      {err && <div className="bg-red-100 text-red-700 p-3 rounded">{err}</div>}

      <button onClick={submit} disabled={loading}
        className="w-full bg-red-600 text-white py-4 rounded-lg font-bold text-lg disabled:opacity-50">
        {loading ? 'Đang tạo PDF...' : 'Xuất PDF & Chia sẻ'}
      </button>
    </main>
  );
}

function Field({ label, value, onChange, list }) {
  return (
    <label className="block flex-1">
      <span className="text-sm text-gray-600">{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} list={list}
        className="w-full border rounded px-3 py-2 mt-1" />
    </label>
  );
}
