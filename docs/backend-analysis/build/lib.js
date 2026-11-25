// Shared helpers for generating the Gecko Repair (M&R) backend analysis Word documents.
// Mirrors web.fleet.gecko-api/docs/backend-analysis/build/lib.js so both document sets look the same.
// Build: npm i docx@9 (anywhere on NODE_PATH), then `node 01_business_modules.js` etc.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  ShadingType, AlignmentType, HeadingLevel, LevelFormat, BorderStyle, Header, Footer,
  PageNumber, TableOfContents, PageBreak,
} = require('docx');

const C = {
  primary: '1E40AF', primary2: '2563EB', light: 'EFF6FF', grey: 'F3F4F6', border: 'CBD5E1',
  text: '1F2937', muted: '6B7280', warn: 'FEF3C7', warnBorder: 'D97706', ok: 'ECFDF5', okBorder: '059669',
};
const FONT = 'Arial';
const CONTENT_W = 9026; // A4 width 11906 - 2 x 1440 margins

// Inline markup: **bold**, `code`
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: tok.slice(1, -1), font: 'Consolas', color: '9F1239', ...base, size: base.size ? base.size - 2 : 18 }));
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}

const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const P = (t, opts = {}) => new Paragraph({ children: runs(t, opts.run || {}), spacing: { after: 120 }, ...(opts.para || {}) });
const B = (t, level = 0) => new Paragraph({ numbering: { reference: 'bullets', level }, children: runs(t), spacing: { after: 60 } });
const N = (t, ref = 'numbers') => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60 } });
const bullets = (arr, level = 0) => arr.map((t) => B(t, level));
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function callout(title, lines, kind = 'info') {
  const fill = kind === 'warn' ? C.warn : kind === 'ok' ? C.ok : C.light;
  const bc = kind === 'warn' ? C.warnBorder : kind === 'ok' ? C.okBorder : C.primary2;
  const border = { left: { style: BorderStyle.SINGLE, size: 24, color: bc, space: 8 } };
  const paras = [];
  if (title) paras.push(new Paragraph({ border, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, spacing: { before: 120, after: 40 }, indent: { left: 200, right: 200 }, children: [new TextRun({ text: title, bold: true, color: bc })] }));
  lines.forEach((l, i) => paras.push(new Paragraph({ border, shading: { type: ShadingType.CLEAR, fill, color: 'auto' }, spacing: { after: i === lines.length - 1 ? 160 : 40 }, indent: { left: 200, right: 200 }, children: runs(l) })));
  return paras;
}

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: C.border };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

// table(headers, rows, widthsInPercent)
function table(headers, rows, pct, opts = {}) {
  const n = headers.length;
  const p = pct || Array(n).fill(100 / n);
  const total = p.reduce((a, b) => a + b, 0);
  const widths = p.map((x) => Math.floor((x / total) * CONTENT_W));
  widths[n - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const size = opts.size || 17;
  const mkCell = (text, i, header, zebra) => new TableCell({
    borders,
    width: { size: widths[i], type: WidthType.DXA },
    shading: header ? { fill: C.primary, type: ShadingType.CLEAR, color: 'auto' } : zebra ? { fill: C.grey, type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(text ?? '').split('\n').map((line) => new Paragraph({
      children: header ? [new TextRun({ text: line, bold: true, color: 'FFFFFF', size })] : runs(line, { size }),
    })),
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => mkCell(h, i, true)) }),
      ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => mkCell(c, i, false, ri % 2 === 1)) })),
    ],
  });
}
const spacer = () => new Paragraph({ children: [], spacing: { after: 80 } });
// table followed by spacer
const T = (h, r, p, o) => [table(h, r, p, o), spacer()];

function cover(title, subtitle, docNo) {
  return [
    new Paragraph({ spacing: { before: 2400, after: 0 }, children: [new TextRun({ text: 'GECKO PLATFORM  ·  REPAIR MODULE (M&R)', bold: true, color: C.primary2, size: 22 })] }),
    new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: C.primary, space: 6 } }, spacing: { before: 200, after: 300 }, children: [new TextRun({ text: title, bold: true, size: 52, color: C.primary })] }),
    new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: subtitle, size: 28, color: C.muted })] }),
    ...T(['Item', 'Detail'], [
      ['Document', docNo],
      ['Version', '0.6 — Repair naming (repair.* / REPAIR_* / container_repair_*, module code MNR) and the as-built script set'],
      ['Date', '25 November 2026'],
      ['Pilot tenant', 'SCT (no legacy M&R data; containers, parties, CEDEX codes and TOS gate surveys already on the platform)'],
      ['Target platform', 'Gecko.Platform (.NET 10 modular monolith, EF Core database-first, SQL Server RLS multi-tenancy); Repair runs in its own host, Gecko.Repair.Api, on its own database gecko_repair'],
      ['Module code', '`MNR` (already seeded in gecko_identity: module, plans, `mnr.survey.manage`, `mnr.repair.approve`)'],
      ['Front end', 'web.mnr.gecko-api — GECKO M&R (Next.js 16, React 19, Gecko Design System, 62 routes on seed data)'],
      ['Companion documents', '01 Business Modules · 02 Database Design · 03 Execution Plan · 04 Enterprise Gap Analysis · 05 Global Product & Integration'],
    ], [28, 72]),
    pageBreak(),
    new Paragraph({ children: [new TextRun({ text: 'Contents', bold: true, size: 32, color: C.primary })], spacing: { after: 200 } }),
    new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }),
    pageBreak(),
  ];
}

async function build(file, title, children) {
  const doc = new Document({
    creator: 'Gecko Repair Analysis',
    title,
    styles: {
      default: { document: { run: { font: FONT, size: 20, color: C.text } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 32, bold: true, color: C.primary }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 26, bold: true, color: C.primary2 }, paragraph: { spacing: { before: 280, after: 120 }, keepNext: true, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 22, bold: true, color: C.text }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 2 } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets', levels: [
          { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
          { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } },
        ] },
        { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] },
      ],
    },
    features: { updateFields: true },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Gecko Repair (M&R) — ${title}`, size: 16, color: C.muted })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', size: 16, color: C.muted }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted }), new TextRun({ text: ' of ', size: 16, color: C.muted }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.muted })] })] }) },
      children: children.flat(Infinity),
    }],
  });
  const buf = await Packer.toBuffer(doc);
  const out = path.resolve(__dirname, '..', file);
  fs.writeFileSync(out, buf);
  console.log('wrote', out, buf.length);
}

module.exports = { H1, H2, H3, P, B, N, bullets, T, table, callout, cover, build, pageBreak, spacer };
