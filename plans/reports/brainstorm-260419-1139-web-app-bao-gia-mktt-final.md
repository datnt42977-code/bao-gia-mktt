# Brainstorm Report FINAL — Web App Báo Giá MKTT

**Date:** 2026-04-19
**Status:** Design locked, ready for /ck:plan

## Ultimate Goal
Tiết kiệm thời gian cá nhân. User ở ngoài công trình, ghét thao tác Word trên điện thoại. **1 user (chính user), không team.**

## Scope (KISS — dropped from v1)
- ❌ Login/Auth — chỉ 1 user, URL bí mật đủ
- ❌ Database — không cần lưu lịch sử báo giá
- ❌ Supabase — không cần
- ❌ Multi-user — không cần
- ✅ Autocomplete tên khách + mác+giá gần nhất (lưu localStorage iPhone)

## Final Stack
- **Frontend:** Next.js (PWA) trên **Vercel** (free, no card)
- **Backend:** Node.js + Docker LibreOffice trên **Render.com** (free, no card)
- **Storage state:** localStorage trên iPhone (autocomplete)
- **Domain:** `baogia-mktt.vercel.app` free
- **Cost:** 0đ/tháng

## Workflow
1. Tap icon app trên iPhone (PWA add-to-home-screen)
2. Điền form: ngày, tên khách (autocomplete), công trình, mác+giá (dynamic rows, autocomplete), giá bơm
3. Tap "Xuất PDF" → server render ~5-10s (lần đầu/ngày ~50s cold start)
4. PDF hiện → tap Share → chọn Zalo → gửi khách

## Template
`BAO GIA MKTT- CLAUDE.docx` — tao copy → `template.docx`, thay ô đỏ thành Jinja placeholder:
- `{{ngay}}`, `{{ten_khach}}`, `{{cong_trinh}}`, `{{gia_bom}}`
- Loop table mác: `{%tr for m in mac_list %}{{m.ten}}|{{m.gia}}{%tr endfor %}`

Bản gốc giữ nguyên.

## File naming
`Bao_Gia_Mekong_[TenKhach]_[DDMMYYYY].pdf`

## Risks
- **Render free sleep 15ph idle** → cold start ~50s. Chấp nhận, cảnh báo user trên UI "đang khởi động server".
- **Font tiếng Việt** → Dockerfile preload Times/Arial.
- **URL public nếu bị lộ** → ai cũng gen PDF được. Mitigation: thêm password đơn giản (1 chuỗi env var, nhập 1 lần lưu localStorage).

## Success Criteria
- Soạn 1 báo giá < 60 giây từ khi mở app (sau cold start)
- PDF format giống bản gốc ≥99%
- Share Zalo 1 tap
- User setup lần đầu < 30 phút

## Next Steps
1. Đọc + phân tích `BAO GIA MKTT- CLAUDE.docx` chi tiết
2. `/ck:plan` → phase: template prep → backend → frontend → deploy → hướng dẫn setup tiếng Việt
3. Implement

## Unresolved
- Có cần password bảo vệ URL không? (tao khuyên có — 1 dòng code thêm)
- Template có logo/chữ ký scan cần nhúng không? (xác định khi đọc docx)
- Bảng mác bê tông trong docx là table với header cố định hay gì? (xác định khi đọc)
