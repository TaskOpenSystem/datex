'use client';

import React from 'react';
import { DataAsset } from '@/types/marketplace';

interface AssetCardProps {
  asset: DataAsset;
  onClick?: () => void;
}

export default function AssetCard({ asset, onClick }: AssetCardProps) {
  return (
    <article 
      onClick={onClick}
      className="flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all duration-200 group cursor-pointer"
    >
      <div className="relative w-full aspect-video rounded-lg border-2 border-ink bg-gray-100 mb-4 overflow-hidden">
        <div 
          className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" 
          style={{ backgroundImage: `url('${asset.imageUrl}')` }}
        ></div>
        {asset.badge && (
          <div className={`absolute top-2 right-2 rounded border border-ink px-2 py-0.5 text-[10px] font-bold ${
            asset.badge === 'SALE' ? 'bg-accent-pink text-white' : 'bg-accent-lime text-ink'
          }`}>
            {asset.badge}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex gap-2 mb-2 flex-wrap">
          {asset.tags.map((tag, idx) => (
            <span 
              key={idx}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                tag.type === 'walrus' 
                  ? 'border-blue-200 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              {tag.icon && <span className="material-symbols-outlined text-[12px]">{tag.icon}</span>} {tag.label}
            </span>
          ))}
        </div>
        
        <h3 className="text-lg font-bold leading-tight mb-1 text-ink group-hover:text-primary transition-colors">
          {asset.title}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {asset.description}
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-3 border-t-2 border-gray-100 border-dashed">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Price</span>
            <span className="text-lg font-black text-ink">{asset.price} {asset.currency}</span>
          </div>
          <button className="h-9 w-9 rounded-lg bg-ink text-white flex items-center justify-center hover:bg-primary hover:text-ink transition-colors shadow-sm active:scale-95">
            <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
          </button>
        </div>
      </div>
    </article>
  );
}
