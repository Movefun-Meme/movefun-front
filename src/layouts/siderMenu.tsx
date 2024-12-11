import { Menu } from 'tdesign-react';
import { history, useLocation } from 'umi';
import React, { useState, useEffect } from 'react';

export default function siderMenu() {
  const { MenuItem, SubMenu } = Menu;
  const [path, setPath] = useState('/dashboard');
  const location = useLocation();
  const currentPath = location.pathname;

  const navigator = (url: string) => {
    // history.push('/dashboard');
    history.push(url);
  }

  useEffect(() => {
    setPath(currentPath)
  }, [currentPath])

  return (
    <div className="sider-menu">
      <div className="logo bg-center"></div>
      <div className="menu-tree">
        <div className="header">MENU</div>
        <div className="body text-primary-light text-md">

          <div className="menu-item ">
            <div className={`flex-center justify-content-start root ${path === '/dashboard' ? 'active' : ''}`} onClick={() => { navigator('/dashboard') }}>
              <div className="icon icon-dashboard bg-center"></div>
              <div className="menu-name">
                DASHBOARD
              </div>
            </div>
          </div>
          <div className="menu-item">
            <div className={`flex-center justify-content-start root ${path === '/swap' || path === '/yourTokens' ? 'active' : ''}`}>
              <div className="icon icon-trade bg-center"></div>
              <div className="menu-name">
                TRADE
              </div>
            </div>
            <div className={`flex-center sub-menu-item justify-content-start ${path === '/swap' ? 'active' : ''}`} onClick={() => { navigator('/swap') }}>
              SWAP
            </div>
            <div className={`flex-center sub-menu-item justify-content-start ${path === '/yourTokens' ? 'active' : ''}`} onClick={() => { navigator('/yourTokens') }}>
              YOUR TOKENS
            </div>
          </div>
          <div className="menu-item">
            <div className={`flex-center justify-content-start root ${path === '/mint' || path === 'bridge' ? 'active' : ''}`}>
              <div className="icon icon-weusd bg-center"></div>
              <div className="menu-name">
                WEUSD
              </div>
            </div>
            <div className={`flex-center sub-menu-item justify-content-start ${path === '/mint' ? 'active' : ''}`} onClick={() => { navigator('/mint') }}>
              MINT/REDEEM
            </div>
            <div className='flex-center sub-menu-item justify-content-start'>
              BRIDGE
            </div>
          </div>
          <div className="menu-item">
            <div className={`flex-center justify-content-start root ${path === '/proxyTrade' ? 'active' : ''}`} onClick={() => { navigator('/proxyTrade') }}>
              <div className="icon icon-proxyTrade bg-center"></div>
              <div className="menu-name">
                PROXY TRADE
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}