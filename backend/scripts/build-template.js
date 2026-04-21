// Build template.docx from the original by replacing red-colored runs
// with docxtemplater placeholders. Also converts the mác table (4 static
// rows) into a single loopable row with {#mac_list}{/mac_list} tags.

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const SRC = path.join(__dirname, '..', '..', 'BAO GIA MKTT- CLAUDE.docx');
const OUT = path.join(__dirname, '..', 'templates', 'template.docx');

const buf = fs.readFileSync(SRC);
const zip = new PizZip(buf);
let xml = zip.file('word/document.xml').asText();

// --- 1. Parse all <w:r> runs; mark ones containing FF0000 color as red ---
const runRegex = /<w:r\b[^>]*>[\s\S]*?<\/w:r>/g;
const runs = [];
let m;
while ((m = runRegex.exec(xml)) !== null) {
  runs.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
}
function isRed(runText) {
  return /w:color\s+w:val="FF0000"/i.test(runText);
}
function getTextInRun(runText) {
  return [...runText.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)].map(x => x[1]).join('');
}

// --- 2. Group contiguous red runs into clusters ---
const clusters = []; // {runs: [indices], joined: string}
let cur = null;
for (let i = 0; i < runs.length; i++) {
  if (isRed(runs[i].text)) {
    if (!cur) cur = { idx: [], joined: '' };
    cur.idx.push(i);
    cur.joined += getTextInRun(runs[i].text);
  } else {
    if (cur) { clusters.push(cur); cur = null; }
  }
}
if (cur) clusters.push(cur);

console.log(`Found ${clusters.length} red clusters:`);
clusters.forEach((c, i) => console.log(`  [${i}] "${c.joined}"`));

// --- 3. Map clusters to placeholders ---
// Expected clusters (in document order):
//   0: "09/04/2026" split — date  → {ngay}
//   1: "CÔNG TY..."           → {ten_khach}
//   2: "Phú Hữu..."           → {cong_trinh}
//   3: "M150R28"               → will become {ten} inside loop
//   4: "1.530.000"             → will become {gia}
//   5-6: M200R28 / 1.580.000
//   7-8: M250R28 / 1.630.000
//   9-10: M300R28 / 1.680.000
//  11: "3.200.000đ"            → {gia_bom_1}
//  12: "115.000đ"              → {gia_bom_2}
//  13: "4.000.000đ"            → {gia_bom_3}
//  14: "125.000đ"              → {gia_bom_4}
//  15: "0903.071.734"          → LEAVE AS-IS (user's phone)
//  16: "Mr Đạt"                → LEAVE AS-IS
// Total red clusters expected ~17; actual count printed above.

// We'll first patch runs to inject placeholders, THEN handle the table row
// duplication separately. Strategy: edit `runs[i].text` in-place, then
// rebuild xml from runs slices.

const TNR_RFONTS = '<w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>';
function setRunText(i, newText) {
  let r = runs[i].text;
  // Strip red color FF0000 from this run's rPr (turn placeholder text black)
  r = r.replace(/<w:color\s+w:val="FF0000"\s*\/>/gi, '');
  // Ensure rPr exists, then force Times New Roman font (drop any existing rFonts/theme font)
  if (!/<w:rPr>/.test(r)) {
    r = r.replace(/<w:r\b([^>]*)>/, `<w:r$1><w:rPr>${TNR_RFONTS}</w:rPr>`);
  } else {
    r = r.replace(/<w:rFonts\b[^\/]*\/>/g, '');
    r = r.replace(/<w:rPr>/, `<w:rPr>${TNR_RFONTS}`);
  }
  // Ensure bold: inject <w:b/><w:bCs/> into rPr if missing
  if (!/<w:b\s*\/>/.test(r)) {
    r = r.replace(/<w:rPr>/, '<w:rPr><w:b/><w:bCs/>');
  }
  // Replace first <w:t>...</w:t> with new text (preserves xml:space="preserve")
  let replaced = false;
  const newRun = r.replace(/<w:t\b([^>]*)>[\s\S]*?<\/w:t>/, (match, attrs) => {
    if (replaced) return ''; // drop extra w:t blocks in the run
    replaced = true;
    return `<w:t${attrs || ' xml:space="preserve"'}>${newText}</w:t>`;
  });
  runs[i].text = newRun;
}
function clearRunText(i) {
  runs[i].text = runs[i].text.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/g, '<w:t xml:space="preserve"></w:t>');
}
function setClusterPlaceholder(ci, placeholder) {
  const cluster = clusters[ci];
  setRunText(cluster.idx[0], placeholder);
  for (let j = 1; j < cluster.idx.length; j++) clearRunText(cluster.idx[j]);
}

