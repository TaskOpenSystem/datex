'use client';

import React from 'react';
import { MyListing } from '@/types/marketplace';

interface ListingCardProps {
  listing: MyListing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all duration-200 group relative">
      <div className="relative w-full aspect-video rounded-lg border-2 border-ink bg-gray-100 mb-4 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" 
          style={{ backgroundImage: `url('${listing.imageUrl}')` }}
        ></div>
        <div className={`absolute top-2 left-2 rounded border border-ink px-2 py-0.5 text-[10px] font-bold ${
          listing.status === 'ACTIVE' 
            ? 'bg-accent-lime text-ink' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {listing.status}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <h3 className="text-lg font-bold leading-tight mb-1 text-ink group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-wide">
          {listing.updatedAt}
        </p>
        
        <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 rounded-lg p-2 border border-gray-200">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Price</p>
            <p className="text-sm font-black text-ink">{listing.price} SUI</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Earnings</p>
            <p className="text-sm font-black text-green-600">{listing.earnings} SUI</p>
          </div>
          <div className="col-span-2 border-t border-gray-200 pt-1 mt-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500">Sales</span>
              <span className="text-[10px] font-bold text-ink">{listing.sales}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-auto flex gap-2">
          <button className="flex-1 h-9 rounded-lg border-2 border-ink bg-white text-ink text-sm font-bold hover:bg-gray-100 transition-colors">
            {listing.status === 'PAUSED' ? 'Resume' : 'Edit'}
          </button>
          <button className="flex-1 h-9 rounded-lg bg-ink text-white text-sm font-bold flex items-center justify-center gap-1 hover:bg-primary hover:text-ink hover:border-2 hover:border-ink transition-all shadow-sm">
            <span className="material-symbols-outlined text-sm">settings</span> Manage
          </button>
        </div>
      </div>
    </article>
  );
}
