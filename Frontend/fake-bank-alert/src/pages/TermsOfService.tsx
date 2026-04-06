import { ShieldAlert } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-center">
                    <div className="inline-flex items-center justify-center bg-amber-500/20 p-4 rounded-full mb-4">
                        <ShieldAlert className="w-10 h-10 text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
                    <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="p-8 prose prose-slate max-w-none">
                    <p className="text-lg text-slate-700 leading-relaxed mb-8">
                        By accessing or using the Fake Bank Alert Detector application, you agree to be bound by these Terms of Service.
                        If you disagree with any part of the terms, you must not use our service.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Disclaimer of Liability</h2>
                    <p className="text-slate-700 mb-4">
                        <strong>CRITICAL NOTICE:</strong> Fake Bank Alert Detector is an automated mathematical and educational risk-estimation tool.
                        It is <strong>not</strong> a legal financial auditor.
                    </p>
                    <p className="text-slate-700 mb-8">
                        While our algorithms and Artificial Intelligence are highly advanced, they are not infallible. The platform may occasionally result in false positives (marking a real alert as fake) or false negatives (marking a fake alert as real).
                        <strong> You agree that you bear sole responsibility for verifying the actual receipt of funds directly through your official banking application or financial institution before transferring any goods, services, or cash. </strong>
                        Under absolutely no circumstances shall Fake Bank Alert Detector, its developers, or its affiliates be held legally or financially liable for any monetary loss, damages, or disputes arising from your reliance on the verification results provided by this application.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Acceptable Use Policy</h2>
                    <p className="text-slate-700 mb-4">
                        Our platform is built to protect consumers and vendors from fraud. You mathematically agree that you will not use this service to:
                    </p>
                    <ul className="list-disc pl-6 mb-8 text-slate-700 space-y-2">
                        <li><strong>Reverse Engineer:</strong> Repeatedly test generated fake alerts against our system for the explicit purpose of reverse engineering our detection algorithms or improving the quality of fraudulent alerts.</li>
                        <li><strong>Abuse the API:</strong> Attempt to bypass rate limits, perform DDoS attacks, or spam OCR/AI scans aggressively in a manner that degrades service quality for other users.</li>
                        <li><strong>Upload Illegal Material:</strong> Upload images that contain explicit, illegal, or grossly unrelated content outside of financial receipts.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Account Ban & Termination</h2>
                    <p className="text-slate-700 mb-8">
                        We reserve the unconditional right to suspend, terminate, or completely ban any user account immediately and without prior notice or liability if we algorithmically or manually detect any breach of these Terms of Service, particularly regarding the Acceptable Use Policy.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Governing Law</h2>
                    <p className="text-slate-700 mb-8">
                        These Terms shall be governed and construed in accordance with the legal laws surrounding cybercrime and digital services in Nigeria, without regard to its conflict of law provisions.
                    </p>

                    <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Information</h2>
                    <p className="text-slate-700 mb-8">
                        For legal inquiries regarding these terms, please contact:
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
