export const enokiConfig = {
  apiKey: process.env.NEXT_PUBLIC_ENOKI_API_KEY!,
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet" | "testnet",
  rpcUrl: process.env.NEXT_PUBLIC_SUI_RPC_URL!,
};
