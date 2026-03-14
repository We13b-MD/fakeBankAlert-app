import { useState } from 'react';
import {
  Plus, TrendingUp, TrendingDown, Building2, CreditCard,
  DollarSign, FileText, Send, CheckCircle, AlertTriangle,
  Loader2, RotateCcw, ShieldCheck, ShieldAlert, ShieldX,
  Brain, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAlert, PhoneVerificationRequiredError } from '@/lib/api';
import PhoneVerificationModal from '@/components/PhoneVerificationModal';

interface FormData {
  bankName: string;
  accountNumber: string;
  amount: string;
  transactionType: 'credit' | 'debit' | '';
  description: string;
}

interface FormErrors {
  bankName?: string;
  accountNumber?: string;
  amount?: string;
  transactionType?: string;
}

interface VerificationResult {
  status: 'real_looking' | 'likely_fake' | 'very_likely_fake';
  confidence: number;
  trustScore: number;
  riskScore: number;
  warnings: string[];
  aiAnalysis?: {
    verdict: string;
    confidence: number;
    explanation: string;
  } | null;
}

export default function CreateAlert() {
  const [formData, setFormData] = useState<FormData>({
    bankName: '',
    accountNumber: '',
    amount: '',
    transactionType: '',
    description: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Nigerian banks list
  const nigerianBanks = [
    'Access Bank', 'First Bank of Nigeria', 'Guaranty Trust Bank (GTBank)',
    'United Bank for Africa (UBA)', 'Zenith Bank', 'Fidelity Bank',
    'Union Bank', 'Ecobank', 'Sterling Bank', 'Stanbic IBTC Bank',
    'Wema Bank', 'Polaris Bank', 'Keystone Bank', 'FCMB',
    'Heritage Bank', 'Jaiz Bank', 'Providus Bank', 'Kuda Bank',
    'VFD Microfinance Bank', 'Opay', 'PalmPay', 'Moniepoint', 'Other'
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (verification) setVerification(null);
    if (errorMessage) setErrorMessage('');
  };

  const handleRadioChange = (value: 'credit' | 'debit') => {
    setFormData((prev) => ({ ...prev, transactionType: value }));
    if (errors.transactionType) {
      setErrors((prev) => ({ ...prev, transactionType: undefined }));
    }
    if (verification) setVerification(null);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.bankName) {
      newErrors.bankName = 'Please select a bank';
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length !== 10 || !/^\d{10}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be exactly 10 digits';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!formData.transactionType) {
      newErrors.transactionType = 'Please select a transaction type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setVerification(null);

    try {
      const data = await createAlert({
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        amount: Number(formData.amount),
        transactionType: formData.transactionType as 'credit' | 'debit',
        description: formData.description || undefined,
      });

      setVerification(data.verification);

      // Trigger event to refresh dashboard stats
      window.dispatchEvent(new Event('alert-detected'));
    } catch (err) {
      if (err instanceof PhoneVerificationRequiredError) {
        setShowVerificationModal(true);
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneVerified = () => {
    setShowVerificationModal(false);
    handleSubmit();
  };

  const handleReset = () => {
    setFormData({
      bankName: '',
      accountNumber: '',
      amount: '',
      transactionType: '',
      description: '',
    });
    setErrors({});
    setVerification(null);
    setErrorMessage('');
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'real_looking':
        return {
          label: 'Looks Real',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
          ringColor: 'ring-green-500',
        };
      case 'likely_fake':
        return {
          label: 'Likely Fake',
          color: 'text-amber-700',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: <ShieldAlert className="w-6 h-6 text-amber-600" />,
          ringColor: 'ring-amber-500',
        };
      case 'very_likely_fake':
        return {
          label: 'Very Likely Fake',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: <ShieldX className="w-6 h-6 text-red-600" />,
          ringColor: 'ring-red-500',
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-slate-700',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          icon: <ShieldCheck className="w-6 h-6 text-slate-600" />,
          ringColor: 'ring-slate-500',
        };
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getTrustScoreBarColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Create New Alert</h1>
            </div>
            <p className="text-slate-600">
              Enter transaction details to create and verify if the alert is real or fake
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg border flex items-start gap-3 bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ===== VERIFICATION RESULT CARD ===== */}
          {verification && (
            <div className={`mb-6 rounded-xl border-2 shadow-sm overflow-hidden ${getStatusInfo(verification.status).borderColor}`}>
              {/* Result Header */}
              <div className={`p-5 ${getStatusInfo(verification.status).bgColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 bg-white rounded-xl shadow-sm ring-2 ${getStatusInfo(verification.status).ringColor}`}>
                      {getStatusInfo(verification.status).icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Verification Result</p>
                      <p className={`text-xl font-bold ${getStatusInfo(verification.status).color}`}>
                        {getStatusInfo(verification.status).label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-500">Trust Score</p>
                    <p className={`text-3xl font-bold ${getTrustScoreColor(verification.trustScore)}`}>
                      {verification.trustScore}
                    </p>
                  </div>
                </div>

                {/* Trust Score Bar */}
                <div className="mt-4">
                  <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${getTrustScoreBarColor(verification.trustScore)}`}
                      style={{ width: `${verification.trustScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-500">Suspicious</span>
                    <span className="text-xs text-slate-500">Trustworthy</span>
                  </div>
                </div>
              </div>

              {/* Alert Details */}
              <div className="p-5 bg-white">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Alert Saved</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Bank</p>
                    <p className="font-semibold text-slate-900">{formData.bankName || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Type</p>
                    <p className="font-semibold text-slate-900 capitalize">{formData.transactionType || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Amount</p>
                    <p className="font-semibold text-slate-900">₦{Number(formData.amount).toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Account</p>
                    <p className="font-semibold text-slate-900">****{formData.accountNumber?.slice(-4)}</p>
                  </div>
                </div>

                {/* Warnings */}
                {verification.warnings && verification.warnings.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Warnings ({verification.warnings.length})
                    </h4>
                    <ul className="space-y-1.5">
                      {verification.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                          <span className="text-amber-400 mt-0.5">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* No Warnings */}
                {verification.warnings && verification.warnings.length === 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    No suspicious patterns detected
                  </div>
                )}

                {/* AI Analysis */}
                {verification.aiAnalysis && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      AI Analysis
                    </h4>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold capitalize ${verification.aiAnalysis.verdict === 'real' ? 'text-green-700' : 'text-red-700'
                          }`}>
                          {verification.aiAnalysis.verdict === 'real' ? '✅ Real' : '🚨 Likely Fake'}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({Math.round(verification.aiAnalysis.confidence * 100)}% confidence)
                        </span>
                      </div>
                      <p className="text-sm text-purple-800">{verification.aiAnalysis.explanation}</p>
                    </div>
                  </div>
                )}

                {/* Create Another Button */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Button
                    onClick={handleReset}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Another Alert
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ===== FORM CARD (hidden when showing results) ===== */}
          {!verification && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bank Selection */}
                <div>
                  <label htmlFor="bankName" className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    Bank Name
                  </label>
                  <select
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.bankName ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                  >
                    <option value="">Select your bank</option>
                    {nigerianBanks.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  {errors.bankName && (
                    <p className="mt-1 text-xs text-red-500">{errors.bankName}</p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label htmlFor="accountNumber" className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="0123456789"
                    maxLength={10}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.accountNumber ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                  />
                  {errors.accountNumber ? (
                    <p className="mt-1 text-xs text-red-500">{errors.accountNumber}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Enter 10-digit account number</p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <DollarSign className="w-4 h-4 text-slate-500" />
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₦</span>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${errors.amount ? 'border-red-400 bg-red-50' : 'border-slate-300'
                        }`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
                  )}
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                    Transaction Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Credit Option */}
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="transactionType"
                        value="credit"
                        checked={formData.transactionType === 'credit'}
                        onChange={() => handleRadioChange('credit')}
                        className="peer sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg peer-checked:border-green-500 peer-checked:bg-green-50 transition-all hover:border-slate-300 ${errors.transactionType ? 'border-red-300' : 'border-slate-200'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Credit</p>
                            <p className="text-xs text-slate-500">Money received</p>
                          </div>
                        </div>
                      </div>
                    </label>

                    {/* Debit Option */}
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="transactionType"
                        value="debit"
                        checked={formData.transactionType === 'debit'}
                        onChange={() => handleRadioChange('debit')}
                        className="peer sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg peer-checked:border-red-500 peer-checked:bg-red-50 transition-all hover:border-slate-300 ${errors.transactionType ? 'border-red-300' : 'border-slate-200'
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Debit</p>
                            <p className="text-xs text-slate-500">Money sent</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.transactionType && (
                    <p className="mt-2 text-xs text-red-500">{errors.transactionType}</p>
                  )}
                </div>

                {/* Description (Optional) */}
                <div>
                  <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Description
                    <span className="text-xs font-normal text-slate-500">(Optional)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="E.g., Salary payment, Transfer to John..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Create & Verify Alert
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Info Card */}
          {!verification && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">How it works</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Fill in the transaction details from your alert message</li>
                    <li>• Click "Create & Verify Alert" to save and verify</li>
                    <li>• Get instant results with trust score, warnings, and AI analysis</li>
                    <li>• The alert is saved to your dashboard for tracking</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
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