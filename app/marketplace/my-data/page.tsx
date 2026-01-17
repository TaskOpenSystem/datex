'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useOwnedListings, useAccountBalance } from '@/hooks/useMarketplace';
import { formatSize, bytesToHex, formatPrice } from '@/lib/marketplace';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Transaction } from '@mysten/sui/transactions';
import { marketplaceConfig, MIST_PER_SUI } from '@/config/marketplace';
import { getMarketplaceTarget } from '@/lib/marketplace';

// Type for Walrus write files flow
interface WalrusWriteFlow {
  encode: () => Promise<void>;
  register: (opts: { epochs: number; owner: string; deletable: boolean }) => Transaction;
  upload: (opts: { digest: string }) => Promise<void>;
  certify: () => Transaction;
  listFiles: () => Promise<Array<{ blobId?: string; id?: string }>>;
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
  const { data: listings, isLoading, refetch } = useOwnedListings(account?.address);
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
                    <article key={i} className="flex flex-col rounded-xl border-2 border-ink bg-white overflow-hidden animate-pulse">
                      <div className="h-36 bg-gray-200" />
                      <div className="p-4 flex flex-col flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                          <div>
                            <div className="h-2 bg-gray-100 rounded w-12 mb-1" />
                            <div className="h-4 bg-gray-200 rounded w-16" />
                          </div>
                          <div>
                            <div className="h-2 bg-gray-100 rounded w-12 mb-1" />
                            <div className="h-4 bg-gray-200 rounded w-16" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-200">
                          <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
                          <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
                        </div>
                      </div>
                    </article>
                  ))}
                </>
              )}

              {listings && listings.map(listing => (
                <article key={listing.id} className="flex flex-col rounded-xl border-2 border-ink bg-white overflow-hidden">
                  {/* Image/Preview Area */}
                  <div className="relative h-36 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,50 Q25,30 50,50 T100,50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-accent-lime" />
                        <path d="M0,60 Q25,40 50,60 T100,60" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-accent-lime" />
                      </svg>
                    </div>
                    <span className="material-symbols-outlined text-5xl text-gray-600">dataset</span>
                    <span className="absolute top-3 left-3 rounded bg-accent-lime text-ink px-2 py-0.5 text-[10px] font-bold border border-ink">ACTIVE</span>
                    
                    {/* Explorer Links */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      <a
                        href={`https://suiscan.xyz/testnet/object/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 w-7 rounded bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                        title="View on SuiScan"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 234 234" fill="none">
                          <path d="M0 100C0 65 0 47.5 6.8 33C12.7 21.3 22.3 11.8 34 5.8C47.3 0 64.7 0 99.5 0H133.8C168.6 0 186 0 199.3 6.8C211 12.8 220.6 22.3 226.5 34C233.3 47.4 233.3 64.9 233.3 99.8V134.2C233.3 169.1 233.3 186.6 226.5 199.9C220.6 211.6 211 221.2 199.3 227.2C186 234 168.6 234 133.8 234H99.5C64.7 234 47.3 234 34 227.2C22.3 221.2 12.7 211.7 6.8 200C0 186.6 0 169.1 0 134.2V100Z" fill="#4C72FF"/>
                          <path d="M177 87C178.7 85.9 180.8 85.6 182.4 86.3C183.2 86.6 183.9 87.1 184.3 87.8C184.7 88.5 185 89.4 184.9 90.2L181.4 148.2C181 155.7 178.2 163.4 173.6 170.4C160.4 190.4 133.2 200 112.8 191.8C107.1 189.5 102.5 186 99.2 181.7C100 181.8 100.8 181.7 101.5 181.7C122.4 181.7 143.5 170.3 155.1 152.7C160.7 144.1 164 134.7 164.6 125.6L166.5 93.3L177 87Z" fill="white"/>
                          <path d="M150 63.6C151.7 62.5 153.8 62.3 155.5 62.9C156.3 63.3 156.9 63.8 157.4 64.5C157.9 65.2 158.1 66.1 158 66.9L154.5 125C154 132.5 151.3 140.1 146.7 147.1C133.5 167.2 106.3 176.7 85.9 168.5C80.1 166.2 75.6 162.7 72.3 158.4C73.1 158.4 73.9 158.4 74.6 158.4C95.6 158.4 116.6 147.1 128.2 129.4C133.9 120.8 137.1 111.4 137.7 102.3L139.6 70L150 63.6Z" fill="white"/>
                          <path d="M123 40.3C124.7 39.2 126.8 39 128.5 39.6C129.2 39.9 129.9 40.5 130.3 41.2C130.8 41.9 131 42.7 130.9 43.5L127.4 101.6C127 109.1 124.2 116.7 119.6 123.7C106.4 143.8 79.2 153.3 58.8 145.1C38.5 136.9 32.7 114 45.9 93.9C50.5 86.9 57.1 80.7 64.6 76.1L123 40.3Z" fill="white"/>
                        </svg>
                      </a>
                      <a
                        href={`https://testnet.suivision.xyz/object/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 w-7 rounded bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                        title="View on SuiVision"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M0 6C0 2.68629 2.68629 0 6 0H18C21.3137 0 24 2.68629 24 6V18C24 21.3137 21.3137 24 18 24H6C2.68629 24 0 21.3137 0 18V6Z" fill="#4DA2FF"/>
                          <path d="M6.99748 5.28362L6.99748 11.0148L8.71768 12.0008L6.99731 12.987L6.99731 18.7182L11.9972 21.584L16.9971 18.7182L16.9971 12.9866L15.2769 12.0007L16.9973 11.0147L16.9973 5.28308L11.997 2.41732L6.99748 5.28362ZM11.6464 3.42366L11.6464 7.94789L7.69961 10.2105L7.69961 5.68623L11.6464 3.42366ZM12.3482 20.5781L12.3482 16.0535L16.2954 13.7912L16.2954 18.3159L12.3482 20.5781ZM15.9441 13.1879L11.9973 15.4501L8.05048 13.1879L9.41994 12.4031L11.9973 13.8803L14.575 12.4031L15.9441 13.1879ZM11.9973 10.1208L9.41964 11.5982L8.05048 10.8134L11.9973 8.55113L15.9445 10.8134L14.575 11.5982L11.9973 10.1208Z" fill="white"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-base font-bold text-ink mb-1 line-clamp-2">{listing.name}</h3>
                    
                    {/* Object ID */}
                    <p className="text-[10px] text-gray-400 font-mono mb-1 truncate" title={listing.id}>
                      ID: {listing.id.slice(0, 8)}...{listing.id.slice(-6)}
                    </p>
                    
                    {/* Blob ID with Walrus link */}
                    <div className="flex items-center gap-1 mb-3">
                      <p className="text-[10px] text-gray-400 font-mono truncate flex-1" title={listing.blobId}>
                        Blob: {listing.blobId.slice(0, 8)}...{listing.blobId.slice(-6)}
                      </p>
                      <a
                        href={`https://walruscan.com/testnet/blob/${listing.blobId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-5 w-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                        title="View on WalrusScan"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="10" r="8" fill="#36B5A8"/>
                          <ellipse cx="12" cy="22" rx="6" ry="2" fill="#36B5A8" opacity="0.5"/>
                          <circle cx="9" cy="8" r="1.5" fill="white"/>
                          <circle cx="15" cy="8" r="1.5" fill="white"/>
                          <path d="M9 13C9 13 10.5 15 12 15C13.5 15 15 13 15 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </a>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
                        <p className="text-sm font-bold text-ink">{formatPrice(listing.price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Size</p>
                        <p className="text-sm font-bold text-accent-lime">{formatSize(Number(listing.totalSize))}</p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-3 border-t border-gray-200">
                      <button className="flex-1 h-9 rounded-lg border-2 border-ink bg-white text-ink text-sm font-bold hover:bg-gray-50 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 h-9 rounded-lg border-2 border-ink bg-gray-100 text-ink text-sm font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Manage
                      </button>
                    </div>
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
