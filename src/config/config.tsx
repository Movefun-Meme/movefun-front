import { QueryClient, QueryClientProvider } from '@tanstack/react-query'


// # ipfs url
const VITE_IPFS_URL = "https://gateway.pinata.cloud/ipfs/"; 

// const moveiconurl = 'https://raw.githubusercontent.com/razorlabsorg/chainlist/main/chain/aptos/asset/MOVE.png';

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
const CUSTOMFULLNODE = 'https://aptos.testnet.porto.movementlabs.xyz/v1'
const queryClient = new QueryClient()
function AppKitProvider({ children }: any) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AptosWalletAdapterProvider>
  )
}

export {
  AppKitProvider,
  CUSTOMFULLNODE,
  VITE_IPFS_URL
};