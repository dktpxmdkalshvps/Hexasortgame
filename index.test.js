const fs = require('fs');
const path = require('path');

// Read the index.html file
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');

// A more robust extraction logic using AST parser would be better, but given it's just tests
// we can use string index based matching or match block braces
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

  if (endIdx === -1) throw new Error(`Could not find end of function ${functionName}`);
  return code.substring(startIdx, endIdx);
}

// Extract the hexXY function robustly by matching balanced braces
const funcCode = extractFunction(html, 'hexXY');

// We need W, H, and R values to test
// Taking values from index.html
const W = 460;
const H = 400;
const R = 34;

// Reconstruct the function for testing
// The original function has name `hexXY`.
// We just run its code in a function context and return it.
const setupCode = `
  const W = ${W};
  const H = ${H};
  const R = ${R};
  const SQRT3 = Math.sqrt(3);
  ${funcCode}
  return hexXY;
`;
const hexXY = new Function(setupCode)();

const funcCodeHexNeighbors = extractFunction(html, 'hexNeighbors');
const hexNeighbors = new Function(`
  ${funcCodeHexNeighbors}
  return hexNeighbors;
`)();

describe('hexXY conversion tests', () => {
  test('returns correct coordinates for origin (0, 0)', () => {
    const res = hexXY(0, 0);
    const expectedX = W/2 - R * Math.sqrt(3) * 2;
    const expectedY = H/2 - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('returns correct coordinates for positive q (1, 0)', () => {
    const res = hexXY(1, 0);
    const expectedX = W/2 + R * Math.sqrt(3) * (1) - R * Math.sqrt(3) * 2;
    const expectedY = H/2 - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('returns correct coordinates for positive r (0, 1)', () => {
    const res = hexXY(0, 1);
    const expectedX = W/2 + R * Math.sqrt(3) * (0.5) - R * Math.sqrt(3) * 2;
    const expectedY = H/2 + R * 1.5 - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('returns correct coordinates for negative coordinates (-1, -1)', () => {
    const res = hexXY(-1, -1);
    const expectedX = W/2 + R * Math.sqrt(3) * (-1 - 0.5) - R * Math.sqrt(3) * 2;
    const expectedY = H/2 + R * 1.5 * (-1) - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('returns correct coordinates for arbitrary off-center (2, -2)', () => {
    const res = hexXY(2, -2);
    const expectedX = W/2 + R * Math.sqrt(3) * (2 - 1) - R * Math.sqrt(3) * 2;
    const expectedY = H/2 + R * 1.5 * (-2) - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('returns correct coordinates for fractional inputs (1.5, -0.5)', () => {
    const res = hexXY(1.5, -0.5);
    const expectedX = W/2 + R * Math.sqrt(3) * (1.5 - 0.25) - R * Math.sqrt(3) * 2;
    const expectedY = H/2 + R * 1.5 * (-0.5) - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('handles extreme large values correctly', () => {
    const q = 1e6;
    const r = -1e6;
    const res = hexXY(q, r);
    const expectedX = W/2 + R * Math.sqrt(3) * (q + r * 0.5) - R * Math.sqrt(3) * 2;
    const expectedY = H/2 + R * 1.5 * r - 10;

    expect(res.x).toBeCloseTo(expectedX, 5);
    expect(res.y).toBeCloseTo(expectedY, 5);
  });

  test('returns NaN when arguments are missing', () => {
    const res = hexXY();
    expect(Number.isNaN(res.x)).toBe(true);
    expect(Number.isNaN(res.y)).toBe(true);
  });

  test('returns NaN when invalid data types (strings) are passed', () => {
    const res = hexXY('foo', 'bar');
    expect(Number.isNaN(res.x)).toBe(true);
    expect(Number.isNaN(res.y)).toBe(true);
  });
});

describe('hexNeighbors calculation tests', () => {
  test('returns 6 correct neighbors for origin (0, 0)', () => {
    const res = hexNeighbors(0, 0);
    const expected = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];

    expect(res.length).toBe(6);
    expect(res).toEqual(expect.arrayContaining(expected));
  });

  test('returns 6 correct neighbors for positive coordinates (2, 3)', () => {
    const res = hexNeighbors(2, 3);
    const expected = [
      [2+1, 3+0],
      [2-1, 3+0],
      [2+0, 3+1],
      [2+0, 3-1],
      [2+1, 3-1],
      [2-1, 3+1]
    ];

    expect(res.length).toBe(6);
    expect(res).toEqual(expect.arrayContaining(expected));
  });

  test('returns 6 correct neighbors for negative coordinates (-1, -2)', () => {
    const res = hexNeighbors(-1, -2);
    const expected = [
      [-1+1, -2+0],
      [-1-1, -2+0],
      [-1+0, -2+1],
      [-1+0, -2-1],
      [-1+1, -2-1],
      [-1-1, -2+1]
    ];

    expect(res.length).toBe(6);
    expect(res).toEqual(expect.arrayContaining(expected));
  });
});

const funcCodeShuffle = extractFunction(html, 'shuffle');
const shuffle = new Function(`
  ${funcCodeShuffle}
  return shuffle;
`)();

describe('shuffle function tests', () => {
  test('returns the same array instance', () => {
    const arr = [1, 2, 3];
    const res = shuffle(arr);
    expect(res).toBe(arr);
  });

  test('preserves array length', () => {
    const arr = [1, 2, 3, 4, 5];
    shuffle(arr);
    expect(arr.length).toBe(5);
  });

  test('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffle(arr);

    // Sort both to compare content regardless of order
    const sortedOriginal = [...original].sort();
    const sortedShuffled = [...arr].sort();

    expect(sortedShuffled).toEqual(sortedOriginal);
  });

  test('handles empty arrays', () => {
    const arr = [];
    shuffle(arr);
    expect(arr).toEqual([]);
  });

  test('handles single-element arrays', () => {
    const arr = [42];
    shuffle(arr);
    expect(arr).toEqual([42]);
  });

  test('actually shuffles the elements (mocking Math.random)', () => {
    // Mock Math.random to return predictability
    const originalRandom = Math.random;

    // If Math.random() always returns 0, the j index will always be 0.
    // For [1, 2, 3]:
    // i=2, j=0: swap a[2] and a[0] -> [3, 2, 1]
    // i=1, j=0: swap a[1] and a[0] -> [2, 3, 1]
    Math.random = jest.fn(() => 0);

    const arr = [1, 2, 3];
    shuffle(arr);
    expect(arr).toEqual([2, 3, 1]);

    Math.random = originalRandom;
  });
});
