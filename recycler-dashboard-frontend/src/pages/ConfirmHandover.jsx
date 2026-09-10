import { useState } from 'react';
import { QrCode, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export default function ConfirmHandover() {
  const [lotId, setLotId] = useState('');
  const [verifiedWeight, setVerifiedWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`http://localhost:5000/api/lots/${lotId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedWeight: Number(verifiedWeight) })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Confirmation failed');
      
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCert = () => {
    if (!result?.certificate) return;
    const linkSource = `data:application/pdf;base64,${result.certificate}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `EPR_Certificate_${result.lot.lotId}.pdf`;
    downloadLink.click();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Confirm Handover</h1>
        <p className="text-gray-500 mt-1">Scan QR code or manually enter Lot ID to verify and confirm handover.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {!result ? (
          <form onSubmit={handleConfirm} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lot ID (From QR Scan)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <QrCode className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  className="pl-10 block w-full rounded-lg border-gray-300 border px-4 py-3 focus:ring-green-500 focus:border-green-500 text-lg"
                  placeholder="e.g. LOT-001"
                  value={lotId}
                  onChange={(e) => setLotId(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Verified Weight (kg)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 focus:ring-green-500 focus:border-green-500 text-lg"
                  placeholder="Enter weight on scale"
                  value={verifiedWeight}
                  onChange={(e) => setVerifiedWeight(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">kg</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Confirming...' : 'Confirm Handover & Generate EPR Certificate'}
            </button>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Handover Confirmed!</h2>
            <p className="text-gray-500 mb-8">Lot <span className="font-semibold text-gray-800">{result.lot.lotId}</span> from {result.lot.dealerName} has been successfully recorded with a verified weight of {result.lot.verifiedWeight} kg.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 max-w-sm mx-auto">
              <FileText className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">EPR Certificate Ready</h3>
              <p className="text-sm text-gray-500 mb-4">The formal digital proof of this handover has been generated.</p>
              
              <button
                onClick={handleDownloadCert}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Download PDF
              </button>
            </div>
            
            <button
              onClick={() => { setResult(null); setLotId(''); setVerifiedWeight(''); }}
              className="mt-8 text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              ← Process another handover
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
