
export const pythagoreanMap: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9
};

export function reduceNumber(num: number, allowMaster: boolean = true): number {
  if (allowMaster && [11, 22, 33].includes(num)) return num;
  if (num < 10) return num;
  const sum = String(num).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  return reduceNumber(sum, allowMaster);
}

export function calculateLifePath(dob: string): number {
  // dob format: YYYY-MM-DD
  const parts = dob.split('-');
  const yearSum = reduceNumber(parts[0].split('').reduce((a, b) => a + parseInt(b), 0), false);
  const monthSum = reduceNumber(parseInt(parts[1]), false);
  const daySum = reduceNumber(parseInt(parts[2]), false);
  return reduceNumber(yearSum + monthSum + daySum, true);
}

export function calculateNameNumber(name: string, type: 'expression' | 'soul' | 'personality'): number {
  const normalized = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  
  let sum = 0;
  for (const char of normalized) {
    if (pythagoreanMap[char]) {
      const isVowel = vowels.includes(char);
      if (type === 'expression') sum += pythagoreanMap[char];
      else if (type === 'soul' && isVowel) sum += pythagoreanMap[char];
      else if (type === 'personality' && !isVowel && char.match(/[A-Z]/)) sum += pythagoreanMap[char];
    }
  }
  return reduceNumber(sum, true);
}

export function getBirthChart(dob: string) {
  const digits = dob.replace(/-/g, '').split('').map(Number);
  const chart: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) {
    chart[i] = digits.filter(d => d === i).length;
  }
  return chart;
}
