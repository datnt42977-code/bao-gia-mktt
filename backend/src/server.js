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

app.post('/render', async (req, res) => {
  try {
    const data = req.body || {};
    if (!data.ten_khach) return res.status(400).json({ error: 'Thiếu ten_khach' });

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

    const safeName = String(data.ten_khach).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '');
    const dd = String(data.ngay || '').padStart(2, '0');
    const mm = String(data.thang || '').padStart(2, '0');
    const yyyy = String(data.nam || '');
    const fname = `Bao_Gia_Mekong_${safeName}_${dd}${mm}${yyyy}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(pdfBuf);
  } catch (e) {
    console.error('[render]', e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
