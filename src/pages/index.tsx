
import { useEffect, useState } from 'react';
import { Button, Input, Row, Col, Image, Pagination, PageInfo, Empty, Skeleton, Progress, Select, Switch, Tabs, TabValue, MessagePlugin } from 'tdesign-react';
import { history, useLocation } from 'umi';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
// import { createSurfClient } from '@thalalabs/surf';
import { AptosSignAndSubmitTransactionInput, AptosSignAndSubmitTransactionOutput, AptosSignMessageInput, AptosSignMessageOutput, AptosSignTransactionOutput, UserResponse, WalletAccount } from '@aptos-labs/wallet-standard';
import { CUSTOMFULLNODE } from '@/config/config';
// import { useAptosProvider, useAptosWallet, type AptosProvider } from '@razorlabs/wallet-kit';
import { getTokenPage, subscribe, unSubscribe } from "@/api/index";
import { bigDiv, bigMul, decDiv, decMul, decSub, truncateString } from '@/utils/utils';
import { CaretDownSmallIcon, CaretUpSmallIcon, SwapRightIcon } from 'tdesign-icons-react';
import { orderBy } from 'lodash';
import { SignMessagePayload, useWallet } from '@aptos-labs/wallet-adapter-react';

const { TabPanel } = Tabs;
export default function HomePage() {
  const [params, setParams] = useState<any>({ page: 1, size: 9, orderBy: 'latestPrice', isAsc: false, isDex: 0, onlySub: true })
  const [searchKey, setSearchKey] = useState('');
  const [list, setList] = useState<any>([[], [], []]);
  const [total, setTotal] = useState(0);
  const { account, connected, wallet, network, changeNetwork, connect, signMessage, signMessageAndVerify } = useWallet();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>(1);



  const navigator = (url: string) => {
    history.push(url);
  }

  useEffect(() => {
    getListFromAptos();
  }, [params]);



  useEffect(() => {
    setParams((prev: any) => {
      return {
        ...prev,
        page: 1,
        publicKey: account?.publicKey
      }
    });
  }, [connected])

  const handleChangeSort = (v: any) => {
    setParams((prev: any) => {
      return {
        ...prev,
        page: 1,
        orderBy: v
      }
    });
  }

  const handleAsc = (v: any) => {
    setParams((prev: any) => {
      return {
        ...prev,
        page: 1,
        isAsc: !!v
      }
    });
  }

  const handleIsDex = (v: any) => {
    setParams((prev: any) => {
      return {
        ...prev,
        page: 1,
        isDex: v
      }
    });
  }



  const getListFromAptos = async () => {
    setLoading(true)
    const query = {
      ...params,
      isDex: params.isDex === 0 ? undefined : params.isDex
    }
    getTokenPage(query).then(res => {
      console.log(res)
      const list = res.data.content.map((item: any) => {

        const valueStr = decSub(bigDiv(item.virtualMoveReserves, 10 ** 8), 30);
        let percent
        if (valueStr >= 3) {
          percent = 100;
        } else if (valueStr === 0) {
          percent = 0;
        } else {
          percent = decMul(decDiv(valueStr, 3), 100);
        }
        return {
          ...item,
          percent: item.virtualMoveReserves ? percent : 0
        }
      });
      const columns: any = [[], [], []];
      list.forEach((item: any, index: any) => {
        columns[index % 3].push(item);
      });
      setList(columns)
      setTotal(res.data.totalElements)
      console.log(list)
      setLoading(false);
    })
  }

  const handleChangePage = (current: number, pageInfo: PageInfo) => {
    setParams((prev: any) => {
      return {
        ...prev,
        page: current,
        searchKey: searchKey
      }
    });
  }

  const handleSearch = () => {
    setParams((prev: any) => {
      return {
        ...prev,
        page: 1,
        searchKey: searchKey
      }
    });
  }

  const handleTabChange = (v: TabValue) => {
    console.log(v)
    setTab(v);
    if (v == 1) {
      setParams((prev: any) => {
        return {
          ...prev,
          page: 1,
          onlySub: true,
        }
      });
    }
    if (v == 2) {
      setParams((prev: any) => {
        return {
          ...prev,
          page: 1,
          onlySub: false,
        }
      });
    }
  }

  const handleSubscribe = async (v: any, e: any, columnIdx: number, rowIdx: number) => {
    e.stopPropagation();  // stop pro
    if (!connected) {
      MessagePlugin.error('Connect Wallet First', 3000);
      return;
    }
    console.log(v)
    console.log('account', account)
    const payload: SignMessagePayload = {
      message: v.id,
      nonce: '1'
    }
    const res = await signMessage(payload)
    console.log('signature', res)
    const signRes = res.signature.data.data;
    let bufferSignArray = res.signature.data.data;
    /** fix razor wallet sign bug */
    if (typeof signRes === 'object' && !Array.isArray(signRes) && !(signRes instanceof Uint8Array)) {
      let uint8Array = new Uint8Array(64);
      for (let key in signRes) {
        if (signRes.hasOwnProperty(key)) {
          uint8Array[key] = signRes[key];
        }
      }
      bufferSignArray = uint8Array;
    }
    const hexString = Buffer.from(bufferSignArray).toString('hex');
    console.log(hexString);
    if (!v.isSubscribe) {
      const response: any = await subscribe(v.id, { publicKey: account!.publicKey, signature: hexString })
      if (response.success) {
        MessagePlugin.success('Follow Success', 3000)
        // getListFromAptos()
        setList((prev: any) => {
          const newList = [...prev];
          newList[columnIdx] = [...prev[columnIdx]]; 
          newList[columnIdx][rowIdx] = {
            ...newList[columnIdx][rowIdx],  
            isSubscribe: true, 
          };
          return newList;
        });
      }
    } else {
      const response: any = await unSubscribe(v.id, { publicKey: account!.publicKey, signature: hexString })
      if (response.success) {
        MessagePlugin.success('Cancel Follow Success', 3000)
        if (tab == 1) {
          /** 关注页取消关注直接刷新 */
          getListFromAptos();
          return;
        }
        setList((prev: any) => {
          const newList = [...prev];
          newList[columnIdx] = [...prev[columnIdx]]; 
          newList[columnIdx][rowIdx] = {
            ...newList[columnIdx][rowIdx],  
            isSubscribe: false,  
          };
          return newList;
        });
      }
    }
  }

  return (
    <div className='home-page text-primary'>
      <div className='flex-center start-new-coin justify-content-center'>
        <span className='font-weight-bold' onClick={() => { navigator('/newIcon') }}>start a new coin</span>
        <div className='arrow-icon bg-center' onClick={() => { navigator('/newIcon') }}></div>
      </div>
      <div className='flex-center search-cell justify-content-center'>
        <div className='search-box mr-sm'>
          <Input
            type="search"
            placeholder='search for token'
            value={searchKey}
            onChange={setSearchKey}
            clearable
          />
        </div>
        <Button className='primary-btn' ghost variant="text" onClick={handleSearch}>search</Button>
      </div>
      {
        connected && (
          <div className='tabs-wrap'>
            <Tabs
              defaultValue="1"
              placement="top"
              size="medium"
              theme="normal"
              onChange={handleTabChange}
            >
              <TabPanel
                label="Following"
                value="1"
              ></TabPanel>
              <TabPanel
                label="Terminal"
                value="2"
              ></TabPanel>
            </Tabs>
          </div>
        )
      }
      <div className='filter-sort-action-box '>
        <Row gutter={36} align='middle'>
          <Col>
            <Select className="select-sort" onChange={handleChangeSort} value={params.orderBy} popupProps={{ overlayInnerStyle: { width: '190px' } }} suffixIcon={
              <>
                {
                  params.orderBy == 'latestPrice' && (
                    <div className='fire-icon bg-center mr-lg'></div>
                  )
                }
                <div className='arrow-icon'></div>
              </>
            }>
              <Select.Option value={'latestPrice'}>
                Sort: featured
              </Select.Option>
              <Select.Option value={'virtualMoveReserves'}>
                Sort: bump order
              </Select.Option>
              <Select.Option value={'createTime'}>
                Sort: creation time
              </Select.Option>
            </Select>
          </Col>
          <Col>
            <Select className="select-sort" onChange={handleAsc} value={params.isAsc} popupProps={{ overlayInnerStyle: { width: '190px' } }} suffixIcon={<div className='arrow-icon'></div>}
              options={[
                { label: 'Asc', value: true, },
                { label: 'Desc', value: false, }
              ]}
            >
            </Select>
          </Col>
          {/* <Col>
            <span className='text-primary text-md'>isDex: </span><Switch className="filter-switch" onChange={handleIsDex} />
          </Col> */}
          <Col>
            <Select placeholder=" " className="select-sort" onChange={handleIsDex} value={params.isDex} popupProps={{ overlayInnerStyle: { width: '190px' } }} suffixIcon={<div className='arrow-icon'></div>}
              options={[
                { label: 'All', value: 0, },
                { label: 'Is Dex', value: true, },
                { label: 'Un Dex', value: false, }
              ]}
            >
            </Select>
          </Col>
        </Row>

      </div>
      {
        loading ?
          <>
            <div className='grid-wrap '>
              <Row gutter={36}>
                <Col span={4}>
                  <div className='loading-item d-flex'>
                    <Skeleton theme='text' animation='flashed'></Skeleton>
                    <div className='flex-1 ml-md'>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div className='loading-item d-flex'>
                    <Skeleton theme='text' animation='flashed'></Skeleton>
                    <div className='flex-1 ml-md'>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                    </div>
                  </div>
                </Col>
                <Col span={4}>
                  <div className='loading-item d-flex'>
                    <Skeleton theme='text' animation='flashed'></Skeleton>
                    <div className='flex-1 ml-md'>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                      <Skeleton className='text-skeleton mb-md ' animation='flashed'></Skeleton>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </>
          :
          <>
            {
              list[0].length == 0 ? (
                <div className='nodate-empty-image flex-center flex-column'>
                  <div className='image bg-center'></div>
                  <div className='text text-center'>no data</div>
                </div>
              )
                :
                (
                  <div className='grid-wrap '>
                    <Row gutter={36}>
                      {
                        list.map((items: any, idx: any) => {
                          return (
                            <Col span={4} key={idx}>
                              {
                                items.map((item: any, rowIdx: any) => {
                                  return (
                                    <Row gutter={0} key={item.id}>
                                      <Col span={12}>
                                        <div className={`token-item-box ${item.isDex ? 'isDex' : ''}`}>
                                          <div className={`d-flex`} onClick={() => { navigator(`/token?id=${item.id}`) }}>
                                            <div>

                                              <Image
                                                src={item.icon}
                                                // fit='scale-down'
                                                className='token-image'
                                                loading={
                                                  <div style={{ width: '100px', height: '100%' }}>
                                                    <Skeleton animation='flashed' theme="text"></Skeleton>
                                                  </div>
                                                }
                                              // error={
                                              //   <div style={{ width: '100px', height: '100%' }}>
                                              //     <Skeleton animation='flashed' theme="text"></Skeleton>
                                              //   </div>
                                              // }
                                              />
                                              {
                                                item.isDex && (<div className='complete text-center mt-md mr-md myfont'>Complete</div>)
                                              }
                                            </div>
                                            <div className='token-info flex-1'>
                                              <div className='text-primary d-flex text-sm header'>
                                                <span className='mr-sm'>Created by</span>
                                                <span className='mr-sm'>{truncateString(item.sender)}</span>
                                                {/* <Image
                                      src={'https://tdesign.gtimg.com/demo/demo-image-1.png'}
                                      shape="circle"
                                      fit="cover"
                                      className='profile'
                                    /> */}
                                                <span className='mr-sm flex-center'>
                                                  {item.tokenName}
                                                  <div className={`subscribe-icon ml-md bg-center ${item.isSubscribe ? 'active' : ''}`} onClick={(e) => { handleSubscribe(item, e, idx, rowIdx) }}></div>
                                                </span>
                                                {/* <span>2h ago</span> */}
                                              </div>
                                              <div className='body text-sm text-primary-light'>
                                                <span className='mr-xs'>market cap:</span>
                                                <span>{bigMul(item.latestPrice, 10 ** 8)}</span>
                                              </div>
                                              <div className='progress-box'>
                                                <Progress
                                                  label={false}
                                                  percentage={item.percent}
                                                  theme="line"
                                                  strokeWidth={10}
                                                  trackColor={'#404040'}
                                                  status='active'
                                                />
                                              </div>
                                              {/* <div className='text-primary-dark mb-xs text-sm'>replies: 41</div> */}
                                              <div className='footer text-md text-primary-dark'>
                                                {item.description}
                                              </div>
                                            </div>
                                          </div>


                                        </div>
                                      </Col>
                                    </Row>
                                  )
                                })
                              }
                            </Col>
                          )
                        })
                      }
                    </Row>

                    <div className='pagination-box'>
                      <Pagination
                        showPageSize={false}
                        totalContent={false}
                        size="medium"
                        theme="default"
                        total={total}
                        current={params.page}
                        pageSize={params.size}
                        className='pagination justify-content-center'
                        onCurrentChange={handleChangePage}
                      />
                    </div>
                  </div>
                )
            }
          </>
      }


    </div >
  );
}
