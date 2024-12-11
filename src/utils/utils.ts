export function truncateString(str: string, frontLength: number = 6, endLength: number = 4): string {
  if (!str) {
    return ''
  }
  if (str.length <= frontLength + endLength) {
    return str; 
  }
  const front = str.slice(0, frontLength);
  const end = str.slice(-endLength);
  return `${front}...${end}`;
}


export function isNumber(val: any) {
  var regPos = /^\d+(\.\d+)?$/ 
  var regNeg =
    /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/ // float num
  if (regPos.test(val) || regNeg.test(val)) {
    return true
  } else {
    return false
  }
}

/**
 * @param {Number} f
 * @param {Number} digit 
 * @return {Number}
 */
export function decFloat(f: any, digit = 6) {
  if (isNumber(f)) {
    const m = Math.pow(10, digit)
    return parseInt(decMul(f, m, -1), 10) / m
  } else {
    return 0
  }
}
/**
 * 
 * @param {Number} num1 
 * @param {Number} num2 
 * @param {Number} digit 
 * @returns {Number} 
 */
export function decAdd(num1: any, num2: any, digit: any = 6): number {
  if (isNumber(num1) && isNumber(num2)) {
    const num1Digits = (num1.toString().split('.')[1] || '').length
    const num2Digits = (num2.toString().split('.')[1] || '').length
    const baseNum = Math.pow(10, Math.max(num1Digits, num2Digits)) 
    const calcValue = (decMul(num1, baseNum) + decMul(num2, baseNum)) / baseNum
    if (digit === -1) {
      return calcValue
    } else {
      return decFloat(calcValue, digit)
    }
  } else {
    return 0
  }
}

/**
 * @param {Number} num1 
 * @param {Number} num2 
 * @param {Number} digit 
 * @returns {Number} 
 */
export function decSub(num1: any = 0, num2: any = 0, digit: any = 6): number {
  if (isNumber(num1) && isNumber(num2)) {
    const num1Digits = (num1.toString().split('.')[1] || '').length
    const num2Digits = (num2.toString().split('.')[1] || '').length
    const baseNum = Math.pow(10, Math.max(num1Digits, num2Digits))
    const calcValue = (decMul(num1, baseNum) - decMul(num2, baseNum)) / baseNum
    if (digit === -1) {
      return calcValue
    } else {
      return decFloat(calcValue, digit)
    }
  } else {
    return 0
  }
}
/**
 * @param {Number} num1 
 * @param {Number} num2 
 * @param {Number} digit 
 * @returns {Number} 
 */
export function decMul(num1: any = 0, num2: any = 0, digit: any = 6): any {
  if (isNumber(num1) && isNumber(num2)) {
    const num1String = num1.toString()
    const num2String = num2.toString()
    const num1Digits = (num1String.split('.')[1] || '').length
    const num2Digits = (num2String.split('.')[1] || '').length
    const baseNum = Math.pow(10, num1Digits + num2Digits) 

    const calcValue =
      (Number(num1String.replace('.', '')) *
        Number(num2String.replace('.', ''))) /
      baseNum
    if (digit === -1) {
      return calcValue
    } else {
      return decFloat(calcValue, digit)
    }
  } else {
    return 0
  }
}

/**
 * @param {Number} num1 
 * @param {Number} num2 
 * @param {Number} digit 
 * @returns {Number} 
 */
export function decDiv(num1: any = 0, num2: any = 0, digit: any = 6): number {
  if (isNumber(num1) && isNumber(num2)) {
    const num1String = num1.toString()
    const num2String = num2.toString()
    const num1Digits = (num1String.split('.')[1] || '').length
    const num2Digits = (num2String.split('.')[1] || '').length
    const baseNum = Math.pow(10, num1Digits + num2Digits) 
    let n1 = decMul(num1, baseNum)
    let n2 = decMul(num2, baseNum)

    const calcValue = Number(n1) / Number(n2)
    if (digit === -1) {
      return calcValue
    } else {
      return decFloat(calcValue, digit)
    }
  } else {
    return 0
  }
}

import bigDecimal from 'js-big-decimal';

export function bigMul(val: number | string | bigint | undefined | null, val2: number | string | bigint | undefined | null, decimalPlaces: number = 8) {
  if (!isValidNumber(val) || !isValidNumber(val2)) return '0';

  const n1 = new bigDecimal(val);
  const n2 = new bigDecimal(val2);
  const result = n1.multiply(n2);
  return formatResult(result.value, decimalPlaces);
}


export function bigDiv(val: number | string | bigint | undefined | null, val2: number | string | bigint | undefined | null, decimalPlaces: number = 8) {
  if (!isValidNumber(val) || !isValidNumber(val2) || val2 === 0) return '0';

  const n1 = new bigDecimal(val);
  const n2 = new bigDecimal(val2);
  const result = n1.divide(n2);
  return formatResult(result.value, decimalPlaces);
}


function isValidNumber(value: any): value is number | string | bigint {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint';
}

function formatResult(value: string, decimalPlaces: number): string {
  const numValue = parseFloat(value);


  const fixedValue = numValue.toFixed(decimalPlaces);


  if (decimalPlaces === 0) return fixedValue;


  return fixedValue.replace(/(\.\d*?[1-9])0+$/, '$1') 
    .replace(/\.0$/, '') 
    .replace(/\.0+$/, ''); 
}