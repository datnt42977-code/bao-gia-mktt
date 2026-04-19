# Phase 5 — Hướng Dẫn Setup Tiếng Việt Cho User

## Priority
Critical — user không code, cần hướng dẫn chi tiết

## Overview
Tạo file `docs/huong-dan-setup.md` hướng dẫn user non-tech từng bước: tạo account, connect repo, deploy, install PWA.

## Structure của hướng dẫn
```
docs/huong-dan-setup.md

1. Chuẩn bị (5 phút)
   - Tạo account Gmail (nếu chưa)
   - Install app "GitHub" trên iPhone (tùy chọn, để check status)

2. Tạo GitHub account (5 phút)
   - Vào github.com → Sign up
   - Dùng Gmail → verify email
   - ✅ Screenshot minh hoạ

3. Tạo Render account (3 phút)
   - render.com → "Get Started" → "Sign in with GitHub"
   - Authorize → chọn free plan
   - ✅ KHÔNG cần nhập thẻ

4. Tạo Vercel account (3 phút)
   - vercel.com → "Sign up" → "Continue with GitHub"
   - ✅ KHÔNG cần nhập thẻ

5. Deploy Backend trên Render (10 phút)
   - Dashboard → "New +" → "Web Service"
   - Connect GitHub repo (tao đã push sẵn)
   - Config theo hình:
     * Name: bao-gia-api
     * Region: Singapore
     * Branch: main
     * Root Directory: backend
     * Environment: Docker
     * Plan: Free
   - "Create Web Service" → chờ 5-10 phút build
   - Copy URL: https://bao-gia-api-xxxx.onrender.com

6. Deploy Frontend trên Vercel (5 phút)
   - Dashboard → "Add New" → "Project"
   - Import repo
   - Config:
     * Root Directory: frontend
     * Framework Preset: Next.js (auto)
   - Environment Variables:
     * Name: NEXT_PUBLIC_API_URL
     * Value: (paste URL từ bước 5)
   - Deploy → chờ 2-3 phút
   - Copy URL: https://bao-gia-mktt.vercel.app

7. Cài app trên iPhone (2 phút)
   - Mở Safari → paste URL Vercel
   - Tap nút Share ⬆️ → "Add to Home Screen"
   - Đặt tên "Báo Giá MKTT"
   - Icon hiện trên màn hình chính

8. Test lần đầu
   - Mở app từ icon
   - Soạn 1 báo giá test
   - Lần đầu chờ ~50s (cold start server)
   - Các lần sau ~5-10s

9. Troubleshooting
   - "Lỗi kết nối" → chờ 1 phút, thử lại (server đang wake up)
   - PDF format lạ → báo tao, có thể template cần chỉnh
   - Share Zalo không hiện → check Zalo đã cài chưa
```

## Files to Create
- `docs/huong-dan-setup.md` — main guide
- `docs/huong-dan-su-dung-hang-ngay.md` — quick reference cho dùng sau này
- `docs/screenshots/` — ảnh minh hoạ các bước (user tự screenshot khi làm, hoặc tao dùng placeholder description)

## Implementation Steps
1. Viết bản markdown đầy đủ với step-by-step
2. Mỗi bước có: mục tiêu, thời gian, action cụ thể
3. Thêm checklist cuối mỗi section
4. Section troubleshooting riêng
5. Tạo file `docs/huong-dan-su-dung-hang-ngay.md` 1 trang: cách dùng app hàng ngày

## Todo
- [ ] Viết `huong-dan-setup.md` đầy đủ các bước
- [ ] Viết `huong-dan-su-dung-hang-ngay.md` (quick ref)
- [ ] Live walkthrough với user lần đầu (nếu user cần hỗ trợ trực tiếp)

## Success Criteria
- User đọc guide tự setup < 30 phút
- Không cần hỏi tao câu nào trong quá trình setup
- App chạy thành công trên iPhone cuối cùng

## Risks
- User click nhầm, tạo sai account → hướng dẫn reset cụ thể
- UI Render/Vercel thay đổi theo thời gian → guide có thể outdated → note "nếu UI khác, tìm nút tương đương"

## Dependencies
- Phase 4 deployed thành công để test guide
