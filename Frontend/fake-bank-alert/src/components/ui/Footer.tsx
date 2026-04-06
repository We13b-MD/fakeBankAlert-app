import { Shield, Mail, Twitter, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Company Info */}
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 p-2 rounded-xl">
                <Shield className="w-6 h-6 text-teal-500" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white leading-tight">FBA</span>
                <span className="text-[10px] text-slate-400 leading-tight -mt-0.5">Detector</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Protecting Nigerians from fake bank alerts with AI-powered verification technology.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://x.com/FBADetector" target="_blank" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/fbadetector" target="_blank" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/faqs" className="text-sm hover:text-teal-500 transition-colors">
                  FAQs
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-teal-500 flex-shrink-0" />
                <a href="mailto:idundunmd3@gmail.com" className="text-sm hover:text-teal-500 transition-colors">
                  idundunmd3@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} FBA Detector. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-teal-500 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-sm text-slate-400 hover:text-teal-500 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}