import { history, useLocation } from 'umi';
import React, { useState, useEffect } from 'react';
import { Row, Col, Space, Button, Dialog } from 'tdesign-react';
import { truncateString } from '@/utils/utils';
// import { AptosConnectButton } from '@razorlabs/wallet-kit';
// import { useAptosWallet, } from '@razorlabs/wallet-kit';
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

export default function pageHeader() {
  // const wallet = useAptosWallet();
  const [worksVisible, setWorksVisible] = useState(false);


  useEffect(() => {

  }, [])


  return (
    <div className='page-header'>

      <Row align='middle' justify="space-between">
        <Col>
          <div className='flex-center'>
            <div className='logo bg-center' onClick={() => { history.replace('/index') }}></div>
            <Button className='ghost-btn' ghost onClick={() => { setWorksVisible(true) }} >how it works</Button>
          </div>
        </Col>
        <Col>
          {/* <AptosConnectButton className={`primary-btn ${!wallet.connected?'connect-btn':''}`}> */}
          {/* <Button className='primary-btn' >Connect Wallet</Button> */}
          {/* </AptosConnectButton> */}
          <WalletSelector />
        </Col>
      </Row>

      <Dialog
        closeBtn={false}
        closeOnEscKeydown
        closeOnOverlayClick
        footer={false}
        header={false}
        mode="modal"
        onClose={() => { setWorksVisible(false) }}
        placement="top"
        preventScrollThrough
        showOverlay
        theme="default"
        visible={worksVisible}
        className='works-modal'
      >
        <div className='works-modal-content'>
          <div className='title text-center'>how it works</div>
          <div className='p p-1'>
            movefun prevents rugs by making sure that all created tokens aresafe. Each coin on movefun is a fair-launch with no presale andno team allocation.
          </div>
          <div className='p p-2'>
            <div className='item'>
              step 1: Pick a coin that you like
            </div>
            <div className='item'>
              step 2: Buy the coin on the bonding curve
            </div>
            <div className='item'>
              step 3: Sell at any time to lock in your profits or losses
            </div>
            <div className='item'>
              step 4. When enough people buy on the bonding curve and it reachesa market cap of 3 move, the token enters the pump phase. In thisphase, you can only buy but not sell.
              f the last buver is not outbid within 1 hour, they will be awarded 10%
              of the remaining token supply .
            </div>
            <div className='item'>
              step 5: After that, liquidity is deposited in Razor and burned.
            </div>
          </div>
          <div className='flex-center justify-content-center'>
            <Button className='primary-btn' onClick={() => { setWorksVisible(false) }}> I'm ready to movefun</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}