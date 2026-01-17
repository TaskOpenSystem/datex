'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DATA_ASSETS } from '@/constants/marketplace';
import gsap from 'gsap';

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const asset = DATA_ASSETS.find(a => a.id === id);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [processingMode, setProcessingMode] = useState<'download' | 'preview' | null>(null);

  // Refs for animation
  const overlayRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGTextPathElement>(null);

  const handleConfirmPurchase = () => {
    alert(`Successfully purchased ${asset?.title} for ${asset?.price} ${asset?.currency}!`);
    setIsBuyModalOpen(false);
  };

  const handleDownloadClick = () => {
    setProcessingMode('download');
  };

  const handlePreviewClick = () => {
    setProcessingMode('preview');
  };

  useEffect(() => {
    if (processingMode && asset) {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => {
            const mode = processingMode;
            setProcessingMode(null);
            if (mode === 'download') {
              alert(`Downloading ${asset.title}...`);
            } else {
              alert(`Preview for ${asset.title} is ready!`);
            }
          }, 800);
        }
      });

      // Initial States
      gsap.set(sealRef.current, { scale: 0.5, opacity: 0, rotation: 0 });
      gsap.set(progressRef.current, { width: "0%" });
      gsap.set(iconRef.current, { scale: 1, opacity: 1, color: "white" });
      
      // Animation Sequence
      tl.to(overlayRef.current, { opacity: 1, duration: 0.2 })
        .to(sealRef.current, { 
          scale: 1, 
          opacity: 1, 
          duration: 0.5, 
          ease: "back.out(1.7)" 
        })
        .add(() => {
           if(textRef.current) textRef.current.innerText = processingMode === 'download' ? "VERIFYING OWNERSHIP" : "ESTABLISHING UPLINK";
           if(subTextRef.current) subTextRef.current.innerText = processingMode === 'download' ? "Checking wallet signature..." : "Connecting to secure server...";
        })
        .to(sealRef.current, { rotation: 180, duration: 1, ease: "power2.inOut" })
        .to(progressRef.current, { width: "40%", duration: 1 }, "<")
        .to(iconRef.current, { scale: 0, rotation: 90, duration: 0.2 })
        .add(() => {
           if(iconRef.current) iconRef.current.innerText = processingMode === 'download' ? "lock_open" : "cloud_upload";
           if(textRef.current) textRef.current.innerText = processingMode === 'download' ? "DECRYPTING SHARDS" : "UPLOADING REQUEST";
           if(subTextRef.current) subTextRef.current.innerText = processingMode === 'download' ? "Reassembling Walrus Protocol data..." : "Sending query parameters...";
        })
        .to(iconRef.current, { scale: 1, rotation: 0, duration: 0.2 })
        .to(progressRef.current, { width: "60%", duration: 1.2 })
        .to(sealRef.current, { x: 5, duration: 0.05, yoyo: true, repeat: 5 })
        .to(iconRef.current, { scale: 0, rotation: -90, duration: 0.2 })
        .add(() => {
           if(processingMode === 'preview') {
             if(iconRef.current) iconRef.current.innerText = "memory";
             if(textRef.current) textRef.current.innerText = "DECODING STREAM";
             if(subTextRef.current) subTextRef.current.innerText = "Processing server response...";
           }
        })
        .to(iconRef.current, { scale: 1, rotation: 0, duration: 0.2 }) 
        .to(progressRef.current, { width: "85%", duration: 1.2 })
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
             iconRef.current.innerText = processingMode === 'download' ? "download" : "visibility";
             iconRef.current.style.color = "#ccff00";
           }
           if(textRef.current) {
             textRef.current.innerText = processingMode === 'download' ? "DECRYPTION COMPLETE" : "PREVIEW READY";
             textRef.current.classList.add("text-accent-lime");
           }
           if(subTextRef.current) subTextRef.current.innerText = processingMode === 'download' ? "Download starting now." : "Rendering data snippet...";
           if(pathRef.current) pathRef.current.style.fill = "#ccff00";
        })
        .to(iconRef.current, { scale: 1.5, duration: 0.4, ease: "elastic.out(1, 0.5)" })
        .to(progressRef.current, { width: "100%", backgroundColor: "#ccff00", duration: 0.3 });
    }
  }, [processingMode, asset]);

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl font-bold">Asset not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[400px] shrink-0 bg-accent-lime border-b-2 lg:border-b-0 lg:border-r-2 border-ink flex flex-col p-6 lg:p-8 gap-6 lg:gap-8 overflow-y-auto z-10 relative">
        <Link 
          href="/marketplace"
          className="inline-flex items-center gap-2 font-bold text-ink hover:underline uppercase tracking-wide text-sm"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Marketplace
        </Link>
        
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex gap-2 flex-wrap">
            {asset.tags && asset.tags.length > 0 ? (
               asset.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm text-ink">
                    {tag.icon && <span className="material-symbols-outlined text-[14px]">{tag.icon}</span>}
                    {tag.label}
                  </span>
               ))
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm text-ink">
                Dataset
              </span>
            )}
          </div>
          <h2 className="text-4xl font-black leading-tight text-ink drop-shadow-sm">{asset.title}</h2>
          <p className="text-sm font-bold text-ink opacity-90">Updated: {asset.updatedAt || 'Recently'}</p>
        </div>
        
        <hr className="border-t-2 border-ink border-dashed opacity-20" />
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-400 uppercase">Storage Size</span>
            <span className="text-xl font-black text-ink">{asset.storageSize || '2.4 GB'}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-400 uppercase">Quality Score</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-primary">{asset.qualityScore || '98'}</span>
              <span className="text-xs font-bold text-gray-400">/100</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-400 uppercase">Format</span>
            <span className="text-xl font-black text-gray-300">{asset.formats?.join(' / ') || 'JSON / CSV'}</span>
          </div>
        </div>
        
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-widest text-ink opacity-80">Current Price</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter text-ink">{asset.price} {asset.currency}</span>
            </div>
            <span className="text-sm font-bold text-ink opacity-80">≈ ${(asset.price * 1.25).toFixed(2)} USD</span>
          </div>
          <button 
             onClick={() => setIsBuyModalOpen(true)}
             className="group relative w-full rounded-xl border-2 border-transparent bg-ink py-4 text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-black hover:shadow-xl"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-2xl group-hover:animate-bounce">shopping_cart_checkout</span>
              <span className="text-xl font-black uppercase tracking-wide">Buy Now</span>
            </div>
          </button>
          <p className="text-center text-xs font-bold text-ink opacity-60">Secured by Walrus Protocol</p>
        </div>
      </div>

      {/* RIGHT PANEL - Content */}
      <div className="flex-1 bg-white overflow-y-auto relative">
        <div className="absolute right-0 top-0 h-64 w-64 bg-gray-50 rounded-bl-[100px] -z-0"></div>
        <div className="max-w-5xl mx-auto p-6 lg:p-12 flex flex-col gap-12 relative z-10">
          
          {/* Hero Image */}
          <section className="flex flex-col gap-6">
            <div className="relative w-full aspect-[2/1] rounded-2xl border-2 border-ink bg-gray-100 overflow-hidden shadow-hard-lg group">
              <div 
                className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700" 
                style={{ backgroundImage: `url('${asset.imageUrl}')` }}
              ></div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                   onClick={handlePreviewClick}
                   className="h-10 px-4 bg-white border-2 border-ink rounded-lg flex items-center justify-center gap-2 hover:bg-accent-lime transition-colors shadow-hard-sm text-ink"
                >
                  <span className="material-symbols-outlined text-[18px] text-ink">visibility</span>
                  <span className="font-bold text-xs uppercase">Preview</span>
                </button>
                <button className="h-10 w-10 bg-white border-2 border-ink rounded-lg flex items-center justify-center hover:bg-accent-lime transition-colors shadow-hard-sm">
                  <span className="material-symbols-outlined">fullscreen</span>
                </button>
                <button 
                  onClick={handleDownloadClick}
                  className="h-10 w-10 bg-white border-2 border-ink rounded-lg flex items-center justify-center hover:bg-accent-lime transition-colors shadow-hard-sm"
                >
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>
          </section>

          {/* Details Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* About */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b-2 border-ink pb-4">
                <span className="material-symbols-outlined text-3xl">info</span>
                <h3 className="text-2xl font-black uppercase">About this Data</h3>
              </div>
              <div className="prose prose-lg text-ink font-medium">
                 {asset.fullDescription ? (
                    asset.fullDescription.split('\n\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)
                 ) : (
                    <p className="mb-4">{asset.description}</p>
                 )}
                 {asset.features && (
                    <ul className="list-disc list-inside space-y-2 ml-2 text-sm font-bold text-gray-600">
                      {asset.features.map((feature, i) => <li key={i}>{feature}</li>)}
                    </ul>
                 )}
              </div>
            </div>

            {/* Sidebar Widgets (Version & Publisher) */}
            <div className="flex flex-col gap-4">
              {/* Version History */}
              <div className="rounded-xl border-2 border-ink bg-white p-5 shadow-hard-sm">
                <h4 className="font-black text-lg mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">history</span> Version History
                </h4>
                <div className="flex flex-col gap-3">
                  {asset.versionHistory ? asset.versionHistory.map((ver, i) => (
                    <React.Fragment key={i}>
                      <div className={`flex justify-between items-center text-sm ${!ver.isCurrent ? 'opacity-60' : ''}`}>
                         <span className="font-bold">{ver.version} {ver.isCurrent && '(Current)'}</span>
                         <span className="text-gray-500">{ver.date}</span>
                      </div>
                      {i < asset.versionHistory!.length - 1 && <div className="w-full h-px bg-gray-200"></div>}
                    </React.Fragment>
                  )) : (
                     <p className="text-sm text-gray-500 italic">No version history available.</p>
                  )}
                </div>
              </div>

              {/* Publisher */}
              <div className="rounded-xl border-2 border-ink bg-accent-orange p-5 shadow-hard-sm">
                <h4 className="font-black text-lg mb-2 text-white">Publisher</h4>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white border-2 border-ink rounded-full flex items-center justify-center font-bold">
                     {asset.publisher?.initials || '??'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold leading-none text-white">{asset.publisher?.name || 'Unknown DAO'}</span>
                    <span className="text-xs font-bold text-white/80 mt-1">
                      {asset.publisher?.verified ? 'Verified Publisher' : 'Community Publisher'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="flex flex-col gap-6 pt-6">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-sm font-bold">
                  {asset.reviews ? asset.reviews.length : 0}
                </div>
                <h3 className="text-2xl font-black uppercase text-gray-200">Community Reviews</h3>
              </div>
              <button className="text-sm font-bold text-primary hover:text-ink hover:underline">Write a Review</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {asset.reviews ? asset.reviews.map(review => (
                  <div key={review.id} className="rounded-xl border-2 border-ink bg-white p-6 shadow-hard-sm hover:shadow-hard transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {review.avatar ? (
                          <div 
                             className="h-10 w-10 rounded-full border-2 border-ink bg-cover bg-center" 
                             style={{ backgroundImage: `url('${review.avatar}')` }}
                          ></div>
                        ) : (
                          <div className={`h-10 w-10 rounded-full border-2 border-ink flex items-center justify-center font-bold text-ink shadow-sm ${review.bgColor || 'bg-gray-300'}`}>
                             {review.initials}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{review.user}</span>
                          <div className="flex text-accent-orange">
                             {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined text-[16px] ${i < Math.floor(review.rating) ? 'fill-current' : 'text-gray-300'}`}>star</span>
                             ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-400">{review.date}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
               )) : (
                  <p className="text-gray-500 font-medium">No reviews yet.</p>
               )}
            </div>
          </section>

          <footer className="mt-10 border-t-2 border-ink pt-8 flex items-center justify-between opacity-60 pb-8">
            <p className="text-sm font-bold">Data Asset ID: #{asset.id}-GEN</p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined cursor-pointer hover:opacity-100">flag</span>
              <span className="material-symbols-outlined cursor-pointer hover:opacity-100">share</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
           <div className="w-full max-w-md bg-white rounded-2xl border-2 border-ink shadow-hard-lg p-6 relative">
              <button
                onClick={() => setIsBuyModalOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-ink">close</span>
              </button>

              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent-lime border-2 border-ink flex items-center justify-center shadow-hard-sm">
                   <span className="material-symbols-outlined text-2xl text-ink">shopping_cart_checkout</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-ink uppercase leading-none mb-2">Confirm Purchase</h3>
                  <p className="text-gray-600 font-medium">
                    You are about to purchase <span className="font-bold text-ink">{asset.title}</span>.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-500 uppercase">Total</span>
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-ink">{asset.price}</span>
                      <span className="text-sm font-bold text-gray-500">{asset.currency}</span>
                   </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => setIsBuyModalOpen(false)}
                    className="flex-1 h-12 rounded-xl border-2 border-ink bg-white text-ink font-bold hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPurchase}
                    className="flex-1 h-12 rounded-xl border-2 border-ink bg-primary text-ink font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    Confirm
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Decryption Animation Overlay */}
      {processingMode && (
         <div 
           ref={overlayRef}
           className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink/95 backdrop-blur-md transition-colors opacity-0"
         >
            {/* The Decryption Seal */}
            <div 
              ref={sealRef}
              className="relative flex h-64 w-64 items-center justify-center rounded-full border-[6px] border-white bg-ink shadow-2xl"
            >
               {/* Animated Rings */}
               <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/30 animate-spin" style={{ animationDuration: '10s' }}></div>
               <div className="absolute inset-4 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></div>
               
               {/* Icon */}
               <span ref={iconRef} className="material-symbols-outlined !text-[120px] text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">lock</span>
               
               {/* Decorative Text Ring */}
               <svg className="absolute inset-0 h-full w-full animate-spin" style={{ animationDuration: '20s' }} viewBox="0 0 100 100" width="100" height="100">
                  <path id="circlePath2" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
                  <text fill="white" fontSize="8" fontWeight="bold" letterSpacing="3">
                     <textPath ref={pathRef} href="#circlePath2" startOffset="0%">
                        {processingMode === 'preview' ? 'SECURE PREVIEW • REMOTE DECRYPTION •' : 'SECURE DECRYPTION • WALRUS PROTOCOL •'}
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
               Accessing decentralized storage
            </p>

            {/* Progress Bar */}
            <div className="mt-8 h-4 w-64 rounded-full border-2 border-white bg-gray-800 p-1 overflow-hidden">
               <div 
                 ref={progressRef} 
                 className="h-full w-0 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
               ></div>
            </div>

            {/* Tech Decor */}
            <div className="absolute top-10 right-10 flex flex-col items-end gap-1 opacity-40">
               <span className="font-mono text-xs text-white">KEY_ID: 0x99...2A</span>
               <span className="font-mono text-xs text-white">CIPHER: AES-256-GCM</span>
            </div>
         </div>
      )}
    </div>
  );
}
