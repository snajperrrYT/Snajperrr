
const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let lineNum = 1;
let inString = false;
let quoteChar = '';

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (inString) {
            if (char === quoteChar && line[j-1] !== '\\') {
                inString = false;
            }
        } else {
            if (char === '"' || char === "'" || char === '`') {
                inString = true;
                quoteChar = char;
            } else if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount < 0) {
                    console.log(`Unmatched } at line ${i + 1}:${j + 1}`);
                    process.exit(1);
                }
            } else if (char === '(') {
                parenCount++;
            } else if (char === ')') {
                parenCount--;
                if (parenCount < 0) {
                    console.log(`Unmatched ) at line ${i + 1}:${j + 1}`);
                }
            }
        }
    }
}

console.log('Final counts:', { braceCount, parenCount });
