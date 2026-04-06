import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
                    <div className="inline-flex items-center justify-center bg-teal-500/20 p-4 rounded-full mb-4">
                        <Shield className="w-10 h-10 text-teal-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                    <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="p-8 prose prose-slate max-w-none">
                    <p className="text-lg text-slate-700 leading-relaxed mb-8">
                        At Fake Bank Alert Detector, we take your privacy and the security of your financial data seriously.
                        This Privacy Policy clearly outlines exactly how we collect, process, and protect your information.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What Information We Collect</h2>
                    <p className="text-slate-700 mb-6">
                        We collect information you explicitly provide to us when using the platform:
                    </p>
                    <ul className="list-disc pl-6 mb-8 text-slate-700 space-y-2">
                        <li><strong>Account Information:</strong> Your Name, Email Address, and Phone Number (used strictly for authentication).</li>
                        <li><strong>Alert Data:</strong> The raw text and screenshot images of bank alerts that you manually upload for verification.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
                    <p className="text-slate-700 mb-8">
                        The data we collect is used exclusively to provide and improve our service. Specifically, we use your
                        account information to securely authenticate you, and we use the alert data you submit to process mathematical
                        fraud risk analysis. Your previous alerts are securely stored in your personal Dashboard so you can review
                        your verification history.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Third-Party Data Sharing</h2>
                    <p className="text-slate-700 mb-4">
                        We <strong>never</strong> sell your personal data to advertisers. However, because our service relies on
                        advanced API architectures, we securely transmit specific data to necessary third-party partners:
                    </p>
                    <ul className="list-disc pl-6 mb-8 text-slate-700 space-y-2">
                        <li><strong>OpenAI:</strong> The raw text of the bank alerts you upload is securely transmitted to OpenAI (ChatGPT) servers for contextual Natural Language Processing and fraud sentiment analysis.</li>
                        <li><strong>Termii:</strong> Your phone number is securely transmitted to Termii solely for the purpose of receiving SMS Verification OTPs.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Deletion & Your Rights</h2>
                    <p className="text-slate-700 mb-8">
                        You maintain full control over your data. You have the right to request the complete deletion of your account
                        and all associated data. You can easily execute this instantly by navigating to the <strong>Settings</strong> page
                        in your Dashboard and selecting the "Delete Account" option.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
                    <p className="text-slate-700 mb-8">
                        If you have absolutely any questions or concerns regarding this Privacy Policy, please contact our security team at:
                        <br />
                        <a href="mailto:idundunmd3@gmail.com" className="text-teal-600 hover:text-teal-700 font-semibold mt-2 inline-block">
                            idundunmd3@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
