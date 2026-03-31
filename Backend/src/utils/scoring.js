/**
 * Pure scoring functions extracted from alertController.js
 * These can be unit-tested without any database or network dependencies.
 */

export const SCAM_PHRASES = [
    'you have been credited',
    'urgent action required',
    'click the link',
    'verify your account',
    'suspicious transanction',
    'prize won',
    'account locked',
    'security alert'
];

export const BANKS = [
    'access bank', 'access', 'gtbank', 'gtb', 'guaranty trust', 'gt bank',
    'uba', 'united bank', 'zenith', 'zenith bank', 'fcmb', 'first city',
    'kuda', 'kuda bank', 'opay', 'opal', 'moniepoint', 'first bank',
    'firstbank', 'fidelity', 'stanbic', 'sterling', 'wema', 'polaris',
    'union bank', 'ecobank', 'keystone', 'heritage', 'jaiz', 'providus',
    'palmpay', 'chipper',
];

/**
 * Analyze a text-based bank alert and return scoring results.
 * Pure function — no side effects, no DB, no network.
 */
export function scoreTextAlert(text) {
    if (!text || typeof text !== 'string') {
        return { error: 'Alert text is required' };
    }

    const normalized = text.toLowerCase();
    let warnings = [];
    let score = 0;

    // ── EXTRACTIONS ──
    const amountMatch =
        text.match(/(?:ngn|₦|n)\s?([\d,]+(?:\.\d{2})?)/i) ||
        text.match(/(?:amt|amount)[:\s]*([\d,]+(?:\.\d{2})?)/i) ||
        text.match(/(?:sum|total)[:\s]*([\d,]+(?:\.\d{2})?)/i) ||
        text.match(/([\d,]{4,}(?:\.\d{2}))/i) ||
        text.match(/([\d,]{4,}\.\d{2})/);

    const refMatch =
        text.match(/(?:ref|reference|txn|trans)[.:\s]*([a-z0-9-]+)/i) ||
        text.match(/(?:trx|transaction)\s*(?:id|no|ref)?[.:\s]*([a-z0-9-]+)/i);

    const acctMatch =
        text.match(/(?:acct|account|a\/c|acc)[.:\s]*(?:no\.?\s*)?([0-9x*]{4,})/i) ||
        text.match(/(\*{2,}[0-9]{3,4})/i) ||
        text.match(/([0-9]{10})/);

    const bankMatch = BANKS.find(bank => normalized.includes(bank.toLowerCase()));

    // Transaction type signals
    const hasCR = /\b(cr|credit|credited)\b/i.test(text);
    const hasDR = /\b(dr|debit|debited)\b/i.test(text);
    const hasAvailBal = /\b(avail|available)\s*(bal|balance)\b/i.test(text);
    const hasDate = /\b(date|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/i.test(text);
    const maskedAccountPattern = /\*{2,}\d{2,4}/.test(text);
    const hasAmt = /\b(amt|amount)\b/i.test(text);
    const hasBal = /\b(bal|balance)\b/i.test(text);
    const hasTransKeyword = /\b(transfer|transaction|txn|trx|payment)\b/i.test(text);

    // ── LEGITIMACY SIGNALS (reduce score) ──
    if (amountMatch) score -= 2;
    if (acctMatch) score -= 2;
    if (hasCR || hasDR) score -= 1;
    if (hasAvailBal) score -= 2;
    if (hasDate) score -= 1;
    if (maskedAccountPattern) score -= 2;
    if (hasAmt) score -= 1;
    if (hasBal) score -= 1;
    if (hasTransKeyword) score -= 1;
    if (bankMatch) score -= 2;

    // ── SUSPICIOUS SIGNALS (increase score) ──
    if (!amountMatch) {
        score += 3;
        warnings.push("Amount not detected");
    }

    if (!acctMatch) {
        score += 2;
        warnings.push("Account number not detected");
    }

    if (!bankMatch) score += 1;

    // Scam phrases
    SCAM_PHRASES.forEach(phrase => {
        if (normalized.includes(phrase.toLowerCase())) {
            score += 4;
            warnings.push(`Scam phrase detected: "${phrase}"`);
        }
    });

    // Suspicious tone
    const suspiciousTone =
        normalized.includes("urgent") ||
        normalized.includes("click here") ||
        normalized.includes("call now") ||
        normalized.includes("verify now");

    if (suspiciousTone) {
        score += 5;
        warnings.push("Urgent or phishing-style language detected");
    }

    // Spelling mistakes
    if (
        normalized.includes("alret") ||
        normalized.includes("aelrt") ||
        normalized.includes("aler")
    ) {
        score += 2;
        warnings.push("Possible spelling mistakes detected");
    }

    // ── FINAL DECISION ──
    let status = "real_looking";
    if (score >= 5) status = "likely_fake";
    if (score >= 8) status = "very_likely_fake";

    const confidence = score <= 0 ? 0 : Math.min(score / 10, 1);
    const trustScore = Math.max(0, Math.min(100, Math.round(70 - (score * 7))));

    // Transaction type
    let transactionType = "credit";
    if (hasDR) transactionType = "debit";
    else if (hasCR) transactionType = "credit";

    return {
        status,
        confidence,
        riskScore: score,
        trustScore,
        transactionType,
        extracted: {
            bank: bankMatch || null,
            amount: amountMatch ? amountMatch[1] : null,
            account: acctMatch ? acctMatch[1] : null,
            reference: refMatch ? refMatch[1] : null,
        },
        warnings,
    };
}


/**
 * Score a create-alert payload (structured data, not free text).
 */
export function scoreCreateAlert({ bankName, accountNumber, amount, description, transactionType, balanceAfterTransaction }) {
    const normalized = (bankName || '').toLowerCase();
    let warnings = [];
    let score = 0;

    // Check bank
    const bankMatch = BANKS.find(bank => normalized.includes(bank.toLowerCase()));
    if (!bankMatch) {
        score += 1;
        warnings.push('Bank name not in recognized Nigerian banks list');
    } else {
        score -= 2;
    }

    // Validate account number
    if (!accountNumber || accountNumber.length !== 10 || !/^\d{10}$/.test(accountNumber)) {
        score += 2;
        warnings.push('Account number format is invalid (should be 10 digits)');
    } else {
        score -= 2;
    }

    // Validate amount
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
        score += 3;
        warnings.push('Amount is missing or invalid');
    } else {
        score -= 2;
    }

    // Check description for scam phrases
    const descNormalized = (description || '').toLowerCase();
    SCAM_PHRASES.forEach(phrase => {
        if (descNormalized.includes(phrase.toLowerCase())) {
            score += 4;
            warnings.push(`Scam phrase detected in description: "${phrase}"`);
        }
    });

    // Suspicious tone
    const suspiciousTone =
        descNormalized.includes('urgent') ||
        descNormalized.includes('click here') ||
        descNormalized.includes('call now') ||
        descNormalized.includes('verify now');

    if (suspiciousTone) {
        score += 5;
        warnings.push('Urgent or phishing-style language detected in description');
    }

    // Legitimacy signals
    if (transactionType === 'credit' || transactionType === 'debit') score -= 1;
    if (balanceAfterTransaction && !isNaN(balanceAfterTransaction)) score -= 1;

    // Final status
    let status = 'real_looking';
    if (score >= 5) status = 'likely_fake';
    if (score >= 8) status = 'very_likely_fake';

    const confidence = score <= 0 ? 0 : Math.min(score / 10, 1);
    const trustScore = Math.max(0, Math.min(100, Math.round(70 - (score * 7))));

    return {
        status,
        confidence,
        riskScore: score,
        trustScore,
        warnings,
        bankMatch: bankMatch || bankName,
    };
}
