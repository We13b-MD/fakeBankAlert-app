import { useState } from 'react';
import { Shield, CheckCircle, TrendingUp, ArrowRight, Zap, Lock, BarChart3, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                AI-Powered Detection
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Stop Fake Bank Alerts
                <span className="block text-teal-600 mt-2">Before They Fool You</span>
              </h1>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Protect yourself from fraudulent transaction alerts. Our advanced AI instantly verifies if your bank alert is genuine or fake, giving you peace of mind with every notification.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/dashboard">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setIsVideoOpen(true)}
                  className="border-slate-300 hover:bg-slate-50 px-8 py-6 text-lg"
                >
                  <Play className="w-5 h-5 mr-2 text-teal-600" />
                  See How It Works
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-slate-900">98%</p>
                  <p className="text-sm text-slate-600">Accuracy Rate</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">50K+</p>
                  <p className="text-sm text-slate-600">Alerts Verified</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-900">&lt;2s</p>
                  <p className="text-sm text-slate-600">Response Time</p>
                </div>
              </div>
            </div>

            {/* Right Side - Visual Demo */}
            <div className="relative">
              {/* Main Demo Card */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-3 rounded-xl">
                    <Shield className="w-8 h-8 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Quick Verification</h3>
                    <p className="text-sm text-slate-500">Instant alert analysis</p>
                  </div>
                </div>

                {/* Sample Alert Being Verified */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900 mb-1">Credit Alert: ₦50,000</p>
                      <p className="text-sm text-slate-600 mb-2">GTBank - ****1234</p>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 bg-slate-200 rounded-full flex-1 overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-xs text-slate-500">Analyzing...</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Result */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-900 mb-1">Alert Verified as Real</p>
                      <p className="text-sm text-green-700 mb-3">This transaction appears to be authentic</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-green-200 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: '98%' }}></div>
                        </div>
                        <span className="text-sm font-bold text-green-700">98%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1 */}
              <div className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-4 border border-slate-200 hidden lg:block">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">Secure</p>
                    <p className="font-bold text-slate-900">256-bit SSL</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border border-slate-200 hidden lg:block">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-500">Real-time</p>
                    <p className="font-bold text-slate-900">Analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal Overlay */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/20 animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors border border-white/10 shadow-lg"
              aria-label="Close video"
            >
              <X className="w-6 h-6" />
            </button>

            {/* YouTube Embed */}
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/XIB1TtQDgNE?autoplay=1"
              title="Fake Bank Alert Detector - How it Works"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
}