import HTMLtoDOCX from "html-to-docx";

async function run() {
    const buf = await HTMLtoDOCX("<p>Test</p>", null, {});
    console.log("Is Buffer?", Buffer.isBuffer(buf));
    console.log("Type:", buf.constructor.name);
}
run();
