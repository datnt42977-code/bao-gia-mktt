const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const PORT = process.env.PORT || 3000;
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'template.docx');
const SOFFICE = process.env.SOFFICE_BIN || 'soffice';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

// Ép String + gộp khoảng trắng dư (đa space, tab, xuống dòng đầu/cuối)
const norm = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
// Chuẩn hoá toàn bộ cây dữ liệu: primitive -> norm(String); giữ cấu trúc array/object
const normalizeDeep = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(normalizeDeep);
  if (typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = normalizeDeep(v[k]);
    return out;
  }
  return norm(v);
};
// Cắt nếu dài quá, thêm '…'
const clamp = (v, max) => {
  const s = norm(v);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
};
// Giới hạn mặc định cho từng field (dựa vào bề rộng ô thực tế)
const FIELD_LIMITS = {
  ten_khach: 80, cong_trinh: 90,
  gia_bom_1: 15, gia_bom_2: 15, gia_bom_3: 15, gia_bom_4: 15,
};
const GIA_BOM_KEYS = ['gia_bom_1', 'gia_bom_2', 'gia_bom_3', 'gia_bom_4'];
// Xoá mọi ký tự xuống dòng/điều khiển trong ô đơn giá bơm để không tăng chiều cao hàng
const stripLineBreaks = (s) => String(s ?? '').replace(/[\r\n\u2028\u2029\v\f]+/g, ' ').replace(/\s+/g, ' ').trim();

app.post('/render', async (req, res) => {
  try {
    // Ép mọi giá trị sang String + trim/gộp whitespace trước khi render
    const data = normalizeDeep(req.body || {});
    if (!data.ten_khach) return res.status(400).json({ error: 'Thiếu ten_khach' });

    // Đơn giá bơm: hard-strip newline + clamp 15 ký tự (dài hơn → cắt + '…')
    for (const k of GIA_BOM_KEYS) {
      if (data[k] == null) continue;
      const s = stripLineBreaks(data[k]);
      data[k] = s.length > 15 ? s.slice(0, 14) + '…' : s;
    }
    // Clamp các field còn lại
    for (const [k, max] of Object.entries(FIELD_LIMITS)) {
      if (GIA_BOM_KEYS.includes(k)) continue;
      if (data[k] != null) data[k] = clamp(data[k], max);
    }
    // Clamp mac_list entries
    if (Array.isArray(data.mac_list)) {
      data.mac_list = data.mac_list.map(r => ({
        ...r, ten: clamp(r.ten, 20), gia: clamp(r.gia, 16),
      }));
    }

    const zip = new PizZip(fs.readFileSync(TEMPLATE_PATH));
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(data);
    const docxBuf = doc.getZip().generate({ type: 'nodebuffer' });

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bg-'));
    const docxPath = path.join(tmpDir, 'out.docx');
    fs.writeFileSync(docxPath, docxBuf);

    await new Promise((resolve, reject) => {
      execFile(SOFFICE, ['--headless', '--convert-to', 'pdf', '--outdir', tmpDir, docxPath],
        { timeout: 60000 }, (err, _so, se) => err ? reject(new Error(se || err.message)) : resolve());
    });

    const pdfPath = path.join(tmpDir, 'out.pdf');
    const pdfBuf = fs.readFileSync(pdfPath);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
    const rawName = String(data.ten_khach).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '');
    const asciiName = stripDiacritics(rawName).replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_|_$/g, '');
    const dd = String(data.ngay || '').padStart(2, '0');
    const mm = String(data.thang || '').padStart(2, '0');
    const yyyy = String(data.nam || '');
    const fnameAscii = `Bao_Gia_Mekong_${asciiName}_${dd}${mm}${yyyy}.pdf`;
    const fnameUtf8 = `Bao_Gia_Mekong_${rawName}_${dd}${mm}${yyyy}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fnameAscii}"; filename*=UTF-8''${encodeURIComponent(fnameUtf8)}`);
    res.send(pdfBuf);
  } catch (e) {
    console.error('[render]', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
