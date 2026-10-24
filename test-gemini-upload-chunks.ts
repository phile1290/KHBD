import fs from 'fs';
import 'dotenv/config';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No API key");

  // Create a 15MB file to force chunking
  const fileData = Buffer.alloc(15 * 1024 * 1024, 'a');
  const fileBlob = new Blob([fileData], { type: 'text/plain' });
  const mimeType = 'text/plain';
  const displayName = 'test_large.txt';

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
  
  const chunkSize = 8 * 1024 * 1024;
  let offset = 0;
  
  while (offset < fileBlob.size) {
      const chunk = fileBlob.slice(offset, offset + chunkSize);
      const isFinal = offset + chunk.size >= fileBlob.size;
      
      const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
              'X-Goog-Upload-Command': isFinal ? 'upload, finalize' : 'upload',
              'X-Goog-Upload-Offset': offset.toString()
          },
          body: chunk
      });

      if (!uploadRes.ok) {
          console.log(`Upload error at offset ${offset}:`, await uploadRes.text());
          return;
      }
      
      if (isFinal) {
          const fileInfo = await uploadRes.json();
          console.log('Upload success:', fileInfo);
      }
      offset += chunk.size;
  }
}

test().catch(console.error);
