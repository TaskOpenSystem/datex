// Walrus & SUI-Pay configuration
export const walrusConfig = {
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet',
  
  // WAL Exchange contract addresses
  exchangePackageId: process.env.NEXT_PUBLIC_WAL_EXCHANGE_PACKAGE_ID || '',
  exchangeObjectId: process.env.NEXT_PUBLIC_WAL_EXCHANGE_OBJECT_ID || '',
  
  // Default storage settings
  defaultEpochs: 3,
  defaultBufferPercent: 0, // 0% buffer for price fluctuations - exact amount
};