const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

async function test() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fileBytes = fs.readFileSync('test.pdf');
    const file = new Blob([fileBytes], { type: 'application/pdf' });
    
    try {
        const uploaded = await ai.files.upload({ file: file, mimeType: 'application/pdf' });
        console.log("Uploaded successfully", uploaded.uri);
        
        const response = await ai.models.generateContent({
            model: 'gemini-3.7-flash',
            contents: {
                parts: [
                    { text: "What is this?" },
                    { fileData: { fileUri: uploaded.uri, mimeType: 'application/pdf' } }
                ]
            }
        });
        console.log("Success:", response.text);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
test();
