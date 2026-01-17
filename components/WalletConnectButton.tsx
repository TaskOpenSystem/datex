"use client";

import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export function WalletConnectButton() {
  const account = useCurrentAccount();

  // Format địa chỉ: 0x1234...5678
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <ConnectButton
      connectText="Launch App"
      className="sui-wallet-button"
    >
      {account && (
        <div className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full font-bold text-sm uppercase hover:scale-105 transition-transform flex items-center gap-2">
          <span className="material-icons text-base">account_balance_wallet</span>
          <span>{formatAddress(account.address)}</span>
        </div>
      )}
    </ConnectButton>
  );
}