// Apply simple field mappings (18 clusters actual)
setClusterPlaceholder(0, '{ngay}');    // day
setClusterPlaceholder(1, '{thang}');   // month
setClusterPlaceholder(2, '{nam}');     // year
setClusterPlaceholder(3, '{ten_khach}');
setClusterPlaceholder(4, '{cong_trinh}');

// Mác rows: 5=M150 name, 6=giá M150, 7=M200, 8=giá, 9=M250, 10=giá, 11=M300, 12=giá
setClusterPlaceholder(5, '{ten}');
setClusterPlaceholder(6, '{gia}');
for (let c = 7; c <= 12; c++) setClusterPlaceholder(c, '');

// Giá bơm
setClusterPlaceholder(13, '{gia_bom_1}');
setClusterPlaceholder(14, '{gia_bom_2}');
setClusterPlaceholder(15, '{gia_bom_3}');
setClusterPlaceholder(16, '{gia_bom_4}');
// cluster 17 (phone + Mr Đạt) — leave untouched

// --- 4. Rebuild XML with modified runs ---
let rebuilt = '';
let pos = 0;
for (const r of runs) {
  rebuilt += xml.substring(pos, r.start) + r.text;
  pos = r.end;
}
rebuilt += xml.substring(pos);
xml = rebuilt;

// --- 5. Wrap the first mác <w:tr> with loop tags and delete the next 3 ---
// The first mác row contains "{ten}" after our edits.
const firstTenIdx = xml.indexOf('{ten}');
if (firstTenIdx === -1) throw new Error('Did not find {ten} placeholder');
const trStart = xml.lastIndexOf('<w:tr ', firstTenIdx);
const trEnd = xml.indexOf('</w:tr>', firstTenIdx) + '</w:tr>'.length;
const firstRow = xml.substring(trStart, trEnd);

// Find the next 3 <w:tr> blocks that contain empty (former red) placeholders for rows 2-4
// They are the 3 table rows immediately after firstRow.
let cursor = trEnd;
const rowsToDelete = [];
for (let k = 0; k < 3; k++) {
  const nextTrStart = xml.indexOf('<w:tr ', cursor);
  if (nextTrStart === -1) break;
  const nextTrEnd = xml.indexOf('</w:tr>', nextTrStart) + '</w:tr>'.length;
  rowsToDelete.push([nextTrStart, nextTrEnd]);
  cursor = nextTrEnd;
}

// Inject loop tags by placing {#mac_list} BEFORE the row and {/mac_list} AFTER
// Using docxtemplater's "multi-line" paragraph loop isn't ideal for table rows.
// The correct approach: place {#mac_list} inside the first cell and {/mac_list}
// inside the last cell of the SAME row. docxtemplater detects these and repeats
// the whole row.
// Simpler approach with docxtemplater v3: put placeholder on its own paragraph
// that is inside the table row — any tag placed in a table row causes that row
// to repeat when configured with a loop. But safer: use the `{#mac_list}...{/mac_list}`
// pair placed in first and last cell of the row.

// We locate the first <w:tc> of firstRow and inject {#mac_list} into its first <w:t>,
// and the last <w:tc> and append {/mac_list} to its last <w:t>.

function injectIntoFirstT(rowXml, prefix) {
  return rowXml.replace(/(<w:t\b[^>]*>)/, `$1${prefix}`);
}
function injectIntoLastT(rowXml, suffix) {
  const lastMatch = [...rowXml.matchAll(/<\/w:t>/g)].pop();
  if (!lastMatch) return rowXml;
  const idx = lastMatch.index;
  return rowXml.substring(0, idx) + suffix + rowXml.substring(idx);
}
// Clear the "Mẫu 150x150mm" note text from the last cell (keep cell structure)
let newFirstRow = firstRow
  .replace(/<w:t\b[^>]*>Mẫu<\/w:t>/g, '<w:t xml:space="preserve"></w:t>')
  .replace(/<w:t\b[^>]*> 150x150mm<\/w:t>/g, '<w:t xml:space="preserve"></w:t>');
