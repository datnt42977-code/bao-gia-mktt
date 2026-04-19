---
name: Web App Báo Giá MKTT
status: pending
created: 2026-04-19
owner: user
blockedBy: []
blocks: []
---

# Plan — Web App Báo Giá MKTT

## Mục tiêu
Web app PWA trên iPhone để soạn báo giá bê tông từ template docx và xuất PDF. 1 user, $0/tháng, format PDF 99%.

Chi tiết thiết kế: [brainstorm-260419-1139-web-app-bao-gia-mktt-final.md](../reports/brainstorm-260419-1139-web-app-bao-gia-mktt-final.md)

## Stack
- Frontend: Next.js 14 (App Router) + Tailwind + PWA → Vercel free
- Backend: Node.js (Express) + docx-templater + LibreOffice headless → Render.com free (Docker)
- Storage: localStorage iPhone (autocomplete only)
- Repo: GitHub (free public/private)

## Phases

| # | Phase | Status | File |
|---|---|---|---|
| 1 | Phân tích template docx + tạo template.docx | pending | [phase-01-template-analysis.md](phase-01-template-analysis.md) |
| 2 | Backend PDF render service | pending | [phase-02-backend-pdf-render.md](phase-02-backend-pdf-render.md) |
| 3 | Frontend PWA form + autocomplete + share | pending | [phase-03-frontend-pwa.md](phase-03-frontend-pwa.md) |
| 4 | Deploy GitHub + Render + Vercel | pending | [phase-04-deploy.md](phase-04-deploy.md) |
| 5 | Hướng dẫn setup tiếng Việt cho user | pending | [phase-05-user-setup-guide.md](phase-05-user-setup-guide.md) |

## Dependencies
Tuần tự: 1 → 2 → 3 → 4 → 5. Không parallel (phase sau cần output phase trước).

## Success Criteria
- Soạn 1 báo giá < 60s (sau cold start)
- PDF format ≥ 99% giống bản gốc
- Share Zalo qua iOS share sheet OK
- User tự setup theo hướng dẫn < 30 phút
- $0/tháng, không credit card
