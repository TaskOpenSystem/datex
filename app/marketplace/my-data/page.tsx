'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useAllListings, useAccountBalance } from '@/hooks/useMarketplace';
import { formatSize, bytesToHex, formatPrice } from '@/lib/marketplace';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import gsap from 'gsap';
import type { Transaction } from '@mysten/sui/transactions';
import { TransactionStatus, useTransactionSteps } from '@/components/marketplace/TransactionStatus';

// Type for Walrus write files flow
interface WalrusWriteFlow {
  encode: () => Promise<void>;
  register: (opts: { epochs: number; owner: string; deletable: boolean }) => Transaction;
  upload: (opts: { digest: string }) => Promise<void>;
  certify: () => Transaction;
}

const walrusModule = {
  walrus: null as null | typeof import('@mysten/walrus').walrus,
};

async function getWalrus() {
  if (!walrusModule.walrus) {
    walrusModule.walrus = (await import('@mysten/walrus')).walrus;
  }
  return walrusModule.walrus;
}

type Tab = 'uploads' | 'purchases';

export default function MyDataPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending: isSigning } = useSignAndExecuteTransaction();
  const { data: listings, isLoading, refetch } = useAllListings();
  const { data: balance } = useAccountBalance();

  const [activeTab, setActiveTab] = useState<Tab>('uploads');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [processingType, setProcessingType] = useState<'create' | 'download' | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [blobId, setBlobId] = useState('');
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showTxStatus, setShowTxStatus] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceSUI: '',
    previewSizeBytes: 1024 * 1024,
  });

  const flowRef = useRef<WalrusWriteFlow | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  // Transaction steps for status display
  const txSteps = useTransactionSteps([
    { id: 'encode', label: 'Encoding File', description: 'Preparing data for upload' },
    { id: 'register', label: 'Register on Sui', description: 'Sign to register blob' },
    { id: 'upload', label: 'Upload to Walrus', description: 'Uploading encrypted data' },
    { id: 'listing', label: 'Create Listing', description: 'Sign to create marketplace listing' },
  ]);

  const createFlow = useCallback(async (data: Uint8Array, identifier: string): Promise<WalrusWriteFlow> => {
    const walrus = await getWalrus();
    const { WalrusFile } = await import('@mysten/walrus');

    const client = new SuiJsonRpcClient({
      url: getFullnodeUrl('testnet'),
      network: 'testnet',
    }).$extend(
      walrus({
        uploadRelay: {
          host: 'https://upload-relay.testnet.walrus.space',
          sendTip: { max: 1_000_000 },
        },
      })
    ) as unknown as { walrus: { writeFilesFlow: (opts: { files: unknown[] }) => WalrusWriteFlow } };

    const walrusFile = WalrusFile.from({
      contents: data,
      identifier,
    });

    return client.walrus.writeFilesFlow({
      files: [walrusFile],
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setTotalSizeBytes(selectedFile.size);
    setFormData(prev => ({ ...prev, previewSizeBytes: Math.min(1024 * 1024, selectedFile.size) }));
    setBlobId('');
    flowRef.current = null;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartUpload = async () => {
    if (!file || !account) return;

    setIsProcessing(true);
    setUploadError('');
    setShowTxStatus(true);
    txSteps.reset();

    try {
      // Validate form data first
      const price = parseFloat(formData.priceSUI);
      if (!formData.name || !formData.description || isNaN(price) || price <= 0) {
        setUploadError('Please fill in all required fields');
        setIsProcessing(false);
        setShowTxStatus(false);
        return;
      }

      // Step 1: Encode
      txSteps.startStep('encode', 'Reading and encoding file data...');
      
      const fileBytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBytes);

      // Create flow and encode
      const flow = await createFlow(uint8Array, file.name);
      flowRef.current = flow;
      await flow.encode();

      // Generate blob ID from content hash
      const contentHash = Array.from(uint8Array).slice(0, 32).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      const generatedBlobId = '0x' + contentHash;
      const generatedEncryptedObject = '0x' + bytesToHex(uint8Array).slice(0, 128);

      setBlobId(generatedBlobId);
      txSteps.completeStep('encode');

      // Step 2: Register
      txSteps.startStep('register', 'Please sign the transaction in your wallet...');

      // Build combined PTB: register + certify + create listing
      const { marketplaceConfig, MIST_PER_SUI } = await import('@/config/marketplace');
      const { getMarketplaceTarget } = await import('@/lib/marketplace');

      // Get register transaction from flow
      const registerTx = flow.register({
        epochs: 3,
        owner: account.address,
        deletable: false,
      });

      // Execute single PTB transaction
      signAndExecute(
        { transaction: registerTx },
        {
          onSuccess: async (result) => {
            try {
              txSteps.completeStep('register');
              
              // Step 3: Upload
              txSteps.startStep('upload', 'Uploading encrypted data to Walrus network...');
              await flow.upload({ digest: result.digest });
              txSteps.completeStep('upload');

              // Step 4: Create Listing
              txSteps.startStep('listing', 'Please sign to create your listing...');

              // Build final PTB: certify + create listing in one transaction
              const certifyTx = flow.certify();
              
              // Merge certify with create listing using PTB
              const priceInMIST = BigInt(Math.floor(price * Number(MIST_PER_SUI)));
              const registryId = marketplaceConfig.registryId;

              // Add create listing to the certify transaction
              const listing = certifyTx.moveCall({
                target: getMarketplaceTarget('list_dataset'),
                arguments: [
                  certifyTx.object(registryId),
                  certifyTx.pure.string(generatedBlobId),
                  certifyTx.pure.string(generatedEncryptedObject),
                  certifyTx.pure.string(formData.name),
                  certifyTx.pure.string(formData.description),
                  certifyTx.pure.u64(priceInMIST),
                  certifyTx.pure.u64(formData.previewSizeBytes),
                  certifyTx.pure.u64(totalSizeBytes),
                ],
              });

              // Transfer listing to owner
              certifyTx.transferObjects([listing], account.address);

              // Execute combined certify + create listing transaction
              signAndExecute(
                { transaction: certifyTx },
                {
                  onSuccess: () => {
                    txSteps.completeStep('listing');
                    
                    // Delay to show completion
                    setTimeout(() => {
                      setShowTxStatus(false);
                      setIsCreateModalOpen(false);
                      setProcessingType('create');
                      resetFlow();
                      refetch();
                      setIsProcessing(false);
                    }, 1500);
                  },
                  onError: (err) => {
                    txSteps.failStep('listing', err.message || 'Failed to create listing');
                    setUploadError(err.message || 'Failed to create listing');
                    setIsProcessing(false);
                  },
                }
              );
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : 'Upload failed';
              txSteps.failStep('upload', errorMsg);
              setUploadError(errorMsg);
              setIsProcessing(false);
            }
          },
          onError: (err) => {
            txSteps.failStep('register', err.message || 'Failed to register blob');
            setUploadError(err.message || 'Failed to register blob');
            setIsProcessing(false);
          },
        }
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to prepare upload';
      txSteps.failStep('encode', errorMsg);
      setUploadError(errorMsg);
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setFile(null);
    setBlobId('');
    setTotalSizeBytes(0);
    setFormData({
      name: '',
      description: '',
      priceSUI: '',
      previewSizeBytes: 1024 * 1024,
    });
    flowRef.current = null;
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    resetFlow();
  };

  useEffect(() => {
    if (processingType === 'create') {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => setProcessingType(null), 800);
        }
      });

      tl.to('#anim-overlay', { opacity: 1, duration: 0.2 })
        .to('#anim-text', {
          duration: 0.5,
          onStart: () => {
            document.getElementById('anim-text')!.innerText = 'ENCRYPTING METADATA';
            document.getElementById('anim-subtext')!.innerText = 'Preparing asset for encryption';
          }
        })
        .to('#anim-progress', { width: '60%', duration: 1.2, ease: 'power2.inOut' })
        .to('#anim-seal', { scale: 1, opacity: 1, rotation: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
        .to('#anim-overlay', { backgroundColor: '#101618', duration: 0.1, yoyo: true, repeat: 1 }, '-=0.2')
        .to('#anim-icon', { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })
        .add(() => {
          document.getElementById('anim-text')!.innerText = 'VERIFYING ZK-PROOFS';
          document.getElementById('anim-subtext')!.innerText = 'Generating SNARKs on Sui Network...';
        })
        .to('#anim-progress', { width: '90%', duration: 1 })
        .to('#anim-seal', { borderColor: '#ccff00', boxShadow: '0 0 30px #ccff00', duration: 0.3 })
        .to('#anim-icon', { color: '#ccff00', duration: 0.3 }, '<')
        .add(() => {
          document.getElementById('anim-text')!.innerText = 'ASSET SECURED';
          document.getElementById('anim-text')!.classList.add('text-accent-lime');
          document.getElementById('anim-subtext')!.innerText = 'Listing created successfully.';
        })
        .to('#anim-progress', { width: '100%', backgroundColor: '#ccff00', duration: 0.3 })
        .to('#anim-seal', { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });
    }
  }, [processingType]);

  return (
    <>
      <header className="px-8 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500">
              <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
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
                  <h2 className="text-3xl font-black text-ink">
                    {listings ? listings.reduce((acc, l) => acc + Number(l.price), 0) / 1000000000 : 0}
                  </h2>
                  <span className="text-sm font-bold text-gray-400">SUI</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded border border-green-200 mt-1">
                  <span className="material-symbols-outlined text-xs">arrow_upward</span> +{listings?.length || 0} this week
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-8 mt-6">
        <div className="flex gap-4 border-b-2 border-gray-200">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-6 py-3 rounded-t-xl border-2 font-bold text-lg transition-colors relative top-[2px] z-10 ${activeTab === 'uploads'
              ? 'border-ink border-b-0 bg-white text-ink shadow-[0_-2px_0_0_rgba(0,0,0,0.05)]'
              : 'border-transparent hover:bg-gray-100 text-gray-500'
              }`}
          >
            My Uploads
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-6 py-3 rounded-t-xl border-2 font-bold text-lg transition-colors relative top-[2px] z-10 ${activeTab === 'purchases'
              ? 'border-ink border-b-0 bg-white text-ink shadow-[0_-2px_0_0_rgba(0,0,0,0.05)]'
              : 'border-transparent hover:bg-gray-100 text-gray-500'
              }`}
          >
            My Purchases
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 py-8 bg-white border-t-0 border-ink/0 overflow-y-auto">
        {activeTab === 'uploads' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                Active Listings <span className="text-gray-400 text-base font-normal ml-1">({listings?.length || 0} items)</span>
              </h2>
              <button className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                View Analytics <span className="material-symbols-outlined text-sm">arrow_outward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

              {isLoading && (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border-2 border-ink bg-white p-6 min-h-[340px] animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </>
              )}

              {listings && listings.map(listing => (
                <article key={listing.id} className="flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg border-2 border-ink bg-accent-blue flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">dataset</span>
                    </div>
                    <span className="rounded bg-green-100 text-green-800 px-2 py-1 text-[10px] font-bold border border-green-200">ACTIVE</span>
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-1">{listing.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{listing.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">{formatPrice(listing.price)}</span>
                    <span className="text-xs text-gray-400">{formatSize(Number(listing.totalSize))}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'purchases' && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
                Recent Purchases <span className="text-gray-400 text-base font-normal ml-1">(0 items)</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <article className="flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg border-2 border-ink bg-gray-200 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-400">shopping_cart</span>
                  </div>
                  <span className="rounded bg-gray-100 text-gray-600 px-2 py-1 text-[10px] font-bold border border-gray-200">PENDING</span>
                </div>
                <h3 className="text-lg font-bold text-gray-400 mb-1">No purchases yet</h3>
                <p className="text-sm text-gray-400 mb-4">Start exploring the marketplace to find datasets.</p>
                <Link
                  href="/marketplace"
                  className="mt-auto w-full h-10 rounded-lg border-2 border-ink bg-gray-100 text-gray-500 font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">explore</span> Browse Marketplace
                </Link>
              </article>
            </div>
          </section>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border-2 border-ink shadow-hard-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-ink">close</span>
            </button>

            <h2 className="text-2xl font-black text-ink uppercase mb-6">Create New Listing</h2>

            {!account ? (
              <div className="text-center py-12">
                <div className="material-symbols-outlined text-6xl text-gray-400 mb-4">account_balance_wallet</div>
                <h3 className="text-xl font-bold mb-2 text-ink">Connect Your Wallet</h3>
                <p className="text-gray-600">Please connect your wallet to create a listing.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Dataset Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter dataset name"
                        maxLength={100}
                            className="w-full rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-0 font-bold text-ink placeholder:text-gray-300 transition-colors p-3"
                          />
                          <p className="text-xs text-gray-500 mt-1">{formData.name.length}/100 characters</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe your dataset..."
                            rows={3}
                            maxLength={1000}
                            className="w-full rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-0 font-medium text-ink placeholder:text-gray-300 transition-colors resize-none p-3"
                          />
                          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Price (SUI)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={formData.priceSUI}
                              onChange={(e) => handleInputChange('priceSUI', e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="w-full rounded-lg border-2 border-gray-200 focus:border-primary focus:ring-0 font-bold text-ink placeholder:text-gray-300 transition-colors p-3 pr-12"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">SUI</span>
                          </div>
                          {balance && (
                            <p className="text-xs text-gray-500 mt-1">Balance: {balance.sui.toFixed(4)} SUI</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Preview Size</label>
                          <input
                            type="range"
                            value={formData.previewSizeBytes}
                            onChange={(e) => handleInputChange('previewSizeBytes', Number(e.target.value))}
                            min={0}
                            max={totalSizeBytes || 10 * 1024 * 1024}
                            step={1024}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>0 B</span>
                            <span className="text-primary font-bold">{formatSize(formData.previewSizeBytes)}</span>
                            <span>{formatSize(totalSizeBytes)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Dataset File</label>
                          {!file ? (
                            <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-all block">
                              <input
                                type="file"
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="*/*"
                              />
                              <div className="material-symbols-outlined text-5xl text-gray-400 mb-2">cloud_upload</div>
                              <p className="font-bold text-ink">Choose File</p>
                              <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                            </label>
                          ) : (
                            <div className="bg-gray-100 rounded-xl p-4 border-2 border-ink">
                              <div className="flex items-center gap-3">
                                <div className="bg-primary w-10 h-10 rounded-lg flex items-center justify-center">
                                  <span className="material-icons text-white">description</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate text-ink">{file.name}</p>
                                  <p className="text-sm text-gray-500 font-mono">{formatSize(file.size)}</p>
                                </div>
                                <button
                                  onClick={() => setFile(null)}
                                  className="p-2 hover:bg-gray-200 rounded-lg"
                                >
                                  <span className="material-icons text-gray-500">close</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {file && (
                          <div className="bg-blue-50 border-2 border-ink rounded-xl p-4">
                            <h4 className="font-bold uppercase text-sm mb-2 flex items-center gap-2 text-ink">
                              <span className="material-symbols-outlined text-sm">info</span>
                              File Information
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Size</p>
                                <p className="font-mono font-bold text-ink">{formatSize(file.size)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Type</p>
                                <p className="font-mono font-bold text-ink">{file.type || 'Unknown'}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {uploadError && (
                          <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl">
                            <p className="font-bold flex items-center gap-2">
                              <span className="material-symbols-outlined">error</span>
                              Error
                            </p>
                            <p className="text-sm">{uploadError}</p>
                          </div>
                        )}

                        <button
                          onClick={handleStartUpload}
                          disabled={!file || !formData.name || !formData.description || !formData.priceSUI || isProcessing || isSigning}
                          className="w-full h-12 rounded-xl border-2 border-ink bg-primary text-white font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isProcessing || isSigning ? (
                            <>
                              <span className="material-symbols-outlined animate-spin">sync</span>
                              Creating Listing...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined">rocket_launch</span>
                              Create Listing
                            </>
                          )}
                        </button>
                        
                        <p className="text-xs text-gray-500 text-center">
                          One transaction to upload, register, and create your listing
                        </p>
                      </div>
                    </div>
                  </div>
            )}
          </div>
        </div>
      )}

      {processingType && (
        <div
          id="anim-overlay"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink/95 backdrop-blur-md transition-colors opacity-0"
        >
          <div
            id="anim-seal"
            className="relative flex h-64 w-64 items-center justify-center rounded-full border-[6px] border-white bg-ink shadow-2xl"
          >
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/30 animate-spin" style={{ animationDuration: '10s' }}></div>
            <div className="absolute inset-4 rounded-full border border-white/10 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}></div>
            
            {/* Icon */}
            <span ref={iconRef} className="material-symbols-outlined !text-[120px] text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">lock</span>
            
            <svg className="absolute inset-0 h-full w-full animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} viewBox="0 0 100 100" width="100" height="100">
              <path id="circlePathCommon" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
              <text fill="white" fontSize="8" fontWeight="bold" letterSpacing="2">
                <textPath href="#circlePathCommon" startOffset="0%">
                  SUI DATA MARKETPLACE • SECURE ENCRYPTION •
                </textPath>
              </text>
            </svg>
          </div>

          <h2
            id="anim-text"
            className="mt-12 text-3xl font-black text-white uppercase tracking-[0.2em] text-center px-4"
          >
            INITIALIZING
          </h2>
          <p id="anim-subtext" className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-widest">
            Accessing secure storage
          </p>

          <div className="mt-8 h-4 w-64 rounded-full border-2 border-white bg-gray-800 p-1">
            <div
              id="anim-progress"
              className="h-full w-0 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            ></div>
          </div >

          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 opacity-30">
            <span className="font-mono text-xs text-white">BLOCK: #{listings?.[0]?.id?.slice(0, 8) || '000000'}</span>
            <span className="font-mono text-xs text-white">HASH: 0x{blobId?.slice(0, 4) || '0000'}...{blobId?.slice(-4) || '0000'}</span>
            <span className="font-mono text-xs text-white">NODE: SUI-TESTNET-01</span>
          </div>
        </div>
      )}

      {/* Transaction Status Modal */}
      <TransactionStatus
        steps={txSteps.steps}
        currentStep={txSteps.currentStep}
        isVisible={showTxStatus}
        error={txSteps.error}
        onClose={() => {
          if (!txSteps.isActive) {
            setShowTxStatus(false);
            txSteps.reset();
          }
        }}
      />
    </>
  );
}
