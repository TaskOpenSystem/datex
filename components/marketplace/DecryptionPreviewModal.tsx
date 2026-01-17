'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface DecryptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  blobId: string;
  datasetName: string;
}

export default function DecryptionPreviewModal({
  isOpen,
  onClose,
  datasetId,
  blobId,
  datasetName,
}: DecryptionPreviewModalProps) {
  const [phase, setPhase] = useState<'decrypting' | 'revealed' | 'error'>('decrypting');
  const [previewData, setPreviewData] = useState<string>('');
  const [revealedText, setRevealedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cipherTextRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);

  const generateCipherText = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const decodeBase64 = (base64: string): string => {
    try {
      return atob(base64);
    } catch {
      return base64;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPhase('decrypting');
      setPreviewData('');
      setRevealedText('');
      setError('');
      return;
    }

    // Fetch preview data
    const fetchPreview = async () => {
      try {
        const res = await fetch('/api/debug/nautilus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataset_id: datasetId, blob_id: blobId }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch preview');
        }
        
        if (data?.response?.data?.preview_data) {
          const decoded = decodeBase64(data.response.data.preview_data);
          setPreviewData(decoded);
        } else {
          throw new Error('No preview data available');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to decrypt');
        setPhase('error');
      }
    };

    fetchPreview();

    // Entry animation
    const tl = gsap.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(modalRef.current, 
        { scale: 0.9, opacity: 0, y: 20 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      );

    return () => { tl.kill(); };
  }, [isOpen, datasetId, blobId]);

  // Decryption animation
  useEffect(() => {
    if (!isOpen || phase !== 'decrypting' || !previewData) return;

    const lines = previewData.split('\n').slice(0, 15); // Limit to 15 lines
    const totalChars = lines.join('\n').length;
    let currentIndex = 0;

    // Initialize with cipher text
    if (cipherTextRef.current) {
      cipherTextRef.current.innerHTML = lines.map(line => 
        `<div class="cipher-line">${generateCipherText(line.length || 20)}</div>`
      ).join('');
    }

    // Progress bar animation
    gsap.to(progressRef.current, {
      width: '100%',
      duration: 3,
      ease: 'power1.inOut',
    });

    // Scan line animation
    gsap.to(scanLineRef.current, {
      top: '100%',
      duration: 3,
      ease: 'power1.inOut',
      repeat: 0,
    });

    // Reveal text character by character
    const revealInterval = setInterval(() => {
      if (currentIndex >= totalChars) {
        clearInterval(revealInterval);
        setTimeout(() => setPhase('revealed'), 500);
        return;
      }

      const revealed = lines.join('\n').slice(0, currentIndex + 1);
      setRevealedText(revealed);

      // Update cipher text with remaining encrypted chars
      if (cipherTextRef.current) {
        const cipherLines = lines.map((line, lineIdx) => {
          const lineStart = lines.slice(0, lineIdx).join('\n').length + (lineIdx > 0 ? 1 : 0);
          const lineEnd = lineStart + line.length;
          
          if (currentIndex >= lineEnd) {
            return `<div class="cipher-line opacity-0">${line}</div>`;
          } else if (currentIndex >= lineStart) {
            const revealedPart = line.slice(0, currentIndex - lineStart + 1);
            const cipherPart = generateCipherText(line.length - revealedPart.length);
            return `<div class="cipher-line"><span class="opacity-0">${revealedPart}</span><span class="text-accent-lime/40">${cipherPart}</span></div>`;
          } else {
            return `<div class="cipher-line text-accent-lime/40">${generateCipherText(line.length || 20)}</div>`;
          }
        });
        cipherTextRef.current.innerHTML = cipherLines.join('');
      }

      currentIndex += Math.floor(Math.random() * 3) + 1; // Random speed variation
    }, 20);

    return () => clearInterval(revealInterval);
  }, [isOpen, phase, previewData]);

  // Revealed phase animation
  useEffect(() => {
    if (phase !== 'revealed') return;

    gsap.fromTo(revealedRef.current,
      { opacity: 0.8 },
      { opacity: 1, duration: 0.5 }
    );
  }, [phase]);

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-md p-4"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-3xl bg-gray-900 rounded-2xl border-2 border-accent-lime/30 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent-lime/20 border border-accent-lime/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-accent-lime">
                {phase === 'decrypting' ? 'lock_open' : phase === 'revealed' ? 'visibility' : 'error'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white">{datasetName}</h3>
              <p className="text-xs text-gray-500 font-mono">
                {phase === 'decrypting' ? 'Decrypting preview...' : phase === 'revealed' ? 'Preview ready' : 'Decryption failed'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>

        {/* Progress bar */}
        {phase === 'decrypting' && (
          <div className="h-1 bg-gray-800 relative overflow-hidden">
            <div 
              ref={progressRef}
              className="h-full w-0 bg-gradient-to-r from-accent-lime to-primary"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative h-[400px] overflow-hidden bg-gray-950">
          {/* Scan line effect */}
          {phase === 'decrypting' && (
            <div 
              ref={scanLineRef}
              className="absolute left-0 right-0 h-px bg-accent-lime shadow-[0_0_10px_2px_rgba(204,255,0,0.5)] z-20"
              style={{ top: 0 }}
            />
          )}

          {/* Grid background */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(rgba(204,255,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          {phase === 'error' ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <span className="material-symbols-outlined text-6xl text-red-500">error</span>
              <p className="text-red-400 font-bold">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="relative h-full p-6 overflow-auto font-mono text-sm">
              {/* Cipher text layer */}
              <div 
                ref={cipherTextRef}
                className="absolute inset-6 text-accent-lime/30 whitespace-pre-wrap break-all leading-relaxed pointer-events-none"
              />
              
              {/* Revealed text layer */}
              <div 
                ref={revealedRef}
                className="relative z-10 text-accent-lime whitespace-pre-wrap break-all leading-relaxed"
              >
                {revealedText}
                {phase === 'decrypting' && (
                  <span className="inline-block w-2 h-4 bg-accent-lime ml-0.5 animate-pulse" />
                )}
              </div>
            </div>
          )}

          {/* Decorative corners */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-accent-lime/30" />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-accent-lime/30" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-accent-lime/30" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-accent-lime/30" />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/80 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">security</span>
              Seal Protocol
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">cloud</span>
              Walrus Storage
            </span>
          </div>
          {phase === 'revealed' && (
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-accent-lime text-ink font-bold rounded-lg hover:bg-accent-lime/90 transition-colors text-sm"
            >
              Close Preview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
