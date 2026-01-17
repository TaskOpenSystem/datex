'use client';

import React, { useState, useEffect, useRef } from 'react';
import ListingCard from '@/components/marketplace/ListingCard';
import { MY_LISTINGS, MY_PURCHASES } from '@/constants/marketplace';
import gsap from 'gsap';

export default function MyDataPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [processingType, setProcessingType] = useState<'create' | 'download' | null>(null);

  // Refs for animation
  const overlayRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGTextPathElement>(null);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateModalOpen(false);
    setProcessingType('create');
  };

  const handleDownload = () => {
    setProcessingType('download');
  };

  useEffect(() => {
    if (processingType) {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            const wasDownload = processingType === 'download';
            setProcessingType(null);
            if (wasDownload) {
              alert("Download started: report_data.csv");
            } else {
              alert("Listing created successfully!");
            }
          }, 800);
        }
      });

      // Reset common props
      gsap.set(progressRef.current, { width: "0%", backgroundColor: "white" });
      if(pathRef.current) pathRef.current.style.fill = "white";

      if (processingType === 'create') {
        gsap.set(sealRef.current, { scale: 3, opacity: 0, rotation: -45, borderColor: "white", boxShadow: "none", x: 0 });
        gsap.set(iconRef.current, { scale: 0.5, opacity: 0, color: "white", rotation: 0 });
        if(iconRef.current) iconRef.current.innerText = "lock";

        tl.to(overlayRef.current, { opacity: 1, duration: 0.2 })
          .to(textRef.current, { 
            duration: 0.5, 
            onStart: () => { 
              if(textRef.current) {
                textRef.current.innerText = "ENCRYPTING METADATA"; 
                textRef.current.className = "mt-12 text-3xl font-black text-white uppercase tracking-[0.2em] text-center px-4";
              }
              if(subTextRef.current) subTextRef.current.innerText = "Preparing asset for encryption";
            }
          })
          .to(progressRef.current, { width: "60%", duration: 1.2, ease: "power2.inOut" })
          .to(sealRef.current, { scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: "elastic.out(1, 0.5)" })
          .to(overlayRef.current, { backgroundColor: "#101618", duration: 0.1, yoyo: true, repeat: 1 }, "-=0.2")
          .to(iconRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" })
          .add(() => {
             if(textRef.current) textRef.current.innerText = "VERIFYING ZK-PROOFS";
             if(subTextRef.current) subTextRef.current.innerText = "Generating SNARKs on Sui Network...";
          })
          .to(progressRef.current, { width: "90%", duration: 1 })
          .to(sealRef.current, { borderColor: "#ccff00", boxShadow: "0 0 30px #ccff00", duration: 0.3 })
          .to(iconRef.current, { color: "#ccff00", duration: 0.3 }, "<")
          .add(() => {
             if(textRef.current) {
               textRef.current.innerText = "ASSET SECURED";
               textRef.current.classList.add("text-accent-lime");
             }
             if(subTextRef.current) subTextRef.current.innerText = "Listing created successfully.";
          })
          .to(progressRef.current, { width: "100%", backgroundColor: "#ccff00", duration: 0.3 })
          .to(sealRef.current, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });

      } else {
        gsap.set(sealRef.current, { scale: 0.5, opacity: 0, rotation: 0, borderColor: "white", boxShadow: "none", x: 0 });
        gsap.set(iconRef.current, { scale: 1, opacity: 1, color: "white", rotation: 0 });
        if(iconRef.current) iconRef.current.innerText = "lock";

        tl.to(overlayRef.current, { opacity: 1, duration: 0.2 })
          .to(sealRef.current, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
          .add(() => {
             if(textRef.current) {
                textRef.current.innerText = "VERIFYING OWNERSHIP";
                textRef.current.className = "mt-12 text-3xl font-black text-white uppercase tracking-[0.2em] text-center px-4";
             }
             if(subTextRef.current) subTextRef.current.innerText = "Checking wallet signature...";
          })
          .to(sealRef.current, { rotation: 180, duration: 1, ease: "power2.inOut" })
          .to(progressRef.current, { width: "40%", duration: 1 }, "<")
          .to(iconRef.current, { scale: 0, rotation: 90, duration: 0.2 })
          .add(() => {
             if(iconRef.current) iconRef.current.innerText = "lock_open";
             if(textRef.current) textRef.current.innerText = "DECRYPTING SHARDS";
             if(subTextRef.current) subTextRef.current.innerText = "Reassembling Walrus Protocol data...";
          })
          .to(iconRef.current, { scale: 1, rotation: 0, duration: 0.2 })
          .to(progressRef.current, { width: "75%", duration: 1.2 })
          .to(sealRef.current, { x: 5, duration: 0.05, yoyo: true, repeat: 5 })
          .to(sealRef.current, { 
             borderColor: "#ccff00",
             backgroundColor: "#101618",
             boxShadow: "0 0 50px rgba(204, 255, 0, 0.4)",
             scale: 1.1,
             duration: 0.3
          })
          .to(iconRef.current, { scale: 0, duration: 0.1 }, "<")
          .add(() => {
             if(iconRef.current) {
               iconRef.current.innerText = "download";
               iconRef.current.style.color = "#ccff00";
             }
             if(textRef.current) {
               textRef.current.innerText = "DECRYPTION COMPLETE";
               textRef.current.classList.add("text-accent-lime");
             }
             if(subTextRef.current) subTextRef.current.innerText = "Download starting now.";
             if(pathRef.current) pathRef.current.style.fill = "#ccff00";
          })
          .to(iconRef.current, { scale: 1.5, duration: 0.4, ease: "elastic.out(1, 0.5)" })
          .to(progressRef.current, { width: "100%", backgroundColor: "#ccff00", duration: 0.3 });
      }
    }
  }, [processingType]);

  return (
    <>
      {/* Dashboard Header */}
      <header className="px-8 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500">
              <span>Dashboard</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-ink">Overview</span>
            </div>
            <h1 className="text-4xl font-black text-ink uppercase tracking-tight">My Data Dashboard</h1>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-ink opacity-100 translate-x-1 translate-y-1 blur-0"></div>
            <div className="relative flex items-center gap-6 rounded-xl border-2 border-ink bg-white p-4 pr-8 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-ink bg-accent-lime">
                <span className="material-symbols-outlined text-4xl text-ink">trending_up</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-ink">1,450.5</h2>
                  <span className="text-sm font-bold text-gray-400">SUI</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded border border-green-200 mt-1">
                  <span className="material-symbols-outlined text-xs">arrow_upward</span> +12% this week
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-8 mt-6">
        <div className="flex gap-4 border-b-2 border-gray-200">
          <button className="px-6 py-3 rounded-t-xl border-2 border-ink border-b-0 bg-white font-bold text-lg text-ink relative top-[2px] z-10 shadow-[0_-2px_0_0_rgba(0,0,0,0.05)]">
            My Uploads
          </button>
          <button className="px-6 py-3 rounded-t-xl border-2 border-transparent hover:bg-gray-100 font-bold text-lg text-gray-500 transition-colors">
            My Purchases
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-8 py-8 bg-white border-t-0 border-ink/0 overflow-y-auto">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
              Active Listings <span className="text-gray-400 text-base font-normal ml-1">({MY_LISTINGS.length + 1} items)</span>
            </h2>
            <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
              View Analytics <span className="material-symbols-outlined text-sm">arrow_outward</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Card */}
            <article 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink bg-gray-50 p-6 min-h-[340px] hover:bg-blue-50 hover:border-primary transition-all duration-200 cursor-pointer group"
            >
              <div className="h-20 w-20 rounded-2xl bg-white border-2 border-ink flex items-center justify-center shadow-hard mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                <span className="material-symbols-outlined text-4xl text-primary">add</span>
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Upload New Dataset</h3>
              <p className="text-sm text-gray-500 text-center max-w-[200px] font-medium">Create a new listing, set your price in SUI, and start earning.</p>
              <button className="mt-6 rounded-lg border-2 border-ink bg-primary px-4 py-2 text-sm font-bold text-white shadow-hard-sm group-hover:shadow-hard transition-all">
                Create Listing
              </button>
            </article>

            {/* Listings */}
            {MY_LISTINGS.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <div className="mt-12 mb-6 border-t-2 border-gray-200 border-dashed"></div>

        {/* Recent Purchases */}
        <section className="transition-all duration-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
              Recent Purchases <span className="text-gray-400 text-base font-normal ml-1">({MY_PURCHASES.length} items)</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MY_PURCHASES.map(purchase => (
              <article key={purchase.id} className="flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg border-2 border-ink bg-accent-orange flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">{purchase.iconBg}</span>
                  </div>
                  <span className="rounded bg-blue-100 text-blue-800 px-2 py-1 text-[10px] font-bold border border-blue-200">BOUGHT</span>
                </div>
                <h3 className="text-lg font-bold text-ink mb-1">{purchase.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{purchase.date}</p>
                <button 
                  onClick={handleDownload}
                  className="mt-auto w-full h-10 rounded-lg border-2 border-ink bg-white hover:bg-primary hover:text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">download</span> Download CSV
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-auto border-t-2 border-ink pt-8 flex flex-col items-center gap-4 text-center opacity-60 pb-8 bg-[#f6f7f9]">
        <p className="text-sm font-bold">Powered by Sui Network</p>
        <div className="flex gap-4">
          <span className="material-symbols-outlined">dataset</span>
          <span className="material-symbols-outlined">security</span>
          <span className="material-symbols-outlined">hub</span>
        </div>
      </footer>

      {/* Create Listing Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border-2 border-ink shadow-hard-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-ink">close</span>
            </button>

            <h2 className="text-2xl font-black text-ink uppercase mb-6">Create New Listing</h2>
            
            <form onSubmit={handleCreateListing}>
              {/* File Upload Area */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Dataset File</label>
                <div className="border-2 border-dashed border-ink rounded-xl bg-gray-50 p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group">
                  <div className="h-12 w-12 rounded-lg bg-white border-2 border-ink flex items-center justify-center shadow-hard-sm group-hover:scale-110 transition-transform mb-3">
                    <span className="material-symbols-outlined text-primary">cloud_upload</span>
                  </div>
                  <p className="text-sm font-bold text-ink">Click to upload or drag and drop</p>
                  <p className="text-xs font-medium text-gray-500 mt-1">CSV, JSON, or Parquet (Max 1GB)</p>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Title</label>
                  <input type="text" className="w-full rounded-lg border-2 border-gray-200 focus:border-ink focus:ring-0 font-bold text-ink placeholder:text-gray-300 transition-colors p-3" placeholder="e.g. Q3 DeFi Transaction Logs" required />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Description</label>
                  <textarea className="w-full rounded-lg border-2 border-gray-200 focus:border-ink focus:ring-0 font-medium text-ink placeholder:text-gray-300 transition-colors min-h-[100px] p-3" placeholder="Describe your dataset..." required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Price (SUI)</label>
                    <input type="number" className="w-full rounded-lg border-2 border-gray-200 focus:border-ink focus:ring-0 font-bold text-ink placeholder:text-gray-300 transition-colors p-3" placeholder="0.00" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Category</label>
                    <select className="w-full rounded-lg border-2 border-gray-200 focus:border-ink focus:ring-0 font-bold text-ink transition-colors bg-white p-3">
                      <option>DeFi</option>
                      <option>NFTs</option>
                      <option>Gaming</option>
                      <option>Social</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border-2 border-ink bg-white text-ink font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl border-2 border-ink bg-primary text-white font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animation Overlay */}
      {processingType && (
        <div 
          ref={overlayRef}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink/95 backdrop-blur-md transition-colors opacity-0"
        >
          {/* The Seal */}
          <div 
            ref={sealRef}
            className="relative flex h-64 w-64 items-center justify-center rounded-full border-[6px] border-white bg-ink shadow-2xl"
          >
            {/* Inner Rings */}
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/30 animate-spin" style={{ animationDuration: '10s' }}></div>
            <div className="absolute inset-4 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></div>
            
            {/* Icon */}
            <span ref={iconRef} className="material-symbols-outlined !text-[120px] text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">lock</span>
            
            {/* Decorative Text Ring */}
            <svg className="absolute inset-0 h-full w-full animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} viewBox="0 0 100 100" width="100" height="100">
              <path id="circlePathCommon" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
              <text fill="white" fontSize="8" fontWeight="bold" letterSpacing="2">
                <textPath ref={pathRef} href="#circlePathCommon" startOffset="0%">
                  {processingType === 'create' 
                    ? "SUI DATA MARKETPLACE • SECURE ENCRYPTION •" 
                    : "SECURE DECRYPTION • WALRUS PROTOCOL •"}
                </textPath>
              </text>
            </svg>
          </div>

          {/* Status Text */}
          <h2 
            ref={textRef} 
            className="mt-12 text-3xl font-black text-white uppercase tracking-[0.2em] text-center px-4"
          >
            INITIALIZING
          </h2>
          <p ref={subTextRef} className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
            Accessing secure storage
          </p>

          {/* Progress Bar */}
          <div className="mt-8 h-4 w-64 rounded-full border-2 border-white bg-gray-800 p-1">
            <div 
              ref={progressRef} 
              className="h-full w-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            ></div>
          </div>

          {/* Brutalist Decor */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 opacity-30">
            <span className="font-mono text-xs text-white">BLOCK: #829102</span>
            <span className="font-mono text-xs text-white">HASH: 0x4f...a9</span>
            <span className="font-mono text-xs text-white">NODE: SUI-MAINNET-01</span>
          </div>
        </div>
      )}
    </>
  );
}
