# Phase 3 — Frontend PWA

## Priority
High — UI user tương tác

## Overview
Next.js 14 App Router, 1 trang duy nhất, PWA, mobile-first UI cho iPhone. Form nhập → call backend `/render` → download PDF → share Zalo.

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- `next-pwa` (service worker + manifest)
- React Hook Form (form state)
- TypeScript

## UI Layout (mobile-first)
```
┌─────────────────────────┐
│   Báo Giá MKTT         │
├─────────────────────────┤
│ Ngày:    [19/04/2026]  │
│ Tên KH:  [_________]   │ ← autocomplete
│ Công trình: [________] │ ← autocomplete
│                         │
│ Mác bê tông:            │
│ ┌─ Mác 250    1,200k ❌│
│ ┌─ Mác 300    1,350k ❌│
│ [+ Thêm mác]            │
│                         │
│ Giá bơm: [250,000]     │
│                         │
│ [  XUẤT PDF  ]         │
└─────────────────────────┘
```

Sau khi render xong:
```
┌─────────────────────────┐
│ ✓ PDF sẵn sàng!        │
│ Bao_Gia_Mekong_...pdf   │
│                         │
│ [ 📥 Tải xuống ]        │
│ [ 📤 Chia sẻ Zalo ]    │
│ [ ← Soạn mới ]          │
└─────────────────────────┘
```

## Files to Create
```
frontend/
├── package.json
├── next.config.js           # next-pwa config
├── tailwind.config.ts
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── app/
│   │   ├── layout.tsx       # PWA meta tags
│   │   ├── page.tsx         # main form page
│   │   └── globals.css
│   ├── components/
│   │   ├── quote-form.tsx
│   │   ├── mac-row.tsx
│   │   ├── autocomplete-input.tsx
│   │   └── pdf-result.tsx
│   ├── lib/
│   │   ├── api-client.ts    # POST /render
│   │   ├── autocomplete-store.ts  # localStorage wrapper
│   │   └── share-pdf.ts     # navigator.share wrapper
│   └── types.ts
└── .env.local               # NEXT_PUBLIC_API_URL
```

## Implementation Steps
1. `npx create-next-app@latest frontend --typescript --tailwind --app`
2. Install: `next-pwa react-hook-form`
3. `manifest.json`: name "Báo Giá MKTT", display "standalone", theme_color, icons
4. `next.config.js`: wrap với `withPWA`
5. `autocomplete-store.ts`:
   - Key `baogia.customers` → `string[]` tên khách đã dùng
   - Key `baogia.projects` → `string[]` công trình
   - Key `baogia.macs` → `{ten: string, gia: string}[]` mác+giá gần đây
   - Auto-save khi submit thành công
6. `autocomplete-input.tsx`: input với datalist HTML5 (iOS hỗ trợ)
7. `quote-form.tsx`:
   - React Hook Form
   - Dynamic rows cho mac_list (useFieldArray)
   - Validate: tên khách, ngày bắt buộc, ít nhất 1 mác
8. `api-client.ts`: `POST {API_URL}/render` với JSON, nhận Blob PDF
9. `share-pdf.ts`:
   ```ts
   async function sharePdf(blob, filename) {
     const file = new File([blob], filename, {type: 'application/pdf'});
     if (navigator.canShare?.({files: [file]})) {
       await navigator.share({files: [file], title: filename});
     } else {
       // fallback: download
     }
   }
   ```
10. `pdf-result.tsx`: show filename + 3 buttons (download, share, new)
11. Loading state: khi đang render hiển thị "Đang tạo PDF... (~10s, lần đầu/ngày ~50s)"
12. Error state: "Lỗi kết nối, thử lại" với retry button

## Todo
- [ ] Scaffold Next.js + Tailwind + PWA
- [ ] Build quote-form với dynamic mac rows
- [ ] Implement autocomplete-store + test localStorage persistence
- [ ] API client với loading/error state
- [ ] Share PDF component + test navigator.share trên iOS Safari (qua ngrok khi dev local)
- [ ] PWA manifest + service worker + Add to Home Screen test
- [ ] Responsive: test trên iPhone Safari (DevTools iPhone mode)

## Success Criteria
- UI chạy mượt trên iPhone 16 Pro Max Safari
- Add to Home Screen xong mở giống app native
- Autocomplete gợi ý đúng từ lịch sử localStorage
- Share button hiện share sheet iOS với Zalo option
- Soạn báo giá < 30s (không tính cold start server)

## Risks
- `navigator.share` với file PDF: verified OK iOS Safari 15+ (đã research)
- iOS PWA khởi động có thể chậm 1-2s
- datalist autocomplete iOS Safari: hoạt động nhưng UI có thể xấu → fallback tự build dropdown nếu cần

## Dependencies
- Phase 2 output: backend `/render` endpoint deployed hoặc URL local qua ngrok để test
