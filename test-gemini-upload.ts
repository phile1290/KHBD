import fs from 'fs';
import 'dotenv/config';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const fileData = Buffer.from('Test file content ' + Date.now());
  const mimeType = 'text/plain';
  const displayName = 'test.txt';

  const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST',
      headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': fileData.length.toString(),
          'X-Goog-Upload-Header-Content-Type': mimeType,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file: { display_name: displayName } })
  });
  
  if (!startRes.ok) {
      console.log('Start error:', await startRes.text());
      return;
  }
  
  const uploadUrl = startRes.headers.get('x-goog-upload-url');
  console.log('Upload URL:', uploadUrl);
  
  const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
          'Content-Length': fileData.length.toString(),
          'X-Goog-Upload-Command': 'upload, finalize',
          'X-Goog-Upload-Offset': '0'
      },
      body: fileData
  });

  if (!uploadRes.ok) {
      console.log('Upload error:', await uploadRes.text());
      return;
  }

  const fileInfo = await uploadRes.json();
  console.log('Upload success:', fileInfo);
}

test().catch(console.error);
