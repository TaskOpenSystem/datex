'use client';

import { useState } from 'react';

export default function NautilusDebugPage() {
  const [datasetId, setDatasetId] = useState('0x16ed922757efb7e3279ddf743e165534ef7ee799e94008bc75e2e718a7c3ce60');
  const [blobId, setBlobId] = useState('rAn6in1tuthnEXePcM7oqhAoLgsfUfYALVhb00AE4hw');
  const [paymentTxDigest, setPaymentTxDigest] = useState('HxEdeXjc2TvZpLpvFf4hMj5sdBVKnqEh2H55BHYQzRKZ');
  const [buyerAddress, setBuyerAddress] = useState('0x053b2bd6cd161d17de723c1cffdade1cd29bcf4c77952d3c3165faae117892cf');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [decodedPreview, setDecodedPreview] = useState<string | null>(null);
  const [decodedFullData, setDecodedFullData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decodeBase64 = (base64: string): string => {
    try {
      return atob(base64);
    } catch {
      return 'Failed to decode base64';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    setDecodedPreview(null);
    setDecodedFullData(null);

    try {
      const res = await fetch('/api/debug/nautilus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          blob_id: blobId,
          payment_tx_digest: paymentTxDigest || undefined,
          buyer_address: buyerAddress || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
      } else {
        setResponse(data);
        // Decode base64 preview_data
        if (data?.response?.data?.preview_data) {
          setDecodedPreview(decodeBase64(data.response.data.preview_data));
        }
        // Decode base64 full_data
        if (data?.response?.data?.full_data) {
          setDecodedFullData(decodeBase64(data.response.data.full_data));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Nautilus Debug</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Dataset ID</label>
            <input
              type="text"
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              placeholder="0x16ed922757efb7e3279ddf743e165534ef7ee799e94008bc75e2e718a7c3ce60"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Blob ID</label>
            <input
              type="text"
              value={blobId}
              onChange={(e) => setBlobId(e.target.value)}
              placeholder="rAn6in1tuthnEXePcM7oqhAoLgsfUfYALVhb00AE4hw"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Payment TX Digest <span className="text-gray-500">(optional)</span></label>
            <input
              type="text"
              value={paymentTxDigest}
              onChange={(e) => setPaymentTxDigest(e.target.value)}
              placeholder="HxEdeXjc2TvZpLpvFf4hMj5sdBVKnqEh2H55BHYQzRKZ"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Buyer Address <span className="text-gray-500">(optional)</span></label>
            <input
              type="text"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="0x053b2bd6cd161d17de723c1cffdade1cd29bcf4c77952d3c3165faae117892cf"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Processing...' : 'Call Nautilus Server'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <h3 className="font-medium text-red-400 mb-2">Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {decodedPreview && (
          <div className="mt-6 p-4 bg-purple-900/50 border border-purple-500 rounded-lg">
            <h3 className="font-medium text-purple-400 mb-2">Preview Data (decoded)</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap bg-gray-800 p-3 rounded max-h-96">
              {decodedPreview}
            </pre>
          </div>
        )}

        {decodedFullData && (
          <div className="mt-6 p-4 bg-blue-900/50 border border-blue-500 rounded-lg">
            <h3 className="font-medium text-blue-400 mb-2">Full Data (decoded)</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap bg-gray-800 p-3 rounded max-h-96">
              {decodedFullData}
            </pre>
          </div>
        )}

        {response && (
          <div className="mt-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
            <h3 className="font-medium text-green-400 mb-2">Full Response</h3>
            <pre className="text-sm overflow-auto whitespace-pre-wrap max-h-96">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
