'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface DecryptionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
  blobId: string;
  datasetName: string;
  previewBytes?: number;
  requesterAddress?: string;
  mimeType?: string;
  fileName?: string;
}

type Phase = 'uploading' | 'processing' | 'decrypting' | 'revealed' | 'error';

export default function DecryptionPreviewModal({
  isOpen,
  onClose,
  datasetId,
  blobId,
  datasetName,
  previewBytes = 100,
  requesterAddress = '',
  mimeType = 'application/octet-stream',
  fileName = 'download',
}: DecryptionPreviewModalProps) {
  const [phase, setPhase] = useState<Phase>('uploading');
  const [previewData, setPreviewData] = useState<string>('');
  const [revealedText, setRevealedText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const cipherTextRef = useRef<HTMLDivElement>(null);
  const revealedRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const fetchInitiatedRef = useRef(false);

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

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhase('uploading');
      setPreviewData('');
      setRevealedText('');
      setError('');
      setUploadProgress(0);
      fetchInitiatedRef.current = false; // Reset fetch flag
    }
  }, [isOpen]);

  // Entry animation and fetch data
  useEffect(() => {
    if (!isOpen) return;

    // Entry animation
    const tl = gsap.timeline();
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3 })
      .fromTo(modalRef.current, 
        { scale: 0.9, opacity: 0, y: 20 }, 
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      );

    // Start upload phase
    setPhase('uploading');
    
    // Simulate upload progress - slower
    let progress = 0;
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 8 + 2; // Slower: 2-10% each step
      if (progress >= 100) {
        progress = 100;
        clearInterval(uploadInterval);
        setUploadProgress(100);
        // Move to processing phase
        setTimeout(() => setPhase('processing'), 500);
      } else {
        setUploadProgress(Math.min(progress, 95));
      }
    }, 400); // Slower: 400ms intervals

    return () => {
      tl.kill();
      clearInterval(uploadInterval);
    };
  }, [isOpen]);

  // Processing phase - fetch from Nautilus via API route (avoid CORS)
  useEffect(() => {
    if (!isOpen || phase !== 'processing') return;
    if (fetchInitiatedRef.current) {
      console.log('⚠️ Fetch already initiated, skipping');
      return;
    }
    
    fetchInitiatedRef.current = true;
    console.log('🔄 Starting fetch process...');

    const controller = new AbortController();

    const fetchPreview = async () => {
      try {
        const payload = { 
          dataset_id: datasetId, 
          blob_id: blobId,
          preview_bytes: previewBytes,
          requester_address: requesterAddress,
          mime_type: mimeType,
          file_name: fileName,
        };
        
        console.log('🚀 Calling Nautilus via API route');
        console.log('🚀 Payload:', JSON.stringify({ payload }, null, 2));
        
        // Use API route to avoid CORS issues
        const res = await fetch('/api/debug/nautilus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        
        const data = await res.json();
        console.log('📥 Nautilus response:', JSON.stringify(data, null, 2));
        console.log('📥 Response keys:', Object.keys(data));
        console.log('📥 data.response:', data?.response);
        console.log('📥 data.response.data:', data?.response?.data);
        console.log('📥 preview_data exists:', !!data?.response?.data?.preview_data);
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch preview');
        }
        
        // Handle response structure from Nautilus
        const previewDataBase64 = data?.response?.data?.preview_data;
        if (previewDataBase64) {
          const decoded = decodeBase64(previewDataBase64);
          console.log('✅ Decoded preview data length:', decoded.length);
          console.log('✅ First 200 chars:', decoded.substring(0, 200));
          setPreviewData(decoded);
          setTimeout(() => setPhase('decrypting'), 500);
        } else {
          console.error('❌ No preview_data in response. Full response:', data);
          throw new Error('No preview data available');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('🛑 Fetch aborted');
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to decrypt';
        console.error('❌ Fetch error:', message);
        setError(message);
        setPhase('error');
      }
    };

    const timer = setTimeout(fetchPreview, 2500);
    
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, phase, datasetId, blobId, previewBytes, requesterAddress, mimeType, fileName]);

  // Decryption animation
  useEffect(() => {
    if (!isOpen || phase !== 'decrypting' || !previewData) return;

    // Clean BOM and split into lines, limit to 20 lines
    const cleanData = previewData.replace(/^\ufeff/, '');
    const lines = cleanData.split('\n').slice(0, 20);
    const totalChars = lines.join('\n').length;
    let currentIndex = 0;

    if (cipherTextRef.current) {
      cipherTextRef.current.innerHTML = lines.map(line => 
        `<div class="cipher-line">${generateCipherText(Math.min(line.length, 100) || 20)}</div>`
      ).join('');
    }

    gsap.to(progressRef.current, { width: '100%', duration: 3, ease: 'power1.inOut' });
    gsap.to(scanLineRef.current, { top: '100%', duration: 3, ease: 'power1.inOut' });

    const revealInterval = setInterval(() => {
      if (currentIndex >= totalChars) {
        clearInterval(revealInterval);
        setTimeout(() => setPhase('revealed'), 800);
        return;
      }

      const revealed = lines.join('\n').slice(0, currentIndex + 1);
      setRevealedText(revealed);

      if (cipherTextRef.current) {
        const cipherLines = lines.map((line, lineIdx) => {
          const lineStart = lines.slice(0, lineIdx).join('\n').length + (lineIdx > 0 ? 1 : 0);
          const lineEnd = lineStart + line.length;
          
          if (currentIndex >= lineEnd) {
            return `<div class="cipher-line opacity-0">${line}</div>`;
          } else if (currentIndex >= lineStart) {
            const revealedPart = line.slice(0, currentIndex - lineStart + 1);
            const cipherPart = generateCipherText(Math.min(line.length - revealedPart.length, 100));
            return `<div class="cipher-line"><span class="opacity-0">${revealedPart}</span><span class="text-accent-lime/40">${cipherPart}</span></div>`;
          } else {
            return `<div class="cipher-line text-accent-lime/40">${generateCipherText(Math.min(line.length, 100) || 20)}</div>`;
          }
        });
        cipherTextRef.current.innerHTML = cipherLines.join('');
      }

      currentIndex += Math.floor(Math.random() * 5) + 3; // 3-7 chars at a time (faster)
    }, 15); // 15ms intervals (faster)

    return () => clearInterval(revealInterval);
  }, [isOpen, phase, previewData]);

  useEffect(() => {
    if (phase !== 'revealed') return;
    gsap.fromTo(revealedRef.current, { opacity: 0.8 }, { opacity: 1, duration: 0.5 });
  }, [phase]);

  if (!isOpen) return null;

  const getPhaseInfo = () => {
    switch (phase) {
      case 'uploading':
        return {
          icon: 'cloud_upload',
          title: 'Sending Dataset ID and BlobID to Nautilus compute in TEE',
          subtitle: 'Connecting to Nautilus TEE server...',
          color: 'text-blue-400',
        };
      case 'processing':
        return {
          icon: 'memory',
          title: 'Processing in TEE',
          subtitle: 'Nautilus server decrypting data in secure enclave...',
          color: 'text-purple-400',
        };
      case 'decrypting':
        return {
          icon: 'lock_open',
          title: 'Receiving Decrypted Data',
          subtitle: 'Rendering preview from TEE response...',
          color: 'text-accent-lime',
        };
      case 'revealed':
        return {
          icon: 'visibility',
          title: 'Preview Ready',
          subtitle: 'Partial data decrypted by Nautilus TEE',
          color: 'text-accent-lime',
        };
      case 'error':
        return {
          icon: 'error',
          title: 'Decryption Failed',
          subtitle: error,
          color: 'text-red-400',
        };
    }
  };

  const phaseInfo = getPhaseInfo();

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
            <div className={`h-10 w-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center ${phaseInfo.color}`}>
              <span className={`material-symbols-outlined ${phase === 'uploading' || phase === 'processing' ? 'animate-pulse' : ''}`}>
                {phaseInfo.icon}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-white">{datasetName}</h3>
              <p className={`text-xs font-mono ${phaseInfo.color}`}>{phaseInfo.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-gray-800 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="relative h-[400px] overflow-hidden bg-gray-950">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: 'linear-gradient(rgba(204,255,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Upload/Processing Phase UI */}
          {(phase === 'uploading' || phase === 'processing') && (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
              {/* Server Animation */}
              <div className="relative">
                {/* TEE Server Icon */}
                <div className="relative h-32 w-32 rounded-2xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                  <span className={`material-symbols-outlined text-6xl ${phaseInfo.color}`}>
                    {phase === 'uploading' ? 'dns' : 'security'}
                  </span>
                  
                  {/* Animated rings */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute -inset-2 rounded-2xl border border-purple-500/20 animate-pulse" />
                  
                  {/* Data packets animation for upload */}
                  {phase === 'uploading' && (
                    <>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col gap-1">
                        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                        <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                      </div>
                    </>
                  )}
                  
                  {/* Processing spinner */}
                  {phase === 'processing' && (
                    <div className="absolute inset-0 rounded-2xl border-t-2 border-purple-500 animate-spin" style={{ animationDuration: '1s' }} />
                  )}
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center">
                <h4 className={`text-xl font-bold ${phaseInfo.color}`}>{phaseInfo.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{phaseInfo.subtitle}</p>
              </div>

              {/* Progress Bar for Upload */}
              {phase === 'uploading' && (
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Uploading request...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Processing Info */}
              {phase === 'processing' && (
                <div className="flex flex-col gap-2 text-xs font-mono text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" />
                    <span>Verifying TEE attestation...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                    <span>Decrypting with Seal Protocol...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                    <span>Preparing preview response...</span>
                  </div>
                </div>
              )}

              {/* Server Info */}
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-4">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Nautilus TEE Server
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Secure Enclave
                </span>
              </div>
            </div>
          )}

          {/* Decryption/Revealed Phase UI */}
          {(phase === 'decrypting' || phase === 'revealed') && (
            <>
              {/* Scan line effect */}
              {phase === 'decrypting' && (
                <div 
                  ref={scanLineRef}
                  className="absolute left-0 right-0 h-px bg-accent-lime shadow-[0_0_10px_2px_rgba(204,255,0,0.5)] z-20"
                  style={{ top: 0 }}
                />
              )}

              {/* Progress bar */}
              {phase === 'decrypting' && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
                  <div ref={progressRef} className="h-full w-0 bg-accent-lime" />
                </div>
              )}

              <div className="relative h-full p-6 overflow-auto font-mono text-sm">
                <div 
                  ref={cipherTextRef}
                  className="absolute inset-6 text-accent-lime/30 whitespace-pre-wrap break-all leading-relaxed pointer-events-none"
                />
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
            </>
          )}

          {/* Error Phase UI */}
          {phase === 'error' && (
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
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">memory</span>
              Nautilus TEE
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
