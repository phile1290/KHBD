import fs from 'fs';
import 'dotenv/config';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const fileData = Buffer.alloc(30 * 1024 * 1024, 'a');
  const fileBlob = new Blob([fileData], { type: 'application/pdf' });
  const mimeType = 'application/pdf';
  const displayName = 'test_large.pdf';

  const startRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST',
      headers: {
          'X-Goog-Upload-Protocol': 'resumable',
          'X-Goog-Upload-Command': 'start',
          'X-Goog-Upload-Header-Content-Length': fileBlob.size.toString(),
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
  console.log("Upload URL obtained.");
  
  const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
          'X-Goog-Upload-Command': 'upload, finalize',
          'X-Goog-Upload-Offset': '0'
      },
      body: fileBlob
  });

  if (!uploadRes.ok) {
      console.log('Upload error:', await uploadRes.text());
      return;
  }
  
  const fileInfo = await uploadRes.json();
  console.log('Upload success:', fileInfo.file.name);
}

test().catch(console.error);
