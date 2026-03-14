import { Shield, Mail, Phone, MapPin, Twitter, Github, Linkedin, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
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
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-slate-800 rounded-lg hover:bg-teal-600 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Report Fraud
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-teal-500 transition-colors">
                  Security
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm">Email</p>
                  <a href="mailto:support@fbadetector.com" className="text-sm hover:text-teal-500 transition-colors">
                    support@fbadetector.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm">Phone</p>
                  <a href="tel:+2341234567890" className="text-sm hover:text-teal-500 transition-colors">
                    +234 123 456 7890
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-teal-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm">Address</p>
                  <p className="text-sm">
                    Lagos, Nigeria
                  </p>
                </div>
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
              © 2025 FBA Detector. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-slate-400 hover:text-teal-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-teal-500 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-teal-500 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}