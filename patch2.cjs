const fs = require('fs');
let code = fs.readFileSync('utils.ts', 'utf8');

const target = "td, th { padding: 5px; vertical-align: top; border: 1px solid black; }";
const replacement = "td, th { padding: 5px; vertical-align: top; }";

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('utils.ts', code);
    console.log("Patched successfully");
} else {
    console.log("Target not found");
}
