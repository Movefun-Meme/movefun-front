
import request from '@/utils/request';



export function getBytecode(params: any) {
  return request('/token/compile', {
    method: 'get',
    params,
  })
}


/**
 * 
 * @param data 
 * @returns 
 */
interface saveForm {
  sender: string
  function: string
  typeArguments: string
  description: string
  tokenName: string
  symbol: string
  icon: string
  website: string
  telegram: string
  twitter: string
  txHash: string
}
export function saveDeployToken(data: saveForm) {
  return request('/token/create', {
    method: 'post',
    data,
  })
}

/** home list
 * @param page
 * @param size
 */
export function getTokenPage(params: any) {
  return request('/token/page', {
    method: 'get',
    params,
  })
}


export function getTokenPrice(cycle: string, tokenId: string | number, params: any) {
  return request(`/price/price/${cycle}/${tokenId}`, {
    method: 'get',
    params,
  })
}


export function getTradeRecord(params: any) {
  return request(`/trade/page`, {
    method: 'get',
    params,
  })
}

export function getTokenInfo(tokenId: any) {
  return request(`/token/id/${tokenId}`, {
    method: 'get',
  })
}

export function uploadFile(file: any) {
  console.log(file)
  const formData = new FormData(); 
  formData.append('file', file);   
  return request(`/file/upload`, {
    method: 'post',
    data: formData, 
  })
}

/** follow 
 * @params 
 * publicKey
 * signature
 */
export function subscribe(tokenId: any, params: any) {
  return request(`/account/subscribe/${tokenId}`, {
    method: 'get',
    params,
  })
}

/** cancel follow */ 
export function unSubscribe(tokenId: any, params: any) {
  return request(`/account/unSubscribe/${tokenId}`, {
    method: 'get',
    params,
  })
}