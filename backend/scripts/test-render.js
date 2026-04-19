// Test render: fill template.docx with sample data, output sample-output.docx.
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const TMPL = path.join(__dirname, '..', 'templates', 'template.docx');
const OUT = path.join(__dirname, '..', 'templates', `sample-output-${Date.now()}.docx`);

const zip = new PizZip(fs.readFileSync(TMPL));
const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

doc.render({
  ngay: '19',
  thang: '04',
  nam: '2026',
  ten_khach: 'CÔNG TY TNHH XÂY DỰNG ABC',
  cong_trinh: 'Nhà phố Quận 7, TP.HCM',
  mac_list: [
    { ten: 'M150R28', gia: '1.530.000' },
    { ten: 'M200R28', gia: '1.580.000' },
    { ten: 'M250R28', gia: '1.630.000' },
    { ten: 'M300R28', gia: '1.680.000' },
  ],
  gia_bom_1: '3.500.000đ',
  gia_bom_2: '120.000đ',
  gia_bom_3: '4.200.000đ',
  gia_bom_4: '130.000đ',
});

fs.writeFileSync(OUT, doc.getZip().generate({ type: 'nodebuffer' }));
console.log('Rendered:', OUT);