newFirstRow = injectIntoFirstT(newFirstRow, '{#mac_list}');
newFirstRow = injectIntoLastT(newFirstRow, '{/mac_list}');

// Rebuild: replace firstRow with newFirstRow AND remove rowsToDelete
// Do deletions from last to first to keep indices valid.
let newXml = xml;
for (let k = rowsToDelete.length - 1; k >= 0; k--) {
  const [s, e] = rowsToDelete[k];
  newXml = newXml.substring(0, s) + newXml.substring(e);
}
// Now replace firstRow with newFirstRow (indices into newXml unchanged because
// deletions happened AFTER trEnd).
newXml = newXml.substring(0, trStart) + newFirstRow + newXml.substring(trEnd);

// --- 6. Strip stale page break markers that can cause phantom page breaks
//       when the doc is opened in non-Word viewers (LibreOffice/Google Docs) ---
newXml = newXml.replace(/<w:lastRenderedPageBreak\s*\/>/g, '');

// --- 6b. Lock every table to fixed layout so cells never reflow on long data.
//         Also force vertical-center + wrap + tcFitText on every cell. ---
newXml = newXml.replace(/<w:tbl>([\s\S]*?)<\/w:tbl>/g, (tblMatch) => {
  let tbl = tblMatch;
  // Force fixed table layout (disable "Autofit to contents")
  if (/<w:tblLayout\b[^\/]*\/>/.test(tbl)) {
    tbl = tbl.replace(/<w:tblLayout\b[^\/]*\/>/, '<w:tblLayout w:type="fixed"/>');
  } else {
    tbl = tbl.replace(/<\/w:tblPr>/, '<w:tblLayout w:type="fixed"/></w:tblPr>');
  }
  // Per-cell: vertical center, remove noWrap (enable wrap), add tcFitText
  tbl = tbl.replace(/<w:tc>([\s\S]*?)<\/w:tc>/g, (tcMatch) => {
    let tc = tcMatch;
    // Ensure tcPr exists
    if (!/<w:tcPr>/.test(tc)) {
      tc = tc.replace(/<w:tc>/, '<w:tc><w:tcPr></w:tcPr>');
    }
    // Remove any noWrap so text can wrap to next line when needed
    tc = tc.replace(/<w:noWrap\s*\/>/g, '');
    // Set/replace vAlign = center
    if (/<w:vAlign\b[^\/]*\/>/.test(tc)) {
      tc = tc.replace(/<w:vAlign\b[^\/]*\/>/, '<w:vAlign w:val="center"/>');
    } else {
      tc = tc.replace(/<\/w:tcPr>/, '<w:vAlign w:val="center"/></w:tcPr>');
    }
    // Add tcFitText so oversized content auto-shrinks horizontally
    if (!/<w:tcFitText\s*\/>/.test(tc)) {
      tc = tc.replace(/<\/w:tcPr>/, '<w:tcFitText/></w:tcPr>');
    }
    return tc;
  });
  return tbl;
});
// Kill excessive left indent on paragraphs inside giá bơm cells only
for (const ph of ['{gia_bom_1}', '{gia_bom_2}', '{gia_bom_3}', '{gia_bom_4}']) {
  const phIdx = newXml.indexOf(ph);
  if (phIdx === -1) continue;
  const tcStart = newXml.lastIndexOf('<w:tc>', phIdx);
  const tcEnd = newXml.indexOf('</w:tc>', phIdx) + '</w:tc>'.length;
  if (tcStart === -1) continue;
  let tc = newXml.substring(tcStart, tcEnd).replace(/<w:ind\b[^\/]*\/>/g, '');
  newXml = newXml.substring(0, tcStart) + tc + newXml.substring(tcEnd);
}

// --- 7. Write back to zip ---
zip.file('word/document.xml', newXml);
const outBuf = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(OUT, outBuf);
console.log(`\nWrote: ${OUT} (${outBuf.length} bytes)`);
