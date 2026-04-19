import { useState } from 'react';
import { ChevronDown, HelpCircle, Mail } from 'lucide-react';

const faqData = [
    {
        question: "What is FBA Detector?",
        answer: "FBA Detector is an AI-powered tool designed to help Nigerians verify whether a bank alert (credit or debit notification) is genuine or fake. Scammers often send forged SMS or screenshot alerts to trick people — our technology catches them in seconds."
    },
    {
        question: "How does the alert detection work?",
        answer: "You can verify an alert in two ways: paste the alert text or upload a screenshot image. Our system runs it through a multi-layered analysis — checking formatting patterns, sender details, known bank templates, and AI-driven anomaly detection to determine if it's real or fake. You get a trust score and a detailed breakdown of findings."
    },
    {
        question: "Which Nigerian banks are supported?",
        answer: "FBA Detector supports alerts from all major Nigerian banks including GTBank, Access Bank, First Bank, UBA, Zenith Bank, Fidelity Bank, Sterling Bank, Stanbic IBTC, Union Bank, Wema Bank, and many more. Our system continuously learns new bank formats as they evolve."
    },
    {
        question: "Is it free to use?",
        answer: "Yes! FBA Detector is completely free to sign up and start using. You can create an account, verify alerts, and view your alert history at no cost. We believe everyone deserves protection from fraud."
    },
    {
        question: "Can I verify alerts using a screenshot?",
        answer: "Absolutely. You can upload a screenshot or photo of the bank alert, and our AI will extract the text using OCR (optical character recognition) and then analyze it for signs of fraud. This is especially useful when you receive alerts as images on WhatsApp or social media."
    },
    {
        question: "How accurate is the detection?",
        answer: "Our AI-powered analysis achieves up to 98% accuracy. Each alert is scored with a trust percentage and flagged with specific warnings if anything looks suspicious. However, we always recommend taking additional precautions — verify large transactions directly with your bank."
    },
    {
        question: "Is my data safe and private?",
        answer: "Yes, your privacy is our priority. All alert data is encrypted and securely stored. We never share your personal information or alert details with third parties. Your verified alerts are only visible to you on your dashboard."
    },
    {
        question: "What does the Trust Score mean?",
        answer: "After analyzing an alert, we give it a Trust Score from 0 to 100. Here's what the scores mean:\n\n• 70–100 (✅ Real / Authentic): The alert matches genuine bank patterns. It appears to be a legitimate transaction.\n\n• 40–69 (⚠️ Suspicious): Something doesn't look right. Proceed with caution — verify the transaction directly with your bank before acting on it.\n\n• 0–39 (🚨 Likely Fake): Multiple red flags detected. This alert is very likely fraudulent. Do NOT release any goods or services based on this alert."
    },
    {
        question: "What should I do if my alert is flagged as Suspicious?",
        answer: "If your alert receives a score between 40–69, we recommend: (1) Check your actual bank app or USSD to confirm the transaction. (2) Call your bank's official customer service number. (3) Do not release goods or services until you confirm the money is truly in your account. A 'Suspicious' score doesn't always mean fake — it means our system found patterns that need extra verification."
    },
];

function FAQItem({ question, answer, isOpen, onToggle }: {
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-teal-400/50 hover:shadow-md">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-slate-50 transition-colors duration-200"
            >
                <span className="font-semibold text-slate-800 text-sm sm:text-base">{question}</span>
                <ChevronDown
                    className={`w-5 h-5 text-teal-600 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <p className="px-6 py-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function FAQs() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl mb-6 shadow-lg shadow-teal-500/20">
                        <HelpCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about FBA Detector and how it protects you from fake bank alerts.
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="space-y-3">
                    {faqData.map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openIndex === index}
                            onToggle={() => handleToggle(index)}
                        />
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-14 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-xl mb-4">
                        <Mail className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Still have questions?</h3>
                    <p className="text-slate-500 text-sm mb-5">Can't find the answer you're looking for? Reach out to our support team.</p>
                    <a
                        href="mailto:support@fbadetector.com"
                        className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors duration-200 shadow-sm shadow-teal-600/20"
                    >
                        <Mail className="w-4 h-4" />
                        Contact Support
                    </a>
                </div>
            </div>
        </section>
    );
}
