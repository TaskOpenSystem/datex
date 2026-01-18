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

type Phase = 'uploading' | 'processing' | 'decrypting' | 'revealed' | 'error';

export default function DecryptionPreviewModal({
  isOpen,
  onClose,
  datasetId,
  blobId,
  datasetName,
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

  const generateCipherText = (length: number): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const decodeBase64 = (base64: string): string => {
    try {
      // Decode base64 to binary string, then convert to UTF-8
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decode as UTF-8
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const decoded = decoder.decode(bytes);
      
      // Check if it's binary data - look for replacement character (�) which indicates invalid UTF-8
      // Also check for null bytes and other control characters
      const replacementChars = (decoded.match(/\uFFFD/g) || []).length;
      const nullBytes = (decoded.match(/\x00/g) || []).length;
      
      // If too many replacement chars or null bytes, it's likely binary
      if (replacementChars > decoded.length * 0.05 || nullBytes > 5) {
        return '[Binary data - cannot display as text]';
      }
      
      // Clean up any remaining control characters except newline, tab, carriage return
      const cleaned = decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
      
      return cleaned;
    } catch {
      return base64;
    }
  };

  // Format CSV data as a nice table-like display
  const formatPreviewData = (data: string): { formatted: string; type: 'csv' | 'json' | 'text' } => {
    if (!data || data.startsWith('[Binary')) return { formatted: data, type: 'text' };
    
    const trimmed = data.trim();
    
    // Check if it's JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return { formatted: JSON.stringify(parsed, null, 2), type: 'json' };
      } catch {
        // Not valid JSON, continue checking
      }
    }
    
    const lines = data.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { formatted: data, type: 'text' };
    
    // Check if it looks like CSV (has commas and consistent column count)
    const firstLineCommas = (lines[0].match(/,/g) || []).length;
    const isCSV = firstLineCommas > 0 && lines.slice(0, 5).every(line => {
      const commas = (line.match(/,/g) || []).length;
      return Math.abs(commas - firstLineCommas) <= 1; // Allow 1 comma difference
    });
    
    if (isCSV) {
      return { formatted: data, type: 'csv' };
    }
    
    // Plain text
    return { formatted: lines.slice(0, 20).join('\n'), type: 'text' };
  };

  // Parse CSV to rows
  const parseCSV = (data: string): string[][] => {
    const lines = data.split('\n').filter(line => line.trim());
    return lines.slice(0, 15).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const [dataType, setDataType] = useState<'csv' | 'json' | 'text'>('text');
  const [formattedData, setFormattedData] = useState<string>('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPhase('uploading');
      setPreviewData('');
      setFormattedData('');
      setDataType('text');
      setRevealedText('');
      setError('');
      setUploadProgress(0);
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

    const fetchPreview = async () => {
      try {
        const res = await fetch('/api/debug/nautilus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dataset_id: datasetId, 
            blob_id: blobId 
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch preview');
        }
        
        if (data?.response?.data?.preview_data) {
          const decoded = decodeBase64(data.response.data.preview_data);
          const { formatted, type } = formatPreviewData(decoded);
          setPreviewData(decoded);
          setFormattedData(formatted);
          setDataType(type);
          setTimeout(() => setPhase('decrypting'), 500);
        } else {
          throw new Error('No preview data available');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to decrypt';
        setError(message);
        setPhase('error');
      }
    };

    const timer = setTimeout(fetchPreview, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, phase, datasetId, blobId]);

  // Decryption animation
  useEffect(() => {
    if (!isOpen || phase !== 'decrypting' || !previewData) return;

    const lines = previewData.split('\n').slice(0, 15);
    const totalChars = lines.join('\n').length;
    let currentIndex = 0;

    if (cipherTextRef.current) {
      cipherTextRef.current.innerHTML = lines.map(line => 
        `<div class="cipher-line">${generateCipherText(line.length || 20)}</div>`
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
            const cipherPart = generateCipherText(line.length - revealedPart.length);
            return `<div class="cipher-line"><span class="opacity-0">${revealedPart}</span><span class="text-accent-lime/40">${cipherPart}</span></div>`;
          } else {
            return `<div class="cipher-line text-accent-lime/40">${generateCipherText(line.length || 20)}</div>`;
          }
        });
        cipherTextRef.current.innerHTML = cipherLines.join('');
      }

      currentIndex += Math.floor(Math.random() * 3) + 1; // 1-3 chars at a time
    }, 20); // 20ms intervals

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
          title: 'Uploading to TEE Server',
          subtitle: 'Sending encrypted data to Nautilus TEE...',
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

              {/* Decrypting animation */}
              {phase === 'decrypting' && (
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
                    <span className="inline-block w-2 h-4 bg-accent-lime ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Revealed - formatted display */}
              {phase === 'revealed' && (
                <div className="relative h-full p-6 overflow-auto">
                  {/* Data type badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      dataType === 'json' ? 'bg-yellow-500/20 text-yellow-400' :
                      dataType === 'csv' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {dataType}
                    </span>
                  </div>

                  {/* CSV Table */}
                  {dataType === 'csv' && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr>
                            {parseCSV(previewData)[0]?.map((header, idx) => (
                              <th key={idx} className="border border-accent-lime/30 bg-accent-lime/10 px-3 py-2 text-left text-accent-lime font-bold whitespace-nowrap">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parseCSV(previewData).slice(1).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-accent-lime/5">
                              {row.map((cell, cellIdx) => (
                                <td key={cellIdx} className="border border-gray-700 px-3 py-2 text-gray-300 whitespace-nowrap">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* JSON formatted */}
                  {dataType === 'json' && (
                    <pre className="font-mono text-sm text-accent-lime whitespace-pre-wrap leading-relaxed">
                      {formattedData.split('\n').map((line, idx) => {
                        // Syntax highlighting for JSON
                        const highlighted = line
                          .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
                          .replace(/: "([^"]+)"/g, ': <span class="text-yellow-400">"$1"</span>')
                          .replace(/: (\d+)/g, ': <span class="text-blue-400">$1</span>')
                          .replace(/: (true|false|null)/g, ': <span class="text-red-400">$1</span>');
                        return (
                          <div key={idx} dangerouslySetInnerHTML={{ __html: highlighted }} />
                        );
                      })}
                    </pre>
                  )}

                  {/* Plain text */}
                  {dataType === 'text' && (
                    <div 
                      ref={revealedRef}
                      className="font-mono text-sm text-accent-lime whitespace-pre-wrap break-all leading-relaxed"
                    >
                      {formattedData}
                    </div>
                  )}
                </div>
              )}
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
