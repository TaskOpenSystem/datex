'use client';

import React from 'react';
import { COLLECTIONS } from '@/constants/marketplace';

export default function FeaturedCollections() {
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
          <span className="material-symbols-outlined">star</span> Featured Collections
        </h2>
        <div className="flex gap-2">
          <button className="h-8 w-8 rounded-full border-2 border-ink bg-white flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <button className="h-8 w-8 rounded-full border-2 border-ink bg-white flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x hide-scrollbar">
        {COLLECTIONS.map((collection) => (
          <div 
            key={collection.id}
            className={`snap-center shrink-0 w-[380px] h-[240px] rounded-2xl border-2 border-ink ${collection.colorClass} p-6 relative shadow-hard hover:-translate-y-1 transition-transform cursor-pointer overflow-hidden group`}
          >
            <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
              <span className="material-symbols-outlined text-[180px] select-none">{collection.iconBg}</span>
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="inline-block rounded-full bg-white border-2 border-ink px-3 py-1 text-xs font-bold mb-3 text-ink">
                  {collection.badge}
                </div>
                <h3 className="text-3xl font-black leading-tight">{collection.title}</h3>
                <p className="mt-2 font-medium opacity-80">{collection.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button className="rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white shadow-md group-hover:scale-105 transition-transform">
                  Explore
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
