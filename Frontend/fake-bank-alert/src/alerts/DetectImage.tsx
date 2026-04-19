import { useState, useRef } from "react";
import { Image, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectImageAlert, PhoneVerificationRequiredError } from "@/lib/api";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";

export default function DetectImage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setImageFile(file);
      setFileName(file.name);
      setResult(null);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFile(null);
    setFileName("");
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDetect = async () => {
    if (!imageFile) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const data = await detectImageAlert(imageFile);
      setResult(data);
      window.dispatchEvent(new Event('alert-detected'));
    } catch (err: any) {
      console.error("Detection error:", err.message);
      if (err instanceof PhoneVerificationRequiredError) {
        setShowVerificationModal(true);
      } else {
        setError(err.message || "Failed to analyze the image. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhoneVerified = () => {
    setShowVerificationModal(false);
    handleDetect(); // Auto-retry after verification
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-teal-50 p-2 rounded-lg">
            <Image className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Detect from Image
            </h2>
            <p className="text-sm text-slate-500">
              Upload a screenshot of the alert
            </p>
          </div>
        </div>

        {!selectedImage ? (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-teal-500 transition-colors"
          >
            <Upload className="w-10 h-10 text-slate-400 mb-3" />
            <p className="text-sm font-medium text-slate-700">
              Click to upload
            </p>
            <input
              id="image-upload"
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="mb-4">
            <div className="relative border-2 border-slate-200 rounded-lg overflow-hidden">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-48 object-contain bg-slate-50"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-2">{fileName}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700">
              OCR will extract text and analyze authenticity.
            </p>
          </div>
        </div>

        <Button
          onClick={handleDetect}
          disabled={!imageFile || isAnalyzing}
          className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            "Detect Alert"
          )}
        </Button>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* RESULT DISPLAY */}
        {result && (
          <div className="mt-4 p-4 border rounded-lg bg-slate-50 space-y-3">
            <p className="font-semibold text-lg">
              Status:{" "}
              <span
                className={
                  result.status === "real_looking"
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {result.status === "real_looking"
                  ? "✅ Real Looking"
                  : result.status === "likely_fake"
                    ? "⚠️ Likely Fake"
                    : "🚨 Very Likely Fake"}
              </span>
            </p>

            {/* Trust Score Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Trust Score</span>
                <span className={`font-bold ${(result.trustScore ?? 70) >= 60 ? 'text-green-600' :
                  (result.trustScore ?? 70) >= 35 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                  {result.trustScore ?? 70}/100
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${(result.trustScore ?? 70) >= 60 ? 'bg-green-500' :
                    (result.trustScore ?? 70) >= 35 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                  style={{ width: `${result.trustScore ?? 70}%` }}
                />
              </div>
            </div>

            {/* Extracted data */}
            {result.extracted && (
              <div className="text-sm bg-white p-3 rounded border border-slate-200">
                <p className="font-medium text-slate-700 mb-1">Extracted Info:</p>
                {result.extracted.bank && <p>Bank: <span className="font-medium">{result.extracted.bank}</span></p>}
                {result.extracted.amount && <p>Amount: <span className="font-medium">{result.extracted.amount}</span></p>}
                {result.extracted.account && <p>Account: <span className="font-medium">{result.extracted.account}</span></p>}
                {result.extracted.reference && <p>Reference: <span className="font-medium">{result.extracted.reference}</span></p>}
                {!result.extracted.bank && !result.extracted.amount && !result.extracted.account && (
                  <p className="text-slate-400 italic">No structured data extracted</p>
                )}
              </div>
            )}

            {/* AI Analysis */}
            {result.aiAnalysis && (
              <div className="text-sm bg-white p-3 rounded border border-blue-200">
                <p className="font-medium text-blue-700 mb-1">🤖 AI Analysis:</p>
                <p>Verdict: <span className={`font-medium ${result.aiAnalysis.verdict === 'real' ? 'text-green-600' : 'text-red-600'}`}>
                  {result.aiAnalysis.verdict}
                </span></p>
                {result.aiAnalysis.explanation && (
                  <p className="text-slate-600 mt-1">{result.aiAnalysis.explanation}</p>
                )}
              </div>
            )}

            {result.warnings?.length > 0 && (
              <ul className="text-sm text-red-600 mt-2 list-disc ml-4">
                {result.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}
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