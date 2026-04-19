# Phase 2 — Backend PDF Render Service

## Priority
High — core service

## Overview
Node.js Express server: nhận JSON data → render `template.docx` → convert DOCX→PDF bằng LibreOffice headless → trả file PDF. Deploy qua Docker lên Render.com.

## Stack
- Node.js 20 LTS + Express
- `docxtemplater` + `pizzip` (render DOCX)
- `libreoffice` headless (subprocess) cho DOCX→PDF
- Docker (Dockerfile based on `linuxserver/libreoffice` hoặc Debian + install libreoffice)

## API
**POST /render**
```json
Request:
{
  "ngay": "19/04/2026",
  "ten_khach": "Nguyễn Văn A",
  "cong_trinh": "Nhà phố Q7",
  "mac_list": [
    {"ten": "Mác 250", "gia": "1,200,000"},
    {"ten": "Mác 300", "gia": "1,350,000"}
  ],
  "gia_bom": "250,000"
}

Response: application/pdf (binary)
Header: Content-Disposition: attachment; filename="Bao_Gia_Mekong_NguyenVanA_19042026.pdf"
```

**GET /health** → `{ok: true}` cho Render health check.

## Files to Create
```
backend/
├── Dockerfile
├── package.json
├── src/
│   ├── server.js          # Express app, routes
│   ├── render-docx.js     # docxtemplater logic
│   ├── docx-to-pdf.js     # LibreOffice subprocess
│   └── filename.js        # build Bao_Gia_Mekong_[Ten]_[DDMMYYYY].pdf
├── templates/
│   └── template.docx      # từ Phase 1
└── .gitignore
```

## Implementation Steps
1. `npm init -y` + install: `express docxtemplater pizzip cors`
2. `render-docx.js`: load template → `Docxtemplater` → `setData(input)` → `render()` → trả buffer DOCX
3. `docx-to-pdf.js`: write buffer → `/tmp/in.docx` → spawn `libreoffice --headless --convert-to pdf --outdir /tmp /tmp/in.docx` → read `/tmp/in.pdf` → trả buffer
4. `filename.js`: normalize tên khách (bỏ dấu, space → underscore) + format date DDMMYYYY
5. `server.js`: POST /render → pipeline → res.send(pdfBuffer) với Content-Disposition
6. CORS: allow origin Vercel domain
7. Dockerfile: base `node:20-slim` → apt install `libreoffice-core libreoffice-writer fonts-liberation fonts-dejavu` → COPY source → CMD `node src/server.js`
8. Test local: `docker build . -t baogia-api && docker run -p 3001:3001 baogia-api` → curl test

## Todo
- [ ] Init npm + install deps
- [ ] Implement render-docx.js + unit test sample data
- [ ] Implement docx-to-pdf.js + verify PDF output local (manual mở xem format)
- [ ] Implement filename.js (bỏ dấu tiếng Việt)
- [ ] Implement server.js với CORS + error handling
- [ ] Write Dockerfile + test build local
- [ ] docker run + curl test POST /render → lưu response ra PDF → mở check
- [ ] Verify font tiếng Việt hiển thị đúng trong PDF output

## Success Criteria
- `curl -X POST localhost:3001/render -d @sample.json` trả PDF hợp lệ
- PDF mở được, font tiếng Việt đúng, format giống bản gốc ≥99%
- Tên file đúng pattern `Bao_Gia_Mekong_TenKhach_DDMMYYYY.pdf`
- Docker image < 1GB (để deploy Render free nhanh)

## Risks
- **Font tiếng Việt:** Dockerfile phải cài `fonts-liberation fonts-dejavu` hoặc copy font Times New Roman nếu template dùng. Test kỹ.
- **LibreOffice chậm:** lần đầu subprocess ~3-5s. Chấp nhận.
- **Render free RAM 512MB:** LibreOffice có thể OOM với docx phức tạp. Monitor, nếu fail → upgrade logic hoặc cắt template.

## Security
- Validate input JSON: max length tên khách, sanitize path filename (chống path traversal)
- Timeout LibreOffice subprocess 30s (tránh zombie process)
- Rate limit đơn giản (1 request/5s per IP) để tránh abuse nếu URL lộ

## Dependencies
- Phase 1 output: `template.docx`
