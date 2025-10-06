// Minimal PDF generator for plain text -> EXPLAIN.pdf
// Usage: node scripts/make_pdf.js docs/EXPLAIN.txt EXPLAIN.pdf

const fs = require('fs');

function escapePdfText(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLines(text, maxWidth = 95) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  words.forEach((w) => {
    if (!w && cur) return;
    if ((cur + (cur ? ' ' : '') + w).length > maxWidth) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  });
  if (cur) lines.push(cur);
  return lines;
}

function paginate(lines, linesPerPage = 50) {
  const pages = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }
  return pages;
}

function buildPdf(pages) {
  const objects = [];
  const add = (s) => objects.push(s);

  // Object numbers
  const catalogNum = 1;
  const pagesNum = 2;
  const firstPageNum = 3;
  const lastPageNum = firstPageNum + pages.length - 1;
  const firstContentNum = lastPageNum + 1;
  const lastContentNum = firstContentNum + pages.length - 1;
  const fontNum = lastContentNum + 1;

  // Build content streams
  const contentObjs = pages.map((lines, idx) => {
    const leading = 14;
    const parts = [];
    parts.push('BT');
    parts.push('/F1 11 Tf');
    parts.push(`${leading} TL`);
    parts.push(`72 760 Td`);
    lines.forEach((ln, i) => {
      const txt = escapePdfText(ln);
      if (i === 0) {
        parts.push(`(${txt}) Tj`);
      } else {
        parts.push('T*');
        parts.push(`(${txt}) Tj`);
      }
    });
    parts.push('ET');
    const stream = parts.join('\n');
    const content = `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`;
    const objNum = firstContentNum + idx;
    return `${objNum} 0 obj\n${content}\nendobj`;
  });

  // Page objects
  const pageObjs = pages.map((_, idx) => {
    const pageNum = firstPageNum + idx;
    const contentNum = firstContentNum + idx;
    return [
      `${pageNum} 0 obj`,
      '<< /Type /Page',
      `   /Parent ${pagesNum} 0 R`,
      '   /MediaBox [0 0 612 792]',
      `   /Contents ${contentNum} 0 R`,
      `   /Resources << /Font << /F1 ${fontNum} 0 R >> >>`,
      '>>',
      'endobj',
    ].join('\n');
  });

  const kids = pages.map((_, i) => `${firstPageNum + i} 0 R`).join(' ');
  const pagesObj = [
    `${pagesNum} 0 obj`,
    '<< /Type /Pages',
    `   /Kids [ ${kids} ]`,
    `   /Count ${pages.length}`,
    '>>',
    'endobj',
  ].join('\n');

  const catalogObj = [`${catalogNum} 0 obj`, `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`, 'endobj'].join('\n');
  const fontObj = [`${fontNum} 0 obj`, '<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica >>', 'endobj'].join('\n');

  const header = '%PDF-1.4';
  const bodyObjs = [catalogObj, pagesObj, ...pageObjs, ...contentObjs, fontObj];

  // Compute xref
  const parts = [header + '\n'];
  const offsets = [0]; // obj 0 free
  let offset = Buffer.byteLength(parts.join(''), 'utf8');
  bodyObjs.forEach((o) => {
    offsets.push(offset);
    parts.push(o + '\n');
    offset += Buffer.byteLength(o + '\n', 'utf8');
  });
  const xrefPos = offset;
  const size = offsets.length;
  const pad = (n) => String(n).padStart(10, '0');
  let xref = 'xref\n';
  xref += `0 ${size}\n`;
  xref += '0000000000 65535 f\n';
  for (let i = 1; i < size; i++) {
    xref += `${pad(offsets[i])} 00000 n\n`;
  }
  const trailer = `trailer\n<< /Size ${size} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  parts.push(xref, trailer);
  return Buffer.from(parts.join(''), 'utf8');
}

function makePdf(inputPath, outputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const substituted = raw.replace('${DATE}', new Date().toISOString().slice(0, 10));
  const rawLines = substituted.split(/\r?\n/);
  const wrapped = rawLines.flatMap((ln) => wrapLines(ln, 95));
  const pages = paginate(wrapped, 50);
  const pdf = buildPdf(pages);
  fs.writeFileSync(outputPath, pdf);
  console.log(`Wrote PDF: ${outputPath}`);
}

const input = process.argv[2] || 'docs/EXPLAIN.txt';
const output = process.argv[3] || 'EXPLAIN.pdf';
makePdf(input, output);

