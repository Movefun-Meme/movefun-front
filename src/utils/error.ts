const  errorParse = (v: any) => {
  const val = v.toString();
  if (val.includes('User rejected the request')) {
    return 'User rejected the request'
  }
  if (val.includes('Account not found')) {
    return 'Account not found'
  }
  if (val.includes('is already initialized as a coin')) {
    return 'CoinType is already initialized as a coin';
  }
  if (val.includes('Not enough coins to complete transaction')) {
    return 'Not enough coins to complete transaction'
  }
  return val
}

export default errorParse;