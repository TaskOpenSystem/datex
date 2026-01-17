"use client";

import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";
import { useState, useCallback } from "react";

export function WalletConnectButton() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = useCallback(() => {
    // Clear session storage to fix redirect_uri mismatch on re-login
    sessionStorage.clear();
    disconnect();
    setIsMenuOpen(false);
  }, [disconnect]);

  return (
    <div className="relative">
      <ConnectButton connectText="Launch App" className="sui-wallet-button">
        {account && (
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-full font-bold text-sm uppercase hover:scale-105 transition-transform flex items-center gap-2"
          >
            <span className="material-icons text-base">account_balance_wallet</span>
            <span>{formatAddress(account.address)}</span>
            <span className="material-icons text-sm">
              {isMenuOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
        )}
      </ConnectButton>

      {/* Dropdown menu */}
      {isMenuOpen && account && (
        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[150px] z-50">
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <span className="material-icons text-sm">logout</span>
            Disconnect
          </button>
        </div>
      )}

      {/* Click outside to close */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
}
