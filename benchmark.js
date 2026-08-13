const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

function extractFunction(code, functionName) {
  const startIdx = code.indexOf(`function ${functionName}`);
  if (startIdx === -1) throw new Error(`Function ${functionName} not found`);

  let openBraces = 0;
  let endIdx = -1;
  let started = false;

  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') {
      openBraces++;
      started = true;
    } else if (code[i] === '}') {
      openBraces--;
    }

    if (started && openBraces === 0) {
      endIdx = i + 1;
      break;
    }
  }

  return code.substring(startIdx, endIdx);
}

let SQRT3;
// We'll see if SQRT3 is defined in the script
try {
  const sqIdx = html.indexOf('const SQRT3');
  if (sqIdx !== -1) {
    SQRT3 = Math.sqrt(3);
  }
} catch (e) {}

const funcCode = extractFunction(html, 'hexXY');
const setupCode = `
  const W = 460;
  const H = 400;
  const R = 34;
  const SQRT3 = Math.sqrt(3);
  ${funcCode}
  return hexXY;
`;
const hexXY = new Function(setupCode)();

const ITERATIONS = 10000000;
const start = performance.now();

for (let i = 0; i < ITERATIONS; i++) {
  hexXY(i % 10, i % 5);
}

const end = performance.now();
console.log(`Execution time for ${ITERATIONS} iterations: ${(end - start).toFixed(2)} ms`);
