import React, { useState, useEffect, useRef } from 'react';
import { CustomValidator, Form, Input, Select, InputNumber, Button, Textarea, Upload, MessagePlugin, FormProps, FormRules, Data } from 'tdesign-react';
import { history, useLocation } from 'umi';
import ABI from '@/utils/abi.json';
import { AptosSignAndSubmitTransactionInput } from '@aptos-labs/wallet-standard';
import { Aptos, AptosConfig, type TransactionResponse, Network } from "@aptos-labs/ts-sdk";
import { getBytecode, uploadFile } from '@/api/index';
import { pinFileToIPFS } from '@/utils/upload';
import { VITE_IPFS_URL } from "@/config/config";
import { saveDeployToken } from "@/api/index";
import { signAndSubmit } from "@/utils/transaction";
import errorParse from '@/utils/error';
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
const { FormItem } = Form;
const { Option } = Select;

export default function NewIconPage() {
  const [deployForm] = Form.useForm();
  const { account, connected, wallet, network, changeNetwork, connect, signAndSubmitTransaction } = useWallet();
  const [files, setFiles] = useState([]);
  const [buttonLoading, setButtonLoading] = useState(false);
  const uploadRef = useRef(null);
  const [upLoadLoading, setUpLoadLoading] = useState(false);




  const validateName: CustomValidator = (v) => {
    const regex = /^[A-Z]+$/;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(regex.test(v));
      }, 1000);
    });
  };

  const rules: FormRules<Data> = {
    name: [
      { required: true, message: 'name is required', type: 'error' },
      { validator: validateName, message: 'Must be uppercase letters only', type: 'error', trigger: 'blur' },
    ],
    symbol: [
      { required: true, message: 'symbol is required', type: 'error' },
    ],
    description: [{ required: true, message: 'description is required', type: 'error' }],
    uri: [{ required: true, message: 'uri is required', type: 'error' }],
    twitter: [{ required: false, message: 'twitter is required', type: 'error' }],
    telegram: [{ required: false, message: 'telegram is required', type: 'error' }],
    website: [{ required: false, message: 'website is required', type: 'error' }],
  };



  const navigator = (url: string) => {
    history.push(url);
  }

  const uploadImage = async (e: any) => {
    if (e[0].size > 1000000) {
      MessagePlugin.error('image size limit 1 MB', 5000);
      return;
    }
    setUpLoadLoading(true);
    setFiles(e);
    const r: any = await uploadFile(e[0]);
    deployForm.setFieldsValue({ uri: r.data })
    // const r: any = await pinFileToIPFS(e[0]);
    // deployForm.setFieldsValue({ uri: VITE_IPFS_URL + r.data?.IpfsHash })
    setUpLoadLoading(false);

  }

  const publishMethod = async () => {
    try {
      const form = deployForm.getFieldsValue(true);
      const res: any = await getBytecode({ "address": account!.address, "token": form.name })

      const moduleBytes = new Uint8Array(Buffer.from(res.data.module, 'base64'));  
      const metadataBytes = new Uint8Array(Buffer.from(res.data.metadata, 'base64'));  
  
      // const initializePayload: AptosSignAndSubmitTransactionInput = {
      //   payload: {
      //     function: `0x1::code::publish_package_txn`,
      //     functionArguments: [
      //       Array.from(metadataBytes),  // metadata_serialized: vector<u8>
      //       [Array.from(moduleBytes)]   // code: vector<vector<u8>>
      //     ]
      //   }
      // }
      const transaction: InputTransactionData = {
        data: {
          function: "0x1::code::publish_package_txn",
          functionArguments: [
            Array.from(metadataBytes),  // metadata_serialized: vector<u8>
            [Array.from(moduleBytes)]   // code: vector<vector<u8>>
          ]
        }
      }
      const transactionRes = await signAndSubmit(transaction, signAndSubmitTransaction);
      return transactionRes;
    } catch (error) {
      throw error
    }

  }

  const handleNewIcon: FormProps['onSubmit'] = async (e) => {
    if (account == null) {
      throw new Error("Unable to find account to sign transaction")
      return;
    }
    try {
      if (e.validateResult === true) {
        setButtonLoading(true);
        const publishRes = await publishMethod();
        const form = deployForm.getFieldsValue(true);
        // const payload: AptosSignAndSubmitTransactionInput = {
        //   payload: {
        //     function: `${ABI.address}::pump::deploy`,
        //     functionArguments: [form.description, form.name, form.symbol, form.uri, form.website, form.telegram, form.twitter],
        //     typeArguments: [`${wallet.address}::${form.name}::${form.name}`]
        //   },
        // }
        const transaction: InputTransactionData = {
          data: {
            function: `${ABI.address}::pump::deploy`,
            functionArguments: [form.description, form.name, form.symbol, form.uri, form?.website || '', form?.telegram || '', form?.twitter || ''],
            typeArguments: [`${account.address}::${form.name}::${form.name}`]
          }
        }
        const transactionRes: TransactionResponse = await signAndSubmit(transaction, signAndSubmitTransaction);
        // await saveToken(transactionRes);
        navigator('/index');
      }
    } catch (error) {
      MessagePlugin.error(errorParse(error), 3000);
    } finally {
      setButtonLoading(false);
    }

  }


  const saveToken = async (transaction: any) => {
    const form = deployForm.getFieldsValue(true);
    const submitForm: any = {
      // ...form,
      sender: account!.address,
      function: transaction.payload.function,
      typeArguments: transaction.payload.type_arguments[0],
      description: form.description,
      tokenName: form.name,
      symbol: form.symbol,
      icon: form.uri,
      website: form.website,
      telegram: form.telegram,
      twitter: form.twitter,
      txHash: transaction.hash,
    }
    const res: any = await saveDeployToken(submitForm);
    if (res.success) {
      MessagePlugin.success('create new icon success', 3000)
    }
    setButtonLoading(false);

  }

  return (
    <div className='newIcon-page text-primary'>
      <div className='back-nav flex-center'>
        <div className='arrow-icon bg-center' onClick={() => { history.back(); }}></div>
        <span className='font-weight-bold' onClick={() => { history.back(); }}>go back</span>
      </div>
      <div className='form-wrap'>
        <Form
          labelAlign="top"
          layout="vertical"
          preventSubmitDefault
          resetType="empty"
          showErrorMessage
          form={deployForm}
          onSubmit={handleNewIcon}
          rules={rules}
        >
          <FormItem label="name" name="name">
            <Input placeholder="" maxlength={100} />
          </FormItem>
          <FormItem label="symbol" name="symbol">
            <Input placeholder="" maxlength={100} />
          </FormItem>
          <FormItem label="description" name="description">
            <Textarea placeholder="" maxlength={1000} />
          </FormItem>
          <FormItem label="Image" name="uri">
            <Input readonly placeholder="" className='uploadInput' suffixIcon={

              <Upload
                ref={uploadRef}
                files={files}
                onSelectChange={uploadImage}
                autoUpload={false}
                multiple={false}
                accept="image/*"
                theme="custom"
              >
                <Button className='primary-btn' style={{ height: '100%', borderRadius: 0 }} loading={upLoadLoading}>
                  Upload Image
                </Button>
              </Upload>
            } />
          </FormItem>
          <FormItem label="twitter link" name="twitter">
            <Input placeholder="" />
          </FormItem>
          <FormItem label="telegram link" name="telegram">
            <Input placeholder="" />
          </FormItem>
          <FormItem label="website" name="website">
            <Input placeholder="" />
          </FormItem>
          <div className='text-xs text-left mt-xs' style={{ color: 'rgba(86, 83, 65, 1)' }}>Tip：coin data cannot be changed after creation</div>
          {/* <FormItem
            label="USDT Amount"
            name="payAmount"
            style={{ marginBottom: 0 }}
          >
            <InputNumber placeholder="" theme="normal" className='flex-1' />
          </FormItem>
          <div className='text-xs text-right mt-xs' style={{ color: 'rgba(86, 83, 65, 1)' }}>Estimated weUSD to M</div>
          <div className='text-xs text-right mt-xs' style={{ color: 'rgba(86, 83, 65, 1)' }}>0 weUSD</div> */}
          <Button type="submit" className='trade-btn text-primary' loading={buttonLoading}>
            Create coin
          </Button>
          <div className='text-xs text-left mt-xs text-primary tips'>when your coin completes its bonding curve you receive 0.5 MOVE</div>
        </Form>
      </div>
    </div>
  );
}