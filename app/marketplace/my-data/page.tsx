'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useAllListings, useAccountBalance } from '@/hooks/useMarketplace';
import { formatSize, bytesToHex, formatPrice } from '@/lib/marketplace';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { marketplaceConfig, MIST_PER_SUI } from '@/config/marketplace';
import { getMarketplaceTarget } from '@/lib/marketplace';

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
type UploadStep = 'form' | 'processing' | 'complete';
type Step = 'encode' | 'register' | 'upload' | 'certify' | 'listing' | 'complete';

interface TransactionLog {
  step: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message: string;
  details?: string;
  timestamp: string;
}

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: 'encode', label: 'Encode', icon: 'encryption' },
  { key: 'register', label: 'Register', icon: 'how_to_reg' },
  { key: 'upload', label: 'Upload', icon: 'cloud_upload' },
  { key: 'certify', label: 'Certify', icon: 'verified' },
  { key: 'listing', label: 'Listing', icon: 'add_business' },
  { key: 'complete', label: 'Complete', icon: 'check_circle' },
];

export default function MyDataPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending: isSigning } = useSignAndExecuteTransaction();
  const { data: listings, isLoading, refetch } = useAllListings();
  const { data: balance } = useAccountBalance();

  const [activeTab, setActiveTab] = useState<Tab>('uploads');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<UploadStep>('form');
  const [currentStep, setCurrentStep] = useState<Step>('encode');
  const [processingType, setProcessingType] = useState<'create' | 'download' | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [blobId, setBlobId] = useState('');
  const [encryptedObject, setEncryptedObject] = useState('');
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [listingId, setListingId] = useState('');

  const [logs, setLogs] = useState<TransactionLog[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceSUI: '',
    previewSizeBytes: 1024 * 1024,
  });

  const flowRef = useRef<Awaited<ReturnType<typeof createFlow>> | null>(null);

  const addLog = (step: string, status: TransactionLog['status'], message: string, details?: string) => {
    setLogs(prev => [...prev, {
      step,
      status,
      message,
      details,
      timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  const createFlow = useCallback(async (data: Uint8Array, identifier: string) => {
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
    );

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
    setUploadStep('form');
    setBlobId('');
    setEncryptedObject('');
    setLogs([]);
    setCurrentStep('encode');
    flowRef.current = null;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartUpload = async () => {
    if (!file || !account) return;

    setIsProcessing(true);
    setUploadError('');

    try {
      const price = parseFloat(formData.priceSUI);
      if (!formData.name || !formData.description || isNaN(price) || price <= 0) {
        setUploadError('Please fill in all required fields');
        setIsProcessing(false);
        return;
      }

      addLog('encode', 'processing', 'Encoding file...');

      const fileBytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBytes);

      // Step 1: Create flow and encode
      const flow = await createFlow(uint8Array, file.name);
      flowRef.current = flow;
      await flow.encode();
      addLog('encode', 'success', 'File encoded');

      // Generate encrypted object from file content (first 64 bytes as hex)
      const encryptedObj = bytesToHex(uint8Array).slice(0, 128);
      setEncryptedObject(encryptedObj);

      // Step 2: Register blob on-chain
      setCurrentStep('register');
      addLog('register', 'processing', 'Registering blob on Sui...');

      const registerTx = flow.register({
        epochs: 3,
        owner: account.address,
        deletable: false,
      });

      signAndExecute(
        { transaction: registerTx },
        {
          onSuccess: async (result) => {
            try {
              addLog('register', 'success', 'Blob registered', `TX: ${result.digest.slice(0, 16)}...`);

              // Step 3: Upload to Walrus storage nodes
              setCurrentStep('upload');
              addLog('upload', 'processing', 'Uploading to Walrus...');

              await flow.upload({ digest: result.digest });
              addLog('upload', 'success', 'Uploaded to Walrus storage nodes');

              // Step 4: Certify blob
              setCurrentStep('certify');
              addLog('certify', 'processing', 'Certifying blob on Sui...');

              const certifyTx = flow.certify();

              signAndExecute(
                { transaction: certifyTx },
                {
                  onSuccess: async (certifyResult) => {
                    addLog('certify', 'success', 'Blob certified', `TX: ${certifyResult.digest.slice(0, 16)}...`);

                    // Step 5: Get blobId from listFiles (only available after certify)
                    let walrusBlobId = '';
                    try {
                      const files = await flow.listFiles();
                      console.log('[Walrus] Files:', files);
                      walrusBlobId = files[0]?.blobId || files[0]?.id || '';
                      if (walrusBlobId) {
                        setBlobId(walrusBlobId);
                        addLog('complete', 'success', 'Blob ID obtained', `ID: ${walrusBlobId.slice(0, 20)}...`);
                      }
                    } catch (listError) {
                      console.error('[Walrus] listFiles error:', listError);
                    }

                    // Step 6: Create listing
                    await handleCreateListing(price, walrusBlobId, encryptedObj);
                  },
                  onError: (err) => {
                    addLog('certify', 'error', err.message || 'Certification failed');
                    setUploadError(err.message || 'Certification failed');
                    setIsProcessing(false);
                  },
                }
              );
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : 'Upload failed';
              addLog('upload', 'error', errorMsg);
              setUploadError(errorMsg);
              setIsProcessing(false);
            }
          },
          onError: (err) => {
            addLog('register', 'error', err.message || 'Registration failed');
            setUploadError(err.message || 'Registration failed');
            setIsProcessing(false);
          },
        }
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to prepare upload';
      addLog('encode', 'error', errorMsg);
      setUploadError(errorMsg);
      setIsProcessing(false);
    }
  };

  const handleCreateListing = async (price: number, walrusBlobId: string, encryptedObj: string) => {
    if (!account) return;

    try {
      setCurrentStep('listing');
      addLog('listing', 'processing', 'Creating listing on marketplace...');

      const priceInMIST = BigInt(Math.floor(price * Number(MIST_PER_SUI)));
      const registryId = marketplaceConfig.registryId;

      const tx = new Transaction();

      console.log('=== CREATE LISTING (my-data) ===');
      console.log('Price in MIST:', priceInMIST.toString());
      console.log('Registry ID:', registryId);
      console.log('Blob ID:', walrusBlobId || blobId);

      const listing = tx.moveCall({
        target: getMarketplaceTarget('list_dataset'),
        arguments: [
          tx.object(registryId),
          tx.pure.string(walrusBlobId || blobId),
          tx.pure.string(encryptedObj),
          tx.pure.string(formData.name),
          tx.pure.string(formData.description),
          tx.pure.u64(priceInMIST),
          tx.pure.u64(formData.previewSizeBytes),
          tx.pure.u64(totalSizeBytes),
        ],
      });
      console.log('list_dataset moveCall created');

      // Share listing object publicly so anyone can purchase
      console.log('Adding public_share_object moveCall...');
      tx.moveCall({
        target: '0x2::transfer::public_share_object',
        typeArguments: [`${marketplaceConfig.packageId}::${marketplaceConfig.moduleName}::DatasetListing`],
        arguments: [listing],
      });
      console.log('public_share_object added');

      console.log('Executing transaction...');
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('=== CREATE LISTING SUCCESS ===');
            console.log('Result:', result);
            const effects = result.effects as { created?: Array<{ reference: { objectId: string } }> } | undefined;
            const newListingId = effects?.created?.[0]?.reference?.objectId || result.digest;
            console.log('New listing ID:', newListingId);
            
            addLog('listing', 'success', 'Listing created!', `ID: ${newListingId.slice(0, 16)}...`);
            setListingId(newListingId);

            setCurrentStep('complete');
            setUploadStep('complete');
            setProcessingType('create');
            setIsProcessing(false);
          },
          onError: (err) => {
            console.error('=== CREATE LISTING ERROR ===');
            console.error('Error:', err);
            addLog('listing', 'error', err.message || 'Failed to create listing');
            setUploadError(err.message || 'Failed to create listing');
            setIsProcessing(false);
          },
        }
      );
    } catch (err) {
      console.error('=== CREATE LISTING CATCH ERROR ===');
      console.error('Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create listing';
      addLog('listing', 'error', errorMsg);
      setUploadError(errorMsg);
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setFile(null);
    setBlobId('');
    setEncryptedObject('');
    setTotalSizeBytes(0);
    setUploadStep('form');
    setFormData({
      name: '',
      description: '',
      priceSUI: '',
      previewSizeBytes: 1024 * 1024,
    });
    setLogs([]);
    setListingId('');
    flowRef.current = null;
  };

  const totalRevenue = listings ? listings.reduce((acc, l) => acc + Number(l.price), 0) / 1000000000 : 0;

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
                  <h2 className="text-3xl font-black text-ink">{totalRevenue.toFixed(2)}</h2>
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
            className={`px-6 py-3 rounded-t-xl border-2 font-bold text-lg transition-colors relative top-[2px] z-10 ${
              activeTab === 'uploads' 
                ? 'border-ink border-b-0 bg-white text-ink shadow-[0_-2px_0_0_rgba(0,0,0,0.05)]' 
                : 'border-transparent hover:bg-gray-100 text-gray-500'
            }`}
          >
            My Uploads
          </button>
          <button 
            onClick={() => setActiveTab('purchases')}
            className={`px-6 py-3 rounded-t-xl border-2 font-bold text-lg transition-colors relative top-[2px] z-10 ${
              activeTab === 'purchases' 
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

      <footer className="mt-auto border-t-2 border-ink pt-8 flex flex-col items-center gap-4 text-center opacity-60 pb-8 bg-[#f6f7f9]">
        <p className="text-sm font-bold">Powered by Sui Network</p>
        <div className="flex gap-4">
          <span className="material-symbols-outlined">dataset</span>
          <span className="material-symbols-outlined">security</span>
          <span className="material-symbols-outlined">hub</span>
        </div>
      </footer>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl bg-white rounded-2xl border-2 border-ink shadow-hard-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b-2 border-ink">
              <h2 className="text-xl font-black text-ink uppercase">Create New Listing</h2>
              <button
                onClick={closeModal}
                className="h-8 w-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-ink">close</span>
              </button>
            </div>

            {!account ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="material-symbols-outlined text-6xl text-gray-400 mb-4">account_balance_wallet</div>
                  <h3 className="text-xl font-bold mb-2 text-ink">Connect Your Wallet</h3>
                  <p className="text-gray-600">Please connect your wallet to create a listing.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Main Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                  {/* Step Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      {STEPS.map((step, index) => {
                        const stepIndex = STEPS.findIndex(s => s.key === currentStep);
                        const isCompleted = index < stepIndex;
                        const isCurrent = step.key === currentStep;
                        const isPending = index > stepIndex;
                        
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center">
                              <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                ${isCompleted ? 'bg-green-500 border-green-500' : ''}
                                ${isCurrent ? 'bg-blue-500 border-blue-500 animate-pulse' : ''}
                                ${isPending ? 'bg-gray-100 border-gray-300' : ''}
                              `}>
                                {isCompleted ? (
                                  <span className="material-symbols-outlined text-white">check</span>
                                ) : isCurrent ? (
                                  <span className="material-symbols-outlined text-white animate-spin">sync</span>
                                ) : (
                                  <span className="material-symbols-outlined text-gray-400">{step.icon}</span>
                                )}
                              </div>
                              <span className={`text-xs mt-2 font-bold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                {step.label}
                              </span>
                            </div>
                            {index < STEPS.length - 1 && (
                              <div className={`flex-1 h-1 mx-2 rounded ${
                                isCompleted ? 'bg-green-500' : 'bg-gray-200'
                              }`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Content */}
                  {uploadStep === 'form' && (
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

                          <button
                            onClick={handleStartUpload}
                            disabled={!file || !formData.name || !formData.description || !formData.priceSUI || isProcessing}
                            className="w-full h-12 rounded-xl border-2 border-ink bg-primary text-white font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isProcessing ? (
                              <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Processing...
                              </>
                            ) : (
                              'Start Upload'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {(uploadStep === 'processing' || uploadStep === 'complete') && (
                    <div className="space-y-6">
                      <div className="bg-gray-50 border-2 border-ink rounded-xl p-6">
                        <h3 className="font-bold uppercase text-lg mb-4 text-ink">Dataset Summary</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-bold text-ink">{formData.name || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="font-bold text-primary">{formData.priceSUI || '0'} SUI</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">File Size</p>
                            <p className="font-mono font-bold text-ink">{formatSize(totalSizeBytes)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Preview Size</p>
                            <p className="font-mono font-bold text-ink">{formatSize(formData.previewSizeBytes)}</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border-2 border-ink">
                          <p className="text-sm text-gray-500 mb-1">Description</p>
                          <p className="font-medium text-ink">{formData.description || '-'}</p>
                        </div>
                      </div>

                      {uploadError && (
                        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl">
                          <p className="font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined">error</span>
                            Error
                          </p>
                          <p className="text-sm">{uploadError}</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={closeModal}
                          className="flex-1 h-12 rounded-xl border-2 border-ink bg-white text-ink font-bold hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Panel - Transaction Logs */}
                <div className="w-80 border-l-2 border-ink bg-gray-50 p-4 overflow-y-auto">
                  <h3 className="font-bold uppercase text-sm mb-4 text-ink flex items-center gap-2">
                    <span className="material-symbols-outlined">terminal</span>
                    Transaction Log
                  </h3>

                  {logs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No transactions yet.<br />
                      Start upload to see logs.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log, index) => (
                        <div 
                          key={index}
                          className={`
                            rounded-lg p-3 border-2 text-sm
                            ${log.status === 'success' ? 'bg-green-50 border-green-300' : ''}
                            ${log.status === 'error' ? 'bg-red-50 border-red-300' : ''}
                            ${log.status === 'processing' ? 'bg-blue-50 border-blue-300 animate-pulse' : ''}
                            ${log.status === 'pending' ? 'bg-gray-100 border-gray-300' : ''}
                          `}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-sm">
                              {log.status === 'success' ? 'check_circle' : log.status === 'error' ? 'error' : log.status === 'processing' ? 'sync' : 'schedule'}
                            </span>
                            <span className="font-bold text-ink">{log.step}</span>
                          </div>
                          <p className="text-gray-600">{log.message}</p>
                          {log.details && (
                            <p className="text-xs text-gray-400 mt-1 font-mono break-all">{log.details}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{log.timestamp}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {blobId && (
                    <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">Blob ID</p>
                      <p className="font-mono text-xs text-ink break-all">{blobId}</p>
                    </div>
                  )}

                  {listingId && (
                    <div className="mt-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                      <p className="text-xs font-bold text-green-600 uppercase mb-1">Listing ID</p>
                      <p className="font-mono text-xs text-ink break-all">{listingId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {processingType === 'create' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border-2 border-ink shadow-hard-lg p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                  <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
                </div>
                <div className="absolute -inset-2 rounded-full border-4 border-green-400 animate-ping opacity-20"></div>
              </div>
              <h2 className="text-2xl font-black text-ink uppercase tracking-wide mb-2">
                Listing Created!
              </h2>
              <p className="text-gray-600 mb-4">Your dataset is now on the marketplace</p>
              
              {listingId && (
                <div className="w-full bg-gray-50 rounded-lg p-3 mb-6 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Listing ID</p>
                  <p className="font-mono text-xs text-ink break-all">{listingId}</p>
                </div>
              )}
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setProcessingType(null);
                    closeModal();
                    refetch();
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-ink bg-primary text-white font-bold hover:translate-y-0.5 transition-all"
                >
                  View My Listings
                </button>
                <button
                  onClick={() => {
                    setProcessingType(null);
                    closeModal();
                  }}
                  className="flex-1 h-12 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
