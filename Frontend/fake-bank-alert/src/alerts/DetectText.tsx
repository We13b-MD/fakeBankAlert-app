import { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { detectTextAlert, PhoneVerificationRequiredError, } from '@/lib/api';
import PhoneVerificationModal from '@/components/PhoneVerificationModal';

export default function DetectText() {
  const [alertText, setAlertText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  /*const handleDetect = async () => {
    if (!alertText.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const data = await detectTextAlert(alertText);
      setResult(data);
    } catch (err: any) {
      // Check if phone verification is required
      if (err instanceof PhoneVerificationRequiredError) {
        setShowVerificationModal(true);
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };*/

  const handleDetect = async () => {
    if (!alertText.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const data = await detectTextAlert(alertText);
      setResult(data);

      // Trigger event to refresh dashboard stats
      window.dispatchEvent(new Event('alert-detected'));
    } catch (err: any) {
      if (err instanceof PhoneVerificationRequiredError) {
        setShowVerificationModal(true);
      } else {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhoneVerified = () => {
    // After phone is verified, automatically retry the detection
    setShowVerificationModal(false);
    handleDetect();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleDetect();
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-teal-50 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Detect from Text</h2>
            <p className="text-sm text-slate-500">Paste your bank alert message</p>
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <textarea
            value={alertText}
            onChange={(e) => setAlertText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Paste your bank alert here...&#10;&#10;Example:&#10;Credit Alert: NGN50,000.00 credited to your account ****1234 on 14-Dec-2024. Balance: NGN150,000.00"
            className="w-full h-40 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-500">
              {alertText.length} characters • Press Ctrl+Enter to detect
            </p>
            {alertText.length > 0 && (
              <button
                onClick={() => setAlertText('')}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 border rounded-lg bg-slate-50 text-sm">
              <p className="font-semibold">
                Status: <span className={
                  result.status === 'real_looking' ? 'text-green-600' :
                    result.status === 'suspicious' ? 'text-yellow-600' : 'text-red-600'
                }>
                  {result.status === 'real_looking' ? '✅ Real / Authentic' :
                    result.status === 'suspicious' ? '⚠️ Suspicious' : '🚨 Likely Fake'}
                </span>
              </p>

              <p>Confidence: {Math.round(result.confidence * 100)}%</p>

              {result.warnings?.length > 0 && (
                <>
                  <p className="mt-2 font-semibold">Warnings:</p>
                  <ul className="list-disc list-inside">
                    {result.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </>
              )}

              {result.aiAnalysis && (
                <>
                  <p className="mt-2 font-semibold">AI Analysis:</p>
                  <p>{result.aiAnalysis.reason}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Our AI will analyze the alert message for suspicious patterns, inconsistencies, and known fraud indicators.
            </p>
          </div>
        </div>

        {/* Detect Button */}
        <Button
          onClick={handleDetect}
          disabled={!alertText.trim() || isAnalyzing}
          className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            'Detect Alert'
          )}
        </Button>
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handlePhoneVerified}
      />
    </>
  );
}
