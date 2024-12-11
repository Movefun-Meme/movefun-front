import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Radio, Checkbox, Space, Tag, Link, Row, Col, Form, Input, Select, InputNumber, Button, Textarea, MessagePlugin, Dialog, Upload, Switch, Loading, Image, Progress } from 'tdesign-react';
import { history, useLocation } from 'umi';
import { Area } from '@ant-design/plots';
// import { AptosWalletContextState, useAptosProvider, useAptosWallet, type AptosProvider } from '@razorlabs/wallet-kit';
import {
  Account,
  Aptos,
  AptosConfig,
  InputViewFunctionData,
  Network,
} from "@aptos-labs/ts-sdk";
import { AptosSignAndSubmitTransactionInput } from '@aptos-labs/wallet-standard';
import ABI from '@/utils/abi.json';
import type { Data, FormProps, FormRules, PageInfo } from 'tdesign-react';
import { getView, signAndSubmit } from "@/utils/transaction";
// import { endpoint } from '@/config/config';
import errorParse from '@/utils/error';
import { decAdd, decSub, decMul, decDiv, truncateString, bigDiv, bigMul } from "@/utils/utils";
import { InputTransactionData, useWallet } from "@aptos-labs/wallet-adapter-react";
import { getTokenPrice, getTradeRecord, getTokenInfo } from '@/api';
import moment from 'moment';
import { CUSTOMFULLNODE } from '@/config/config';
import { getTokenPage } from "@/api/index";
import _ from 'lodash';
import copy from "copy-to-clipboard";

const { FormItem } = Form;
const config = new AptosConfig({ network: Network.CUSTOM, fullnode: CUSTOMFULLNODE });
const aptos = new Aptos(config);

