# Brainstorm Report — Web App Báo Giá MKTT

**Date:** 2026-04-19
**Status:** Design approved, ready to plan

## Problem
User cần app trên iPhone (16 Pro Max) để soạn báo giá bê tông tươi từ template docx có ô đỏ, xuất PDF, share Zalo. Nhiều user quyền bằng nhau. User không code. Không trả phí, không credit card. Format PDF đúng 99%.

## Template
`C:\BAO GIA MKTT\BAO GIA MKTT- CLAUDE.docx` — các ô đỏ: ngày tháng năm, tên khách, tên công trình, mác bê tông (nhiều loại), giá từng mác, giá bơm bê tông.

## Approaches Evaluated

| # | Approach | Verdict |
|---|---|---|
| A | Python script trên PC Windows | Reject — user cần mobile |
| B | Native iOS app | Reject — cần Mac + $99/năm Apple Dev |
| C | Web app client-side PDF (jsPDF) | Reject — format docx phức tạp, không đạt 99% |
| D | Web app + Google Cloud Run | Reject — cần credit card |
| E | **Web app + Render.com + Vercel + Supabase** | **Chọn** — $0, không thẻ, 99% format |
| F | Tích hợp website bê tông sẵn có | Reject — user đổi ý, không dùng domain |

## Final Solution

**Stack:**
- Frontend: Next.js (PWA) → Vercel free
- Backend PDF: Node.js + Docker LibreOffice → Render.com free
- Auth/DB/Storage: Supabase free
- Domain: `*.vercel.app` miễn phí

**Features:**
1. Login email/password (multi-user, quyền bằng nhau)
2. Form: ngày, tên khách, công trình, mác+giá (dynamic rows), giá bơm
3. Render server-side qua docxtpl + LibreOffice → PDF 99% giữ format
4. Web Share API → share Zalo từ iPhone
5. Lịch sử báo giá, search theo tên khách
6. Tên file: `Bao_Gia_Mekong_[TenKhach]_[DDMMYYYY].pdf`

**Template workflow:** Copy `BAO GIA MKTT- CLAUDE.docx` → `template.docx`, thay ô đỏ thành Jinja placeholder (`{{ten_khach}}`, `{{ngay}}`, `{%tr for m in mac_list %}`...). Bản gốc giữ nguyên.

## Risks & Mitigation
- **Render free sleep 15 phút idle** → cold start ~50s. Chấp nhận, báo trước user.
- **Font tiếng Việt** → LibreOffice Docker preload font Times/Arial.
- **User không code** → tao viết hướng dẫn tiếng Việt từng bước (tạo account Vercel/Supabase/Render/GitHub, copy-paste config, click deploy).

## Cost
**0 đ/tháng. Không cần credit card bước nào.**

## Success Criteria
- Tạo báo giá 1 khách < 2 phút từ khi mở app
- PDF giống bản gốc ≥99% (đặc biệt: font, table, màu)
- Share Zalo 1 tap
- Setup lần đầu < 45 phút cho user non-tech

## Next Steps
1. Đọc + phân tích `BAO GIA MKTT- CLAUDE.docx` chi tiết (vị trí ô đỏ, bảng mác)
2. Tạo plan chi tiết với các phase: setup accounts → template → backend → frontend → auth → deploy → docs hướng dẫn
3. Implement

## Unresolved
- Bảng mác bê tông trong template là table cố định hay có thể thêm/bớt dòng? (xác định khi đọc docx)
- User muốn logo công ty/chữ ký scan nhúng PDF không?
