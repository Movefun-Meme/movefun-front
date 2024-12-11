import { AptosSignAndSubmitTransactionInput, AptosSignAndSubmitTransactionOutput, UserResponse } from '@aptos-labs/wallet-standard';
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, InputViewFunctionData, Network } from '@aptos-labs/ts-sdk';
import { CUSTOMFULLNODE } from '@/config/config';
import { MessagePlugin } from 'tdesign-react';
import errorParse from './error';


const config = new AptosConfig({ network: Network.CUSTOM, fullnode: CUSTOMFULLNODE });
const aptos = new Aptos(config);

const signAndSubmit = async (transaction: InputTransactionData, signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<any>) => {
  // console.log('transaction',transaction)
  const response: any = await signAndSubmitTransaction(transaction);
  // console.log('response', response)
  const res = await aptos.waitForTransaction({ transactionHash: response.hash });
  // console.log('res', res)
  return res;


}

const getView = async (payload: InputViewFunctionData) => {

  const res = await aptos.view({
    payload: payload
  });
  return res


}

export {
  signAndSubmit,
  getView
}