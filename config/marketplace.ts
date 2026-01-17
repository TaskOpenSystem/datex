export const marketplaceConfig = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID || '0x3ee8141400c1f4accbe52f3be4291e8faf6051dfbaaea794e052a5bbe974884c',
  moduleName: 'marketplace',
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet',
  registryId: process.env.NEXT_PUBLIC_REGISTRY_ID || '0x6cf4a393c7543d9f7ccc97759bed957c88bd7c8790284a1fa6275f5aa3b51502',
  enclaveUrl: 'http://3.85.23.97:3000',
};

export const MIST_PER_SUI = BigInt(1000000000);
