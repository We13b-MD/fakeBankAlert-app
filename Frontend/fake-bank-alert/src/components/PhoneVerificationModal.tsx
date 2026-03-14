import { useState } from 'react';
import { X, Phone, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startPhoneVerification, confirmPhoneVerification } from '@/lib/api';

interface PhoneVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVerified: () => void;
}

type Step = 'phone' | 'otp' | 'success';

export default function PhoneVerificationModal({
    isOpen,
    onClose,
    onVerified,
}: PhoneVerificationModalProps) {
    const [step, setStep] = useState<Step>('phone');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOtp = async () => {
        if (!phoneNumber.trim() || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await startPhoneVerification(phoneNumber);
            setStep('otp');
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.length < 4) {
            setError('Please enter a valid OTP');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await confirmPhoneVerification(otp);
            setStep('success');
            setTimeout(() => {
                onVerified();
                onClose();
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to verify OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep('phone');
        setPhoneNumber('');
        setOtp('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Phone Verification</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {step === 'phone' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-8 h-8 text-teal-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                    Verify Your Phone Number
                                </h3>
                                <p className="text-sm text-slate-500">
                                    To use the alert detection feature, please verify your phone number.
                                    We'll send you a one-time password (OTP).
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="e.g. +234 801 234 5678"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    onClick={handleSendOtp}
                                    disabled={isLoading || !phoneNumber.trim()}
                                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending OTP...
                                        </>
                                    ) : (
                                        'Send OTP'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'otp' && (
                        <>
                            <div className="text-center mb-6">
                                <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="w-8 h-8 text-teal-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                    Enter OTP
                                </h3>
                                <p className="text-sm text-slate-500">
                                    We've sent a 6-digit code to <span className="font-medium text-slate-700">{phoneNumber}</span>.
                                    Enter it below to verify your phone.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        One-Time Password
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="Enter 6-digit OTP"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                                        maxLength={6}
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    onClick={handleVerifyOtp}
                                    disabled={isLoading || otp.length < 4}
                                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify OTP'
                                    )}
                                </Button>

                                <button
                                    onClick={() => {
                                        setStep('phone');
                                        setOtp('');
                                        setError('');
                                    }}
                                    className="w-full text-sm text-slate-500 hover:text-teal-600 transition-colors"
                                >
                                    ← Change phone number
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-6">
                            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">
                                Phone Verified!
                            </h3>
                            <p className="text-sm text-slate-500">
                                Your phone number has been verified. You can now use the alert detection feature.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
