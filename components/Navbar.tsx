"use client";

import { WalletConnectButton } from "./WalletConnectButton";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center">
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-4xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="material-icons text-primary text-3xl">token</span>
          <span className="font-display text-2xl tracking-wide uppercase">
            DatEx
          </span>
        </div>
        <div className="hidden md:flex gap-8 font-semibold text-sm uppercase tracking-wider">
          <Link className="hover:text-primary transition-colors" href="/">
            Home
          </Link>
          <Link className="hover:text-primary transition-colors" href="/marketplace">
            Marketplace
          </Link>
          <Link className="hover:text-primary transition-colors" href="#">
            About
          </Link>
        </div>
        <div className="flex gap-3">
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
}
