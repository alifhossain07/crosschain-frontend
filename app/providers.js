"use client";

import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia } from "@thirdweb-dev/chains";

// Polygon Amoy chain configuration
const PolygonAmoy = {
  chainId: 80002,
  rpc: ["https://rpc-amoy.polygon.technology"],
  nativeCurrency: {
    decimals: 18,
    name: "MATIC",
    symbol: "MATIC",
  },
  shortName: "amoy",
  slug: "polygon-amoy",
  testnet: true,
  chain: "Polygon",
  name: "Polygon Amoy",
  icon: {
    url: "ipfs://QmcxZHpyJa8T4i63xqjP3imiw9gnksYnRUYarYDAewXoTRX/polygon.svg",
    width: 512,
    height: 512,
    format: "svg",
  },
  explorers: [
    {
      name: "Polygonscan",
      url: "https://amoy.polygonscan.com",
      standard: "EIP3091",
    },
  ],
};

export function Providers({ children }) {
  return (
    <ThirdwebProvider
      activeChain={Sepolia}
      supportedChains={[Sepolia, PolygonAmoy]}
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || ""}
    >
      {children}
    </ThirdwebProvider>
  );
}
