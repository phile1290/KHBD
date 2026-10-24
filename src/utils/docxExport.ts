import { LessonPlan } from '../types/lesson';

/**
 * Xuất kế hoạch bài dạy thành file Word (.doc) chuẩn định dạng văn bản hành chính Việt Nam
 * Hỗ trợ mở mượt mà trên Microsoft Word, WPS Office, LibreOffice và Google Docs.
 */
export function exportToWordDoc(plan: LessonPlan) {
  // Convert markdown to clean HTML for Word
  const cleanHtmlContent = markdownToWordHtml(plan.content);

  const schoolHeader = plan.schoolName || "TRƯỜNG THCS & THPT NGUYỄN TẤT THÀNH";
  const teacherHeader = plan.teacherName ? `Giáo viên thực hiện: ${plan.teacherName}` : "Giáo viên thực hiện: .............................";

  const fullWordHtml = `
  <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head>
    <meta charset="utf-8">
    <title>${escapeXml(plan.title)}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page {
        size: A4 portrait;
        margin: 20mm 20mm 20mm 25mm; /* Chuẩn văn bản hành chính Việt Nam: Trên 20, Dưới 20, Phải 20, Trái 25 */
        mso-header-margin: 10mm;
        mso-footer-margin: 10mm;
      }
      body {
        font-family: 'Times New Roman', Times, serif;
        font-size: 13.5pt;
        line-height: 1.35;
        color: #000000;
        text-align: justify;
      }
      .admin-header {
        width: 100%;
        margin-bottom: 25px;
      }
      .admin-header td {
        vertical-align: top;
        font-size: 12pt;
      }
      .header-left {
        text-align: center;
        width: 45%;
      }
      .header-right {
        text-align: center;
        width: 55%;
        font-weight: bold;
      }
      .divider-line {
        border-bottom: 1.5px solid #000;
        width: 120px;
        margin: 4px auto 0 auto;
      }
      h1 {
        font-size: 16pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        margin-top: 15px;
        margin-bottom: 5px;
        color: #000;
      }
      h2 {
        font-size: 14pt;
        font-weight: bold;
        text-align: center;
        margin-top: 2px;
        margin-bottom: 15px;
      }
      h3 {
        font-size: 13.5pt;
        font-weight: bold;
        margin-top: 15px;
        margin-bottom: 8px;
        color: #002060;
        text-transform: uppercase;
      }
      h4 {
        font-size: 13.5pt;
        font-weight: bold;
        margin-top: 12px;
        margin-bottom: 6px;
        color: #1f497d;
      }
      p {
        margin: 4px 0;
        text-indent: 1cm;
      }
      .no-indent {
        text-indent: 0;
      }
      table.content-table {
        border-collapse: collapse;
        width: 100%;
        margin: 12px 0;
      }
      table.content-table th, table.content-table td {
        border: 1px solid #000000;
        padding: 6px 8px;
        font-size: 12.5pt;
        text-align: left;
      }
      table.content-table th {
        background-color: #f2f2f2;
        font-weight: bold;
        text-align: center;
      }
      ul, ol {
        margin: 4px 0 4px 25px;
      }
      li {
        margin-bottom: 3px;
      }
      blockquote {
        border-left: 3px solid #1f497d;
        padding-left: 10px;
        margin: 8px 0;
        font-style: italic;
        background-color: #f8f9fa;
      }
      .footer-sign {
        width: 100%;
        margin-top: 35px;
      }
      .footer-sign td {
        text-align: center;
        font-size: 13pt;
        vertical-align: top;
      }
    </style>
  </head>
  <body>
    <!-- Tiêu ngữ hành chính giáo dục Việt Nam -->
    <table class="admin-header" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td class="header-left">
          <strong>${schoolHeader.toUpperCase()}</strong><br>
          TỔ CHUYÊN MÔN<br>
          <div class="divider-line"></div>
        </td>
        <td class="header-right">
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>
          Độc lập - Tự do - Hạnh phúc<br>
          <div class="divider-line"></div>
        </td>
      </tr>
    </table>

    <h1>KẾ HOẠCH BÀI DẠY</h1>
    <h2>MÔN: ${plan.subject.toUpperCase()} - ${plan.grade.toUpperCase()}</h2>
    <p class="no-indent" style="text-align: center; font-style: italic; margin-bottom: 20px;">
      (Kèm theo Công văn số 5512/BGDĐT-GDTrH ngày 18 tháng 12 năm 2020 của Bộ GD&ĐT)
    </p>

    <div style="background-color: #f2f4f8; padding: 8px 12px; border: 1px solid #d0d7de; margin-bottom: 20px;">
      <p class="no-indent"><strong>• Tên bài dạy:</strong> ${plan.title}</p>
      <p class="no-indent"><strong>• Thời lượng thực hiện:</strong> ${plan.duration}</p>
      <p class="no-indent"><strong>• Bộ sách:</strong> ${plan.curriculum}</p>
      <p class="no-indent"><strong>• ${teacherHeader}</strong></p>
    </div>

    <!-- Nội dung chính của giáo án -->
    <div class="plan-body">
      ${cleanHtmlContent}
    </div>

    <!-- Phần ký duyệt của tổ trưởng và giáo viên -->
    <table class="footer-sign" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width: 50%;">
          <strong>DUYỆT CỦA TỔ TRƯỞNG CHUYÊN MÔN</strong><br>
          <em>(Ký và ghi rõ họ tên)</em><br><br><br><br><br>
        </td>
        <td style="width: 50%;">
          <em>Ngày ..... tháng ..... năm 202...</em><br>
          <strong>GIÁO VIÊN SOẠN BÀI</strong><br>
          <em>(Ký và ghi rõ họ tên)</em><br><br><br><br><br>
          <strong>${plan.teacherName || ""}</strong>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  // Download Blob as .doc file
  const blob = new Blob(['\ufeff', fullWordHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedTitle = plan.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_').substring(0, 45);
  a.href = url;
  a.download = `KHBD_${plan.subject}_${plan.grade}_${sanitizedTitle}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất file Markdown (.md)
 */
export function exportToMarkdown(plan: LessonPlan) {
  const blob = new Blob([plan.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedTitle = plan.title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1EA0-\u1EF9]/g, '_').substring(0, 45);
  a.href = url;
  a.download = `KHBD_${plan.subject}_${plan.grade}_${sanitizedTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Simple parser converting Markdown to clean HTML for Word
 */
function markdownToWordHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Process code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_match, p1) => {
    return `<div style="background-color: #f6f8fa; border: 1px solid #e1e4e8; padding: 10px; font-family: 'Courier New', monospace; font-size: 11pt; white-space: pre-wrap; margin: 10px 0;">${escapeXml(p1)}</div>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Convert markdown tables to HTML tables
  html = convertMarkdownTablesToHtml(html);

  // Unordered lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
  // Clean redundant nested uls
  html = html.replace(/<\/ul>\s*<ul>/gim, '');

  // Line breaks to paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<table') || trimmed.startsWith('<div') || trimmed.startsWith('<ul')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return html;
}

function convertMarkdownTablesToHtml(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      tableLines.push(line.trim());
    } else {
      if (inTable) {
        result.push(renderTable(tableLines));
        inTable = false;
        tableLines = [];
      }
      result.push(line);
    }
  }

  if (inTable) {
    result.push(renderTable(tableLines));
  }

  return result.join('\n');
}

function renderTable(tableLines: string[]): string {
  if (tableLines.length < 2) return tableLines.join('\n');

  const headerRow = tableLines[0];
  const bodyRows = tableLines.slice(2); // Skip separator row

  const parseRow = (rowStr: string) => {
    return rowStr
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim());
  };

  const headers = parseRow(headerRow);
  const rows = bodyRows.map(parseRow);

  let html = '<table class="content-table" border="1" cellspacing="0" cellpadding="6">';
  html += '<thead style="display:table-header-group;"><tr>';
  headers.forEach(h => {
    html += `<th>${h}</th>`;
  });
  html += '</tr></thead>';
  html += '<tfoot style="display:table-footer-group;"><tr>';
  html += `<td colspan="${headers.length}" style="border:none; border-top:1.5pt solid black; padding:0; height:1px; line-height:1px; font-size:1pt;">&nbsp;</td>`;
  html += '</tr></tfoot><tbody>';

  rows.forEach(r => {
    html += '<tr>';
    r.forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}