export default function TokenPage() {
  const [amountType, setAmountType] = useState(true);
  const [actionType, setActionType] = useState<any>(0); // 0 buy 1 sell
  const [orderForm, commentForm] = Form.useForm();;
  const [buttonLoading, setButtonLoading] = useState(false);
  // const wallet: AptosWalletContextState = useAptosWallet();
  // const provider: AptosProvider = useAptosProvider();
  const location = useLocation();
  const [tokenData, setTokenData] = useState<any>({});
  const [commentModalVisible, setCommentModalVisible] = useState(false)
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [files, setFiles] = useState([]);
  const uploadRef = useRef(null);
  const { account, connected, wallet, network, changeNetwork, connect, signAndSubmitTransaction } = useWallet();
  const [queryParams, setQueryParams] = useState<any>({});
  const [tableData, setTableData] = useState<Array<Object>>([]);
  const [total, setTotal] = useState(0);
  const [tokenMove, setTokenMove] = useState<any>(0);
  const amount = Form.useWatch('amount', orderForm);
  const [chartConfig, setChartConfig] = useState({});
  const [chartQuery, setChartQuery] = useState({
    cycle: '1min',
    from: moment().subtract(1, 'days').valueOf(),
    to: moment().valueOf()
  });
  const [showAmount, setShowAmount] = useState<number | string>(0); 
  const [checkLoading, setCheckLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);
  const [slippage, setSlippage] = useState(90);
  const [slippageModalVisible, setSlippageModalVisible] = useState(false)
  const [stage, setStage] = useState(1); // 4个阶段
  const [lastBuyer, setLastBuyer] = useState<any>({});

  useEffect(() => {
    console.log('account', account)
  }, [account])


  const rules: FormRules<Data> = {
    amount: [
      { required: true, message: 'amount is required', type: 'error' },
    ]
  };

  const getTokenData = (id: string) => {
    getTokenInfo(id).then(res => {
      const valueStr = decSub(bigDiv(res.data.virtualMoveReserves, 10 ** 8), 30);
      let percent
      if (valueStr >= 3) {
        percent = 100;
      } else if (valueStr === 0) {
        percent = 0;
      } else {
        percent = decMul(decDiv(valueStr, 3), 100);
      }


      const data = {
        ...res.data,
        percent: res.data.virtualMoveReserves ? percent : 0
      };
      setTokenData(data)
    })
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id') as string;
    getTokenData(id)
    setQueryParams({ page: 1, size: 5, tokenId: id, })
  }, [])

  const getStage = async () => {
    const poolPayload: InputViewFunctionData = {
      function: `${ABI.address}::pump::get_pool_state`,
      functionArguments: [],
      typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
    }
    const poolres: any = await getView(poolPayload)
    if (poolres[2]) {
      setStage(4)
    } else {
      const payload: InputViewFunctionData = {
        function: `${ABI.address}::pump::get_pump_stage`,
        functionArguments: [],
        typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
      }
      const res: any = await getView(payload)
      setStage(res[0])
    }
  }

  useEffect(() => {
    if (tokenData.id) {
      getStage()
    }
  }, [tokenData])

  const [timeLeft, setTimeLeft] = useState(0);
  const getLastBuyer = async () => {
    const payload: InputViewFunctionData = {
      function: `${ABI.address}::pump::get_last_buyer`,
      functionArguments: [],
      typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
    }
    const res: any = await getView(payload)
    const _obj = {
      address: res[0], // lastbuyer address
      timestamp: res[1], // buy time
      amount: bigDiv(res[2], 10 ** 8), 
    }
    setLastBuyer(_obj)
    console.log('res', res)
    if (stage == 2) {
      const targetTime = _obj.timestamp; 
      const interval = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);  
        const diff = targetTime - currentTime;

        if (diff <= 0) {
          setTimeLeft(0);
          clearInterval(interval);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }

  useEffect(() => {
    if (stage != 1) {
      getLastBuyer()
    }
  }, [stage])

  /** buy sell */
  const handleTrade: FormProps['onSubmit'] = async (e) => {
    if (e.validateResult === true) {
      try {
        setButtonLoading(true);
        if (actionType == 0) {
          const transaction: InputTransactionData = {
            data: {
              function: `${ABI.address}::pump::buy_with_slippage`,
              functionArguments: [bigMul(amountType ? showAmount : e.fields.amount, 10 ** 8, 0), bigMul(slippage, 100, 0)], // TOKEN 精度是8
              typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
            }
          }
          const res = await signAndSubmit(transaction, signAndSubmitTransaction);
          MessagePlugin.success('buy token success', 3000)
          setButtonLoading(false);
          setShowAmount(0);
          orderForm.reset();
          setQueryParams((prev: any) => {
            const newParams = { ...prev, page: 1 };
            // 直接调用 getPriceData
            getPriceData();
            getStage();
            const searchParams = new URLSearchParams(location.search);
            const id = searchParams.get('id') as string;
            getTokenData(id)
            return newParams;
          });

        }
        if (actionType == 1) {
          const transaction: InputTransactionData = {
            data: {
              function: `${ABI.address}::pump::sell_with_slippage`,
              functionArguments: [bigMul(amountType ? showAmount : e.fields.amount, 10 ** 8,), bigMul(slippage, 100, 0)], // TOKEN 精度是8
              typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
            }
          }
          const res = await signAndSubmit(transaction, signAndSubmitTransaction);
          MessagePlugin.success('sell token success', 3000)
          setButtonLoading(false);
          setShowAmount(0);
          orderForm.reset();
          setQueryParams((prev: any) => {
            const newParams = { ...prev, page: 1 };
            // 直接调用 getPriceData
            getPriceData();
            getStage();
            const searchParams = new URLSearchParams(location.search);
            const id = searchParams.get('id') as string;
            getTokenData(id)
            return newParams;
          });
        }
      } catch (error: any) {
        setButtonLoading(false);
        MessagePlugin.error(errorParse(error), 3000);
      }
    }

  }


  const unfreeze = async () => {
    try {
      setButtonLoading(true);
      const transaction: InputTransactionData = {
        data: {
          function: `${ABI.address}::pump::unfreeze_token`,
          functionArguments: [],
          typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
        }
      }
      const res = await signAndSubmit(transaction, signAndSubmitTransaction);
      MessagePlugin.success('unfreeze success', 3000)
    } catch (error) {
      MessagePlugin.error(errorParse(error), 3000);
    } finally {
      setButtonLoading(false);
    }

  }


  const handleMigration = async () => {
    try {
      setButtonLoading(true);
      const transaction: InputTransactionData = {
        data: {
          function: `${ABI.address}::pump::claim_migration_right`,
          functionArguments: [],
          typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
        }
      }
      const res = await signAndSubmit(transaction, signAndSubmitTransaction);
      MessagePlugin.success('migration success', 3000)
    } catch (error) {
      MessagePlugin.error(errorParse(error), 3000);
    } finally {
      setButtonLoading(false);
    }
  }

  const navigator = (url: string) => {
    // history.push('/dashboard');
    history.push(url);
  }

  const tolink = (url: string) => {
    window.open(url)
  }

  const uploadImage = () => { }

  const RenderDate = (timestamp: any) => {
    const now = moment(); 
    const time = moment(timestamp);
    const duration = moment.duration(now.diff(time));

    let timeAgo = 'just now';

    if (duration.asDays() >= 1) {
      timeAgo = `${Math.floor(duration.asDays())} day${Math.floor(duration.asDays()) > 1 ? 's' : ''} ago`;
    } else if (duration.asHours() >= 1) {
      timeAgo = `${Math.floor(duration.asHours())} hour${Math.floor(duration.asHours()) > 1 ? 's' : ''} ago`;
    } else if (duration.asMinutes() >= 1) {
      timeAgo = `${Math.floor(duration.asMinutes())} minute${Math.floor(duration.asMinutes()) > 1 ? 's' : ''} ago`;
    }

    return <div>{timeAgo}</div>;
  }

  const handleChangeRadio = (v: any) => {
    console.log(v)
    const params = {
      cycle: v == '1' ? '1min' : v == '3' ? '5min' : v == '7' ? '10min' : '1hour',
      from: v != 'all' ? moment().subtract(v, 'days').valueOf() : tokenData.createTime,
      to: moment().valueOf()
    }
    setChartQuery(params)
  }
  const getPriceData = () => {
    setChartLoading(true);
    getTokenPrice(chartQuery.cycle, tokenData.id, { from: chartQuery.from, to: chartQuery.to }).then((res: any) => {
      const data = res.data.map((item: any) => {
        return {
          ...item,
          price: Number(item.price),
          priceTime: moment(item.priceTime).format('MM-DD HH:mm')
        }
      })
      // console.log('ddddddddddd?', data)
      // setPriceData(data)
      const config = {
        data: data,
        xField: 'priceTime',
        yField: 'price',
        style: {
          fill: 'linear-gradient(-90deg, #FFF9D7 0%, #EDD146 100%)',
        },
        axis: {
          y: {
            labelFill: '#fff',
            labelFormatter: (datum, index, data, Vector) => {
              // console.log('datum', datum)
              // console.log('index', index)
              // console.log('data', data)
              // console.log('Vector', Vector)
              return getFullNum(datum);
            }
          },
          x: {
            labelFill: '#fff',
            labelAutoEllipsis: true,
            labelAutoRotate: false,
            labelAutoWrap: true,
            labelFilter: (d: any, i: any,) => (
              // i != (priceData.length - 1)
              true
            )
          }
        },
        tooltip: { channel: 'y', valueFormatter: (d) => getFullNum(d) }
      }
      setChartConfig(config)
      setChartLoading(false);
    })
  }

  function getFullNum(num: any) {
    //处理非数字
    if (isNaN(num)) { return num };
    //处理不需要转换的数字
    var str = '' + num;
    if (!/e/i.test(str)) { return num; };
    return (num).toFixed(18).replace(/\.?0+$/, "");
  }

  useEffect(() => {
    if (tokenData.id) {
      getPriceData();
    }
  }, [tokenData, chartQuery])

  const getRecord = () => {
    getTradeRecord(queryParams).then((res: any) => {
      setTableData(res.data.content)
      setTotal(res.data.totalElements)
    })
  }

  useEffect(() => {
    if (queryParams.tokenId) {
      getRecord()
    }
  }, [queryParams])

  const handleChangePage = (pageInfo: PageInfo, newDataSource: Array<any>) => {
    setQueryParams((prev: any) => ({
      ...prev,
      page: pageInfo.current,
      size: 5,
    }));
  }

  const filterMove = (v: boolean) => {
    console.log(v)
    if (v) {
      setQueryParams((prev: any) => ({
        ...prev,
        page: 1,
        min: 0.05 * 10 ** 8,
      }));
    } else {
      setQueryParams((prev: any) => ({
        ...prev,
        page: 1,
        min: 0,
      }));
    }
  }

  const filterAddress = (v: boolean) => {
    if (v) {
      setQueryParams((prev: any) => ({
        ...prev,
        page: 1,
        address: account?.address
      }));
    } else {
      setQueryParams((prev: any) => ({
        ...prev,
        page: 1,
        min: 0,
        address: undefined
      }));
    }
  }

  const switchAmountType = () => {
    setAmountType((pre: boolean) => (!pre))
    setShowAmount(0);
    orderForm.reset();
  }

  const handleChangeAmount = async (v: string | number) => {
    setCheckLoading(true)
    const payload: InputViewFunctionData = {
      function: `${ABI.address}::pump::${amountType ? 'buy_move_amount' : 'buy_token_amount'}`,
      functionArguments: [decMul(v, 10 ** 8)],
      typeArguments: [`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`]
    }
    const res: any = await getView(payload)
    console.log('r', res)
    const tokenAmount = bigDiv(res[0], 10 ** 8)
    setShowAmount(tokenAmount)
    setCheckLoading(false)
  }


  const debouncedHandleChangeAmount = useCallback(
    _.debounce(handleChangeAmount, 500), // 300ms 延迟
    [tokenData, setShowAmount, setCheckLoading, amountType]
  );

  const handleChangeSlippage = (v: any) => {
    // console.log(v)
    // console.log(slippage)
    setSlippage(v)
  }

  const handleCopy = () => {
    copy(`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`);
    MessagePlugin.success('copy success', 3000)
  };

  return (
    <div className='token-page text-primary'>
      <div className='toekn-page-header flex-center justify-content-between'>
        <div className='back-nav flex-center justify-content-start'>
          <div className='arrow-icon bg-center' onClick={() => { history.back(); }}></div>
          <span className='font-weight-bold' onClick={() => { history.back(); }}>go back</span>
        </div>
        <div className='radio-wrap flex-center'>
          <Radio.Group variant="primary-filled" defaultValue="1" className="radio-tab" onChange={handleChangeRadio} disabled={chartLoading}>
            <Radio.Button value="1" className="radio-tab-item">24H</Radio.Button>
            <Radio.Button value="3" className="radio-tab-item">3D</Radio.Button>
            <Radio.Button value="7" className="radio-tab-item">1W</Radio.Button>
            <Radio.Button value="all" className="radio-tab-item">ALL</Radio.Button>
          </Radio.Group>
          <div className='reload-icon ml-sm' onClick={getPriceData} ></div>
        </div>
      </div>
      <div className='page-body text-primary d-flex'>

        <div className='token-info-wrap'>
          <div className='line-chart-wrap'>
            {/* <DemoArea /> */}
            {
              chartLoading ?
                <>
                  <div className='flex-center flex-column justify-content-center' style={{ height: '100%' }}>
                    <Loading
                      indicator
                      loading
                      preventScrollThrough
                      showOverlay
                    />
                  </div>
                </>
                :
                <>
                  <Area {...chartConfig} autoFit={true} />
                </>
            }
          </div>
          <div className='trade-record mb-xs'>
            <div className='filter-wrap d-flex text-sm '>
              <span>Filter by following</span>
              <div className='switch'><Switch className="filter-switch" onChange={filterAddress} disabled={!connected} /></div>
              <span>connect your wallet</span>
            </div>
          </div>
          <div className='trade-record'>
            <div className='filter-wrap d-flex text-sm'>
              <span>Filter by size</span>
              <div className='switch'><Switch className="filter-switch" onChange={filterMove} /></div>
              <div className='icon-box text-white flex-center mr-xs'><div className='move-icon bg-center mr-xs'></div>0.05</div>
              <span>(12 trades of size greater than 0.05 Move)</span>
            </div>
          </div>

          <div className='table-wrap mt-md'>
            <Table
              bordered
              data={tableData}
              rowClassName={'table-row'}
              maxHeight={'359px'}
              columns={[
                {
                  colKey: 'user',
                  title: 'account',
                  cell: ({ row }: any) => (
                    <div>{truncateString(row.user)}</div>
                  )
                },
                {
                  colKey: 'isBuy',
                  title: 'type',
                  cell: ({ row }: any) => (
                    <div style={row.isBuy ? { color: '#B5E961' } : { color: '#FB7444' }} >{row.isBuy ? 'BUY' : 'SELL'}</div>
                  )
                },
                {
                  colKey: 'aptAmount',
                  title: 'MOVE',
                  cell: ({ row }: any) => (
                    <div>{bigDiv(row.aptAmount, 10 ** 8)}</div>
                  ),
                },
                {
                  colKey: 'tokenAmount',
                  title: () => (
                    <div>{tokenData.symbol}</div>
                  ),
                  cell: ({ row }: any) => (
                    <div>{bigDiv(row.tokenAmount, 10 ** 8)}</div>
                  ),
                },
                {
                  colKey: 'date',
                  title: 'date',
                  cell: ({ row }: any) => {
                    return RenderDate(row.createTime)
                  }
                },
                {
                  colKey: 'version',
                  title: 'version',
                  cell: ({ row }: any) => (
                    <div>{row.version}</div>
                  )
                },
              ]}
              rowKey="index"
              pagination={{
                defaultPageSize: 5,
                total: total,
                showPageSize: false
              }}
              onPageChange={handleChangePage}
            />
          </div>
        </div>

        <div>
          {/* (
              <div className='trade-dex-wrap'>
                <div className='header text-xs'>
                  Bonding Curve Progress: 100.00%
                </div>
                <div className='progress'>
                </div>
                <div className='text bg-center'></div>
                <div className='box flex-center'>
                  <div className='bg-center mr-xs'></div>
                  <div className='flex-1'>
                    Crowned king of the sea on 2024/10/26 morning 06:47:21
                  </div>
                </div>
                <div className='flex-center justify-content-between'>
                  <Button className='primary-btn text-primary' onClick={() => { unfreeze() }} style={{ background: '#DBD3A7' }} loading={buttonLoading}>
                    Unfreeze
                  </Button>
                  <Button className='primary-btn text-primary' onClick={() => { tolink('https://porto.razordex.xyz/') }}>
                    Trade on dex
                  </Button>
                </div>
              </div>
            )  */}
          {
            (stage == 1 || stage == 2) && (
              <div className='action-order-wrap'>
                <div className='action-type flex-center'>
                  <Button className={`type-btn flex-1 buy ${actionType == 0 ? 'active' : ''}`} onClick={() => { setActionType(0); orderForm.reset(); setShowAmount(0) }}>
                    Buy
                  </Button>
                  <Button disabled={stage == 2} className={`type-btn flex-1 sell ${actionType == 1 ? 'active' : ''}`} onClick={() => { setActionType(1); orderForm.reset(); setShowAmount(0); setAmountType(false) }}>
                    Sell
                  </Button>
                </div>
                <div className='form-wrap'>
                  <Form
                    labelAlign="top"
                    layout="vertical"
                    preventSubmitDefault
                    resetType="empty"
                    showErrorMessage
                    form={orderForm}
                    onSubmit={handleTrade}
                    rules={rules}
                  >
                    <div className='d-flex justify-content-between header-tag'>
                      <div className='tag-btn text-xs text-truncate flex-1 mr-xs text-center' onClick={switchAmountType} >switch to Move&{tokenData.symbol}</div>
                      <div className='tag-btn text-xs text-truncate flex-1 ml-xs text-center' onClick={() => { setSlippageModalVisible(true) }} >Set max slippage</div>
                    </div>
                    <FormItem label="" name="amount">
                      <InputNumber onChange={(e) => debouncedHandleChangeAmount(e)} placeholder="" theme="normal" className='flex-1 position-relative' suffix={
                        <div className='flex-center'>
                          <div className='text-sm' style={{ color: '#FFF9D7' }}>{amountType ? 'MOVE' : tokenData.symbol}</div>
                          <div className='move-icon bg-center ml-md rounded-circle' style={!amountType ? { backgroundImage: `url(${tokenData.icon})` } : {}}></div>
                        </div>
                      } />
                    </FormItem>
                    <div className='d-flex bottom-tag'>
                      <div className='tag-btn text-xs mr-xs' onClick={() => { orderForm.reset() }}>reset</div>
                      {
                        amountType ?
                          (
                            <>
                              <div className='tag-btn text-xs mr-xs' onClick={() => { orderForm.setFieldsValue({ amount: 0.1 }); debouncedHandleChangeAmount('0.1') }}>0.1 MOVE</div>
                              <div className='tag-btn text-xs mr-xs' onClick={() => { orderForm.setFieldsValue({ amount: 0.5 }); debouncedHandleChangeAmount('0.5') }}>0.5 MOVE</div>
                              <div className='tag-btn text-xs mr-xs' onClick={() => { orderForm.setFieldsValue({ amount: 1 }); debouncedHandleChangeAmount('1') }}>1 MOVE</div>
                            </>
                          ) : (<></>)
                      }
                    </div>
                    <div className='d-flex justify-content-between text-primary'>
                      <span>You will {
                        (!actionType && !amountType) || (actionType && amountType) ? 'spend' : 'receive'
                      }:</span>
                      <div className='flex-center'>
                        {
                          checkLoading ? (
                            <Loading
                              indicator
                              loading
                              size='small'
                            />
                          ) : (
                            <span>
                              {showAmount}
                            </span>
                          )
                        }
                        <span>
                          {amountType ? ' ' + tokenData.symbol : ' MOVE'}
                        </span>
                      </div>
                    </div>
                    {/* actionType: 0
                amountType: true receive token
                amountType: false spend move
  
                actionType: 1
                amountType: true spend token
                amountType:false receive move */}



                    <Button type="submit" className='trade-btn text-primary' loading={buttonLoading || checkLoading} >
                      place trade
                    </Button>
                    {/* <div className='d-flex check-box'>
                  <Checkbox onClick={() => { console.log(queryParams) }}>
                    add commment
                  </Checkbox>
                </div> */}
                  </Form>
                </div>

              </div>
            )
          }
          <div className='flex-center link-cell'>
            {
              tokenData.twitter && (
                <div className='flex-1 text-md text-center'>
                  <span onClick={() => { tolink(tokenData.twitter) }}>[twitter]</span>
                </div>
              )
            }
            {
              tokenData.telegram && (
                <div className='flex-1 text-md text-center'>
                  <span onClick={() => { tolink(tokenData.telegram) }}>[telegram]</span>
                </div>
              )
            }
            {
              tokenData.website && (
                <div className='flex-1 text-md text-center'>
                  <span onClick={() => { tolink(tokenData.website) }}>[website]</span>
                </div>
              )
            }
          </div>
          <div className='base-info-card'>
            <div className='flex-center address-wrap text-xs justify-content-start mb-md' style={{ color: '#FFF9D7' }}>
              {truncateString(`${tokenData.sender + '::' + tokenData.tokenName + '::' + tokenData.tokenName}`, 6, 24)}
              <div className='copy-icon bg-center ml-sm' onClick={handleCopy}></div>
            </div>
            <div className='d-flex info-card-header'>
              <Image
                src={tokenData.icon}
                // fit='scale-down'
                className='token-image'
              />
              <div className='flex-1 ml-sm'>
                <div className='token-info flex-1'>
                  <div className='text-primary text-sm header'>
                    <span className='mr-sm'>Created by</span>
                    <span className='mr-sm'>{truncateString(tokenData.sender)}</span>
                  </div>
                  <div className='mr-sm d-flex text-sm'>
                    {tokenData.tokenName}
                    {/* <div className={`subscribe-icon ml-md bg-center ${tokenData.isSubscribe ? 'active' : ''}`} onClick={(e) => { }}></div> */}
                  </div>
                  <div className='body text-sm text-primary-light'>
                    <span className='mr-xs'>market cap:</span>
                    <span>{bigMul(tokenData.latestPrice, 10 ** 8)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className='percent-text-box d-flex'>
              <div className='box'>
                Bonding Curve Progress: {tokenData.percent}%
              </div>
            </div>
            <div className='progress-box'>
              <Progress
                label={false}
                percentage={tokenData.percent}
                theme="line"
                strokeWidth={10}
                trackColor={'#404040'}
                status='active'
              />
            </div>
            <div className='footer text-md'>
              {tokenData.description}
            </div>
            {
              stage == 3 && (
                <Button type="submit" onClick={() => { handleMigration() }} className='primary-btn' loading={buttonLoading || checkLoading} >
                  Migration to dex
                </Button>
              )
            }
            {
              stage == 4 && (
                <div className='flex-center justify-content-between dex-action'>
                  <Button className='primary-btn text-primary' onClick={() => { unfreeze() }} loading={buttonLoading}>
                    Unfreeze
                  </Button>
                  <Button className='primary-btn text-primary' onClick={() => { tolink('https://porto.razordex.xyz/') }} style={{ background: '#DBD3A7' }}>
                    Trade on dex
                  </Button>
                </div>
              )
            }

          </div>

          {
            stage == 2 && (

              <div className='last-buyer-card'>
                <div className='card-title text-sm'>Last buying user</div>
                <div className='cell text-xs'>
                  Address: {lastBuyer?.address}
                </div>
                <div className='cell text-xs'>
                  Amount: {lastBuyer?.amount} {tokenData?.tokenName}
                </div>
                <div className='cell text-xs'>
                  Countdown to victory
                </div>
                <div className='count-down-wrap flex-center justify-content-between'>
                  <div className='item'>
                    <div className='label text-sm'>Day</div>
                    <div className='value text-right'>0</div>
                  </div>
                  <div className='item'>
                    <div className='label text-sm'>Hrs</div>
                    <div className='value text-right'>0</div>
                  </div>
                  <div className='item'>
                    <div className='label text-sm'>Mins</div>
                    <div className='value text-right'>{Math.floor(timeLeft / 60)}</div>
                  </div>
                  <div className='item'>
                    <div className='label text-sm'>Sec</div>
                    <div className='value text-right'>{timeLeft % 60}</div>
                  </div>
                </div>
              </div>
            )
          }

          {
            (stage == 3 || stage == 4) && (
              <div className='winner-card'>
                <div className='card-header flex-center justify-content-start'>
                  <div className='title text-sm'>Winner</div>
                  <div className='icon bg-center'></div>
                </div>
                <div className='cell text-xs'>
                  Address: {lastBuyer?.address}
                </div>
                <div className='cell text-xs'>
                  Amount: {lastBuyer?.amount} {tokenData?.tokenName}
                </div>
              </div>
            )
          }
        </div>



      </div>

      <Dialog
        closeBtn={false}
        closeOnEscKeydown
        closeOnOverlayClick
        footer={false}
        header={false}
        mode="modal"
        onClose={() => { setCommentModalVisible(false) }}
        placement="top"
        preventScrollThrough
        showOverlay
        theme="default"
        visible={commentModalVisible}
        className='moveFun-modal'
      >
        <div className='modal-content form-wrap'>
          <Form
            labelAlign="top"
            layout="vertical"
            preventSubmitDefault
            resetType="empty"
            showErrorMessage
            form={commentForm}
            onSubmit={() => { }}
            rules={rules}
          >
            <FormItem label="Add a comment" name="description">
              <Textarea placeholder="" />
            </FormItem>
            <FormItem label="Image" name="uri">
              <Upload
                ref={uploadRef}
                files={files}
                onSelectChange={uploadImage}
                autoUpload={false}
                multiple={false}
                accept="image/*"
                theme="image"
                locale={{
                  triggerUploadText: {
                    image: 'Upload Image',
                  },
                }}
              >
              </Upload>
            </FormItem>
            <Button type="submit" className='trade-btn text-primary' loading={buttonLoading}>
              send comment
            </Button>
            <Button onClick={() => { setCommentModalVisible(false) }} className='text-btn text-primary mt-md' variant="text" theme='primary' block loading={buttonLoading}>
              cancel
            </Button>
          </Form>
        </div>
      </Dialog>

      <Dialog
        closeBtn={false}
        closeOnEscKeydown
        closeOnOverlayClick
        footer={false}
        header={false}
        mode="modal"
        onClose={() => { setSlippageModalVisible(false) }}
        placement="top"
        preventScrollThrough
        showOverlay
        theme="default"
        visible={slippageModalVisible}
        className='moveFun-modal'
      >
        <div className='slippage-title'>Set max. slippage (optional) (%)</div>
        <InputNumber value={slippage} suffix="%" theme='column' className='slippage-input' decimalPlaces={2} onChange={handleChangeSlippage} min={0} max={100}></InputNumber>
      </Dialog>
    </div>
  );
}