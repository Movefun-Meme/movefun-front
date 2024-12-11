/**
 * route config
 * document https://umijs.org/docs/guides/routes
 */
export default [
  { exact: true, path: '/', redirect: '/index' },
  {
    path: '/index',
    component: '@/pages/index',
  },
  // {
  //   path: '/dashboard',
  //   component: '@/pages/dashboard',
  // },
  // {
  //   path: '/swap',
  //   component: '@/pages/swap',
  // },
  {
    path: '/token',
    component: '@/pages/token',
  },
  {
    path: '/newIcon',
    component: '@/pages/newIcon',
  },
  // {
  //   path: '/proxyTrade',
  //   component: '@/pages/proxyTrade',
  // },
];
