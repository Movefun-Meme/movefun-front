import { Link, Outlet } from 'umi';
import { useEffect } from 'react';
import { AppKitProvider } from "@/config/config";
import { Row, Col, Space, Button } from 'tdesign-react';
import SiderMenu from './siderMenu';
import PageHeader from './pageHeader';
import enConfig from 'tdesign-react/es/locale/en_US';
import { ConfigProvider } from 'tdesign-react';
export default function Layout() {

  const layout = () => {
    return (
      <ConfigProvider globalConfig={enConfig}>
        <div className='web-page text-primary'>
          <PageHeader />
          <div className='page-body'>
            <Outlet />
          </div>
        </div>
      </ConfigProvider>
    )
  }

  return (
    // AppKitProvider(
    //   { children: layout() }
    // )
    <AppKitProvider >
      {layout()}
    </AppKitProvider>

  );
}
