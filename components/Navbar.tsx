"use client";

import { WalletConnectButton } from "./WalletConnectButton";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-4xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="material-icons text-primary text-3xl">token</span>
          <span className="font-display text-2xl tracking-wide uppercase">
            DataEx
          </span>
        </div>
        <div className="hidden md:flex gap-8 font-semibold text-sm uppercase tracking-wider">
          <a className="hover:text-primary transition-colors" href="#">
            Marketplace
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Walrus
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Staking
          </a>
        </div>
        <div className="flex gap-3">
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
}
