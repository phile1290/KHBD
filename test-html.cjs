const HTMLtoDOCX = require('html-to-docx');
const fs = require('fs');

async function run() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>Test</title>
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.3; }
        p, div { margin-top: 0; margin-bottom: 3pt; }
        table { border-collapse: collapse; width: 100%; border: 1px solid black; }
        td, th { padding: 5px; vertical-align: top; border: 1px solid black; }
    </style>
    </head>
    <body>
        <table>
            <thead>
                <tr><th>Teacher</th><th>Student</th></tr>
            </thead>
            <tbody>
                <tr>
                  <td><div style="margin-bottom: 2pt">line 1</div><div style="margin-bottom: 2pt">line 2</div></td>
                  <td>Test</td>
                </tr>
            </tbody>
        </table>
    </body>
    </html>
  `;
  const buffer = await HTMLtoDOCX(html, null, {});
  fs.writeFileSync('test-div.docx', buffer);
}
run();
