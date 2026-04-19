# Phase 4 — Deploy

## Priority
High — user cần app chạy thật

## Overview
Push code lên GitHub → connect Render (backend) + Vercel (frontend) → app live trên internet.

## Structure repo
```
BAO-GIA-MKTT/ (GitHub repo)
├── backend/        # Phase 2
├── frontend/       # Phase 3
├── .gitignore
└── README.md
```

**Monorepo** — Render deploy từ `backend/`, Vercel deploy từ `frontend/`.

## Steps

### 4.1 GitHub
1. User tạo account GitHub (nếu chưa có) — không cần thẻ
2. Tạo repo private `bao-gia-mktt`
3. Tao `git init` local + push lên remote

### 4.2 Render (backend)
1. User đăng ký Render.com bằng GitHub account — không cần thẻ free tier
2. New Web Service → connect repo → select `backend/` folder
3. Config:
   - **Environment:** Docker
   - **Region:** Singapore (gần VN nhất)
   - **Plan:** Free
   - **Health check path:** `/health`
4. Deploy → lấy URL `https://baogia-api.onrender.com`

### 4.3 Vercel (frontend)
1. User đăng ký Vercel bằng GitHub — không cần thẻ
2. Import project → select `frontend/` folder
3. Env var: `NEXT_PUBLIC_API_URL=https://baogia-api.onrender.com`
4. Deploy → lấy URL `https://bao-gia-mktt.vercel.app`

### 4.4 CORS fix
Update `backend/src/server.js`:
```js
app.use(cors({origin: 'https://bao-gia-mktt.vercel.app'}));
```
Commit + push → Render auto redeploy.

### 4.5 Smoke test
1. Mở URL Vercel trên iPhone Safari
2. Soạn 1 báo giá test → xuất PDF
3. Check PDF đúng format
4. Add to Home Screen → mở từ icon → vẫn OK

## Todo
- [ ] User tạo GitHub account (nếu chưa có)
- [ ] Tao init git + push repo lên GitHub
- [ ] User connect Render → deploy backend
- [ ] User connect Vercel → deploy frontend
- [ ] Update CORS với Vercel domain → redeploy backend
- [ ] Smoke test end-to-end trên iPhone
- [ ] Fix bug nếu có

## Success Criteria
- URL Vercel mở được trên iPhone Safari
- POST /render từ frontend → trả PDF < 15s (sau warm-up)
- Cold start lần đầu < 60s
- PWA install từ Safari → mở như app

## Risks
- Render free tier xóa service nếu 90 ngày không deploy → set reminder
- Build time Render ~5-10 phút (docker + libreoffice install)
- Vercel build fail nếu ENV var thiếu → check trước deploy

## Dependencies
- Phase 1, 2, 3 hoàn thành
