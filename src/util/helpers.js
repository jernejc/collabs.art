
// https://stackoverflow.com/questions/9905533/convert-excel-column-alphabet-e-g-aa-to-number-e-g-25
export function letterToNumberColumn(columnLetter) {
  let base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, columnNumber = 0;

  for (i = 0, j = columnLetter.length - 1; i < columnLetter.length; i += 1, j -= 1) 
    columnNumber += Math.pow(base.length, j) * (base.indexOf(columnLetter[i]) + 1);

  return columnNumber;
};

// https://stackoverflow.com/questions/181596/how-to-convert-a-column-number-e-g-127-into-an-excel-column-e-g-aa
export function numberToLetterColumn(columnNumber){
  let dividend = columnNumber, columnLetter = '',  modulo;

  while (dividend > 0) {
      modulo = (dividend - 1) % 26;
      columnLetter = String.fromCharCode(65 + modulo).toString() + columnLetter;
      dividend = parseInt((dividend - modulo) / 26);
  } 

  return columnLetter;
}

// Normalize beetwen min, max
export function normalize(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}