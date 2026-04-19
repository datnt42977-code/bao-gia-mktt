# Phase 1 — Phân tích template docx + tạo template.docx

## Priority
Critical — blocker cho Phase 2

## Overview
Đọc `C:\BAO GIA MKTT\BAO GIA MKTT- CLAUDE.docx`, xác định chính xác vị trí/format các ô chữ đỏ, rồi tạo `template.docx` với Jinja placeholder cho `docx-templater`.

## Key Insights
- docx = ZIP chứa XML. Chữ đỏ thường có `<w:color w:val="FF0000"/>` trong `w:rPr`.
- Table mác bê tông cần syntax loop của docx-templater: `{#mac_list} ... {/mac_list}` (KHÔNG phải docxtpl Jinja — khác library).
- Chọn library **docxtemplater** (Node.js) vì backend là Node.

## Implementation Steps
1. Unzip `BAO GIA MKTT- CLAUDE.docx` → dump `word/document.xml`
2. Grep các run có `w:color="FF0000"` → liệt kê text + vị trí
3. Map từng ô đỏ → placeholder:
   - Ngày → `{ngay}`
   - Tên khách → `{ten_khach}`
   - Tên công trình → `{cong_trinh}`
   - Mác bê tông table: `{#mac_list}{ten}{gia}{/mac_list}` (loop row)
   - Giá bơm → `{gia_bom}`
4. Mở bản copy trong Word Online / Google Docs (user làm, hoặc dùng python-docx):
   - Thay text đỏ bằng placeholder (giữ màu đỏ để dễ debug, hoặc đổi về đen)
   - Với bảng mác: dùng loop syntax đặc biệt của docx-templater
5. Lưu → `template.docx` (đặt trong repo, thư mục `backend/templates/`)
6. Test render thử 1 lần với sample data → check format

## Related Files
- Read: `C:\BAO GIA MKTT\BAO GIA MKTT- CLAUDE.docx`
- Create: `backend/templates/template.docx`
- Create: `backend/templates/sample-data.json` (test data)

## Todo
- [ ] Unzip docx, đọc document.xml
- [ ] Liệt kê tất cả run chữ đỏ (file `red-runs.txt`)
- [ ] Confirm với user: map fields (tên biến placeholder)
- [ ] Edit docx → thay text đỏ thành placeholder
- [ ] Test render local với sample data
- [ ] Commit template.docx

## Success Criteria
- `template.docx` render ra docx hợp lệ với sample data
- Tất cả ô đỏ được replace đúng
- Bảng mác loop đúng số dòng theo input

## Risks
- Chữ đỏ có thể nằm giữa 1 run dài → cần split run thủ công trong Word
- Bảng mác có thể là cell cố định, không phải template row → cần restructure table

## Unresolved
- Logo/chữ ký scan có trong template không? (xác định khi đọc)
- Có footer "Giá đã bao gồm VAT" kiểu dynamic không?
