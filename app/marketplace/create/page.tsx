'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { CreateListingForm } from '@/components/marketplace/CreateListingForm';
import { formatSize, bytesToHex } from '@/lib/marketplace';
import { getFullnodeUrl } from '@mysten/sui/client';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { useWalrusPayment } from '@/hooks/useWalrusPayment';

const walrusModule = {
  walrus: null as null | typeof import('@mysten/walrus').walrus,
};

async function getWalrus() {
  if (!walrusModule.walrus) {
    walrusModule.walrus = (await import('@mysten/walrus')).walrus;
  }
  return walrusModule.walrus;
}

type UploadStep = 'form' | 'encode' | 'register' | 'upload' | 'certify' | 'complete';

function isStep(step: UploadStep, target: UploadStep): boolean {
  return step === target;
}

export default function CreateListingPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending: isSigning } = useSignAndExecuteTransaction();
  const { 
    isInitialized: isWalPayInitialized,
    checkBalance,
    ensureWalBalance,
    getStorageCost,
    formatWal,
    isLoading: isWalPayLoading,
  } = useWalrusPayment();
  
  const [uploadStep, setUploadStep] = useState<UploadStep>('form');
  const [file, setFile] = useState<File | null>(null);
  const [blobId, setBlobId] = useState('');
  const [encryptedObject, setEncryptedObject] = useState('');
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceSUI: '',
    previewSizeBytes: 1024 * 1024,
  });
  const [uploadError, setUploadError] = useState('');
  const [walBalanceStatus, setWalBalanceStatus] = useState<{
    sufficient: boolean;
    walNeeded: bigint;
    suiNeeded?: bigint;
    storageCost: string;
  } | null>(null);
  
  const flowRef = useRef<Awaited<ReturnType<typeof createFlow>> | null>(null);
  const registerDigestRef = useRef<string>('');

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
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEncode = async () => {
    if (!file || !account) return;
    
    setIsProcessing(true);
    setUploadError('');

    try {
      const fileBytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBytes);

      const flow = await createFlow(uint8Array, file.name);
      flowRef.current = flow;

      await flow.encode();
      
      setEncryptedObject('0x' + bytesToHex(uint8Array).slice(0, 128));
      setUploadStep('register');
    } catch (error) {
      console.error('Encode error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to encode file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
    if (!flowRef.current || !account) return;

    setIsProcessing(true);
    setUploadError('');

    console.log('=== STEP 2: REGISTER ===');
    console.log('File size:', totalSizeBytes);
    console.log('Account:', account.address);

    try {
      // Check WAL balance và swap nếu cần (chỉ khi sui-pay-wal được cấu hình)
      if (isWalPayInitialized && totalSizeBytes > 0) {
        console.log('Checking WAL balance for storage payment...');
        
        // Hiển thị chi phí storage
        const storageCost = getStorageCost(totalSizeBytes, 3);
        console.log('Estimated storage cost:', storageCost.totalWal, 'WAL');
        
        const balanceCheck = await checkBalance(totalSizeBytes, 3);
        
        if (balanceCheck) {
          console.log('Balance check result:', {
            sufficient: balanceCheck.sufficient,
            walNeeded: balanceCheck.walNeeded.toString(),
            suiNeeded: balanceCheck.suiNeeded?.toString(),
          });
          
          setWalBalanceStatus({
            sufficient: balanceCheck.sufficient,
            walNeeded: balanceCheck.walNeeded,
            suiNeeded: balanceCheck.suiNeeded,
            storageCost: formatWal(balanceCheck.walNeeded),
          });

          if (!balanceCheck.sufficient) {
            console.log('Insufficient WAL, attempting to swap SUI -> WAL...');
            console.log('SUI needed for swap:', balanceCheck.suiNeeded?.toString());
            
            const swapResult = await ensureWalBalance(totalSizeBytes, 3);
            console.log('Swap result:', swapResult);
            
            if (!swapResult.success) {
              console.error('Failed to ensure WAL balance:', swapResult.error);
              setUploadError(`Không đủ WAL để trả phí storage. ${swapResult.error || 'Vui lòng swap SUI sang WAL trước.'}`);
              setIsProcessing(false);
              return;
            }
            console.log('WAL balance ensured successfully, new balance:', swapResult.walBalance.toString());
          } else {
            console.log('Sufficient WAL balance available');
          }
        }
      } else {
        console.log('sui-pay-wal not configured, skipping WAL balance check');
      }

      console.log('Creating register transaction...');
      const registerTx = flowRef.current.register({
        epochs: 3,
        owner: account.address,
        deletable: false,
      });
      console.log('Register transaction created');

      console.log('Signing and executing register transaction...');
      signAndExecute(
        { transaction: registerTx },
        {
          onSuccess: (result) => {
            console.log('=== REGISTER SUCCESS ===');
            console.log('Transaction digest:', result.digest);
            registerDigestRef.current = result.digest;
            setUploadStep('upload');
          },
          onError: (error) => {
            console.error('=== REGISTER ERROR ===');
            console.error('Error:', error);
            setUploadError(error.message || 'Failed to register blob');
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error('=== REGISTER ERROR (catch) ===');
      console.error('Error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to register blob');
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!flowRef.current || !registerDigestRef.current) return;

    setIsProcessing(true);
    setUploadError('');

    try {
      await flowRef.current.upload({ digest: registerDigestRef.current });
      setUploadStep('certify');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload to storage nodes');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCertify = async () => {
    if (!flowRef.current || !account) return;

    setIsProcessing(true);
    setUploadError('');

    try {
      const certifyTx = flowRef.current.certify();

      signAndExecute(
        { transaction: certifyTx },
        {
          onSuccess: async () => {
            setBlobId('uploaded');
            setUploadStep('complete');
          },
          onError: (error) => {
            setUploadError(error.message || 'Failed to certify blob');
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error('Certify error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to certify blob');
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
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
    flowRef.current = null;
    registerDigestRef.current = '';
  };

  const getStepButtonText = () => {
    switch (uploadStep) {
      case 'form':
        return 'Upload to Walrus';
      case 'encode':
        return isProcessing ? 'Encoding...' : 'Continue to Register';
      case 'register':
        return isProcessing || isSigning ? 'Signing Transaction...' : 'Sign Register Transaction';
      case 'upload':
        return isProcessing ? 'Uploading to Storage...' : 'Continue to Certify';
      case 'certify':
        return isProcessing || isSigning ? 'Signing Transaction...' : 'Sign Certify Transaction';
      default:
        return 'Continue';
    }
  };

  const handleStepAction = async () => {
    switch (uploadStep) {
      case 'form':
        await handleEncode();
        break;
      case 'encode':
        setUploadStep('register');
        break;
      case 'register':
        await handleRegister();
        break;
      case 'upload':
        await handleUpload();
        break;
      case 'certify':
        await handleCertify();
        break;
    }
  };

  const canProceed = () => {
    switch (uploadStep) {
      case 'form':
        return file && formData.name && formData.description && formData.priceSUI && !isProcessing;
      case 'encode':
        return !isProcessing;
      case 'register':
        return !isProcessing && !isSigning;
      case 'upload':
        return !isProcessing;
      case 'certify':
        return !isProcessing && !isSigning;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pt-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDFDFD 0%, #F0F4F8 100%)' }}>
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-90">
        <img
          alt="Abstract Background"
          className="w-[800px] h-[800px] object-cover rounded-full blur-sm animate-float mix-blend-multiply opacity-40"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxGDQ2raWYTkZUV_t_AysmSYYrV93tcGjNFWumodabC8O6V43V-KOhHQEhnW6oxhNMZQcm-lEgmlS4kN3BOifSNOm_bvoXS-iT83bVY8ulZCI_pudlabVHhEmq99LHVkZ6WxLvSLcjjGCCS7P8ggXzrgVthsfvnAUkn8MynriHtCwYG_36Wezl9IIL9XcONsdTyQQjlbEQYb1hJAtYGLzJPpmPQWwlxjc2zC_RcNqCHuph-8UiKdzqEVRyfag0T_m_v-zSFMqe-a0"
        />
      </div>

      <div className="absolute top-40 left-10 animate-float z-0" style={{ animationDelay: '0.5s' }}>
        <div className="bg-[#FFD600] w-20 h-20 rounded-2xl border-4 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-12">
          <span className="material-icons text-4xl text-black">cloud_upload</span>
        </div>
      </div>

      <div className="absolute top-60 right-10 animate-float z-0" style={{ animationDelay: '1.5s' }}>
        <div className="bg-[#9747FF] w-16 h-16 rounded-full border-4 border-black flex items-center justify-center shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-12">
          <span className="material-icons text-3xl text-white">sell</span>
        </div>
      </div>

      <div className="absolute bottom-40 left-20 animate-float z-0" style={{ animationDelay: '2.5s' }}>
        <div className="bg-[#3B82F6] w-18 h-18 rounded-xl border-4 border-black flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform rotate-6">
          <span className="material-icons text-4xl text-white">storage</span>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl flex-1 flex flex-col">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#3B82F6] hover:underline mb-4 font-semibold">
            <span className="material-icons">arrow_back</span>
            BACK TO HOME
          </Link>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.9] tracking-tighter uppercase mb-4 transform -rotate-1" style={{ color: '#1A1A1A' }}>
            <span className="block">List Your</span>
            <span className="block text-[#3B82F6]">Dataset</span>
          </h1>
          <p className="text-lg font-medium text-gray-600 max-w-xl mx-auto">
            Upload your data to Walrus and list it on the marketplace
          </p>
        </div>

        {!account && (
          <div className="bg-white/90 backdrop-blur-md border-2 border-black rounded-2xl p-8 text-center shadow-lg mx-auto max-w-md" style={{ boxShadow: '8px_8px_0px_0px_rgba(0,0,0,1)' }}>
            <div className="bg-[#FF5C00] w-20 h-20 rounded-full border-4 border-black flex items-center justify-center shadow-[-6px_6px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 transform rotate-6">
              <span className="material-icons text-4xl text-white">account_balance_wallet</span>
            </div>
            <h2 className="font-display text-2xl uppercase mb-2" style={{ color: '#1A1A1A' }}>Connect Wallet</h2>
            <p className="text-gray-600 mb-4">
              Please connect your wallet to list a dataset for sale.
            </p>
          </div>
        )}

        {account && uploadStep === 'form' && (
          <div className="bg-white/90 backdrop-blur-md border-2 border-black rounded-2xl p-8 shadow-lg" style={{ boxShadow: '8px_8px_0px_0px_rgba(0,0,0,1)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#3B82F6] w-12 h-12 rounded-full border-4 border-black flex items-center justify-center">
                <span className="material-icons text-white">1</span>
              </div>
              <div>
                <h2 className="font-display text-2xl uppercase" style={{ color: '#1A1A1A' }}>Upload & List</h2>
                <p className="text-sm text-gray-500">Fill in details and upload to Walrus</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Dataset Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter dataset name"
                    maxLength={100}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 text-lg"
                    style={{ color: '#1A1A1A' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.name.length}/100 characters</p>
                </div>

                <div>
                  <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your dataset..."
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 resize-none text-lg"
                    style={{ color: '#1A1A1A' }}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
                </div>

                <div>
                  <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Price (SUI)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.priceSUI}
                      onChange={(e) => handleInputChange('priceSUI', e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 text-lg pr-16"
                      style={{ color: '#1A1A1A' }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">SUI</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Preview Size</label>
                  <input
                    type="range"
                    value={formData.previewSizeBytes}
                    onChange={(e) => handleInputChange('previewSizeBytes', Number(e.target.value))}
                    min={0}
                    max={totalSizeBytes || 10 * 1024 * 1024}
                    step={1024}
                    className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2 font-mono">
                    <span>0 B</span>
                    <span className="text-[#3B82F6] font-bold">{formatSize(formData.previewSizeBytes)}</span>
                    <span>{formatSize(totalSizeBytes)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Upload File</label>
                  {!file ? (
                    <label className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all block" style={{ background: 'rgba(59, 130, 246, 0.02)' }}>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="*/*"
                      />
                      <div className="material-icons text-6xl text-gray-400 mb-2">cloud_upload</div>
                      <p className="font-bold uppercase tracking-wide" style={{ color: '#1A1A1A' }}>Choose File</p>
                      <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                    </label>
                  ) : (
                    <div className="bg-gray-100 rounded-xl p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#3B82F6] w-12 h-12 rounded-lg flex items-center justify-center">
                          <span className="material-icons text-white">description</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate" style={{ color: '#1A1A1A' }}>{file.name}</p>
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
                  <div className="bg-[#00D68F]/20 border-2 border-black rounded-xl p-4">
                    <h3 className="font-bold uppercase text-sm mb-2 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                      <span className="material-icons text-sm">info</span>
                      File Information
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">Size</p>
                        <p className="font-mono font-bold" style={{ color: '#1A1A1A' }}>{formatSize(file.size)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-mono font-bold" style={{ color: '#1A1A1A' }}>{file.type || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl">
                    <p className="font-bold flex items-center gap-2">
                      <span className="material-icons">error</span>
                      Upload Error
                    </p>
                    <p className="text-sm">{uploadError}</p>
                  </div>
                )}

                <button
                  onClick={handleStepAction}
                  disabled={!canProceed()}
                  className="w-full bg-black text-white py-5 rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-icons animate-spin">sync</span>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-icons">cloud_upload</span>
                      {getStepButtonText()}
                    </span>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Your data will be stored on Walrus decentralized storage
                </p>
              </div>
            </div>
          </div>
        )}

        {account && uploadStep !== 'form' && uploadStep !== 'complete' && (
          <div className="bg-white/90 backdrop-blur-md border-2 border-black rounded-2xl p-8 shadow-lg mx-auto max-w-lg" style={{ boxShadow: '8px_8px_0px_0px_rgba(0,0,0,1)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#3B82F6] w-12 h-12 rounded-full border-4 border-black flex items-center justify-center">
                <span className="material-icons text-white">lock</span>
              </div>
              <div>
                <h2 className="font-display text-2xl uppercase" style={{ color: '#1A1A1A' }}>Walrus Upload</h2>
                <p className="text-sm text-gray-500">Step {uploadStep === 'encode' ? '1' : uploadStep === 'register' ? '2' : uploadStep === 'upload' ? '3' : '4'} of 4</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isStep(uploadStep, 'encode') ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6]' : 'bg-green-100'}`}>
                <span className="material-icons">{isStep(uploadStep, 'encode') ? 'pending' : 'check'}</span>
                <span className="font-semibold">Encode file</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isStep(uploadStep, 'register') ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6]' : isStep(uploadStep, 'encode') ? 'bg-gray-100' : 'bg-green-100'}`}>
                <span className="material-icons">{isStep(uploadStep, 'register') ? 'pending' : 'check'}</span>
                <span className="font-semibold">Register on blockchain</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isStep(uploadStep, 'upload') ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6]' : isStep(uploadStep, 'certify') || isStep(uploadStep, 'complete') ? 'bg-gray-100' : 'bg-green-100'}`}>
                <span className="material-icons">{isStep(uploadStep, 'upload') ? 'pending' : 'check'}</span>
                <span className="font-semibold">Upload to storage nodes</span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-xl ${isStep(uploadStep, 'certify') ? 'bg-[#3B82F6]/20 border-2 border-[#3B82F6]' : isStep(uploadStep, 'complete') ? 'bg-green-100' : 'bg-gray-100'}`}>
                <span className="material-icons">{isStep(uploadStep, 'certify') ? 'pending' : 'check'}</span>
                <span className="font-semibold">Certify blob</span>
              </div>
            </div>

            {uploadError && (
              <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
                <p className="font-bold flex items-center gap-2">
                  <span className="material-icons">error</span>
                  Error
                </p>
                <p className="text-sm">{uploadError}</p>
              </div>
            )}

            <button
              onClick={handleStepAction}
              disabled={!canProceed()}
              className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              {isProcessing || isSigning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-icons animate-spin">sync</span>
                  Processing...
                </span>
              ) : (
                getStepButtonText()
              )}
            </button>
          </div>
        )}

        {account && uploadStep === 'complete' && blobId && (
          <div className="bg-white/90 backdrop-blur-md border-2 border-black rounded-2xl p-8 shadow-lg" style={{ boxShadow: '8px_8px_0px_0px_rgba(0,0,0,1)' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#00D68F] w-12 h-12 rounded-full border-4 border-black flex items-center justify-center shadow-[-6px_6px_0px_0px_rgba(0,0,0,1)]">
                <span className="material-icons text-white">check</span>
              </div>
              <div>
                <h2 className="font-display text-2xl uppercase" style={{ color: '#1A1A1A' }}>Upload Complete</h2>
                <p className="text-sm text-gray-500">Your data is now on Walrus</p>
              </div>
            </div>

            <div className="bg-[#00D68F]/20 border-2 border-black rounded-xl p-6 mb-6">
              <h3 className="font-bold uppercase text-sm mb-4 flex items-center gap-2" style={{ color: '#1A1A1A' }}>
                <span className="material-icons text-sm">cloud_done</span>
                Walrus Storage
              </h3>
              <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <p className="text-sm text-gray-500 mb-1">Blob ID</p>
                <p className="font-mono text-xs break-all" style={{ color: '#1A1A1A' }}>{blobId}</p>
              </div>
            </div>

            <CreateListingForm
              blobId={blobId}
              encryptedObject={encryptedObject}
              totalSizeBytes={totalSizeBytes}
            />

            <button
              onClick={resetFlow}
              className="mt-6 w-full text-gray-500 hover:text-gray-700 py-2 font-semibold"
            >
              Upload Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
