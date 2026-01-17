'use client';

import React from 'react';

export default function MarketplaceHeader() {
  return (
    <header className="p-8 pb-4">
      <div className="flex flex-col gap-6">
        <div className="relative w-full max-w-4xl">
          <div className="absolute -inset-1 rounded-xl bg-ink opacity-20 blur-sm"></div>
          <div className="relative flex items-center h-16 w-full rounded-xl border-2 border-ink bg-white shadow-hard transition-all focus-within:shadow-hard-lg focus-within:-translate-y-1">
            <div className="flex h-full items-center justify-center pl-4 pr-2">
              <span className="material-symbols-outlined text-ink text-3xl">search</span>
            </div>
            <input 
              className="h-full w-full border-none bg-transparent px-2 text-xl font-bold placeholder:text-gray-300 focus:ring-0 text-ink focus:outline-none"
              placeholder="Find the data you need..." 
              type="text"
            />
            <button className="mr-2 h-10 rounded-lg bg-primary px-6 text-sm font-bold text-ink hover:bg-accent-lime transition-colors border-2 border-ink">
              SEARCH
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
