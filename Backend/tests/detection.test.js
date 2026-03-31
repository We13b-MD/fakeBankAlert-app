import { describe, it, expect } from 'vitest';
import { scoreTextAlert, scoreCreateAlert, BANKS, SCAM_PHRASES } from '../src/utils/scoring.js';

// ============================================================
// TEXT DETECTION SCORING
// ============================================================
describe('scoreTextAlert', () => {

    // ── Input Validation ──
    describe('input validation', () => {
        it('rejects empty text', () => {
            const result = scoreTextAlert('');
            expect(result.error).toBe('Alert text is required');
        });

        it('rejects null text', () => {
            const result = scoreTextAlert(null);
            expect(result.error).toBe('Alert text is required');
        });

        it('rejects non-string input', () => {
            const result = scoreTextAlert(123);
            expect(result.error).toBe('Alert text is required');
        });
    });


    // ── Real-Looking Alerts ──
    describe('real bank alerts', () => {
        it('scores a standard GTBank credit alert as real_looking', () => {
            const text = 'Acct: ****1234\nAmt: NGN50,000.00 CR\nDesc: Transfer from John\nAvail Bal: NGN120,000.00\nGTBank';
            const result = scoreTextAlert(text);

            expect(result.status).toBe('real_looking');
            expect(result.confidence).toBe(0);
            expect(result.trustScore).toBeGreaterThanOrEqual(70);
            expect(result.extracted.bank).toBe('gtbank');
            expect(result.extracted.amount).toBeDefined();
            expect(result.warnings).toHaveLength(0);
        });

        it('scores a Zenith debit alert as real_looking', () => {
            const text = 'Zenith Bank: Debit Alert\nAcct: 0123456789\nAmt: NGN10,000.00\nDate: 25/03/2026\nBalance: NGN85,000.00';
            const result = scoreTextAlert(text);

            expect(result.status).toBe('real_looking');
            expect(result.transactionType).toBe('debit');
            expect(result.extracted.bank).toContain('zenith');
        });

        it('recognizes masked account numbers like ****1234', () => {
            const text = 'Credit Alert: NGN25,000.00 to Acct ****5678 at Access Bank. Available Balance: NGN80,000.00';
            const result = scoreTextAlert(text);

            expect(result.extracted.account).toBeDefined();
            expect(result.status).toBe('real_looking');
        });

        it('extracts amount with ₦ symbol', () => {
            const text = 'UBA Alert: ₦15,000.00 credited to Acct 0987654321. Bal: ₦200,000.00';
            const result = scoreTextAlert(text);

            expect(result.extracted.amount).toBeDefined();
            expect(result.extracted.bank).toBe('uba');
        });

        it('detects transaction reference', () => {
            const text = 'GTBank: Credit of NGN30,000.00 to Acct ****4321. Ref: TXN-abc123. Bal: NGN50,000';
            const result = scoreTextAlert(text);

            expect(result.extracted.reference).toBe('TXN-abc123');
        });
    });


    // ── Fake / Suspicious Alerts ──
    describe('fake/suspicious alerts', () => {
        it('detects scam phrase "you have been credited"', () => {
            const text = 'Congratulations! You have been credited with $1,000,000. Click here to claim.';
            const result = scoreTextAlert(text);

            expect(result.status).not.toBe('real_looking');
            expect(result.warnings.some(w => w.includes('Scam phrase detected'))).toBe(true);
        });

        it('detects urgent/phishing language', () => {
            const text = 'URGENT: Your account has been compromised. Call now to verify your details.';
            const result = scoreTextAlert(text);

            expect(result.warnings.some(w => w.includes('Urgent or phishing'))).toBe(true);
            expect(result.riskScore).toBeGreaterThan(0);
        });

        it('flags text with no amount or account number', () => {
            const text = 'Hello, this is a random message with no banking info';
            const result = scoreTextAlert(text);

            expect(result.warnings.some(w => w.includes('Amount not detected'))).toBe(true);
            expect(result.warnings.some(w => w.includes('Account number not detected'))).toBe(true);
        });

        it('rates multiple scam phrases as very_likely_fake', () => {
            const text = 'URGENT ACTION REQUIRED! You have been credited with prize won. Click the link to verify your account now!';
            const result = scoreTextAlert(text);

            expect(result.status).toBe('very_likely_fake');
            expect(result.confidence).toBeGreaterThanOrEqual(0.8);
            expect(result.trustScore).toBeLessThan(30);
        });

        it('detects spelling mistakes like "alret"', () => {
            const text = 'Bank alret: NGN50,000 credited to 0123456789 at GTBank';
            const result = scoreTextAlert(text);

            expect(result.warnings.some(w => w.includes('spelling mistakes'))).toBe(true);
        });
    });


    // ── Edge Cases ──
    describe('edge cases', () => {
        it('handles text with only a bank name', () => {
            const text = 'Access Bank notification';
            const result = scoreTextAlert(text);

            expect(result.extracted.bank).toBe('access bank');
            // Still should warn about missing amount/account
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('handles very short valid text', () => {
            const text = 'NGN5000 CR 0123456789 GTBank Bal 10000';
            const result = scoreTextAlert(text);

            expect(result.extracted.amount).toBeDefined();
            expect(result.extracted.bank).toBeDefined();
        });

        it('confidence is clamped between 0 and 1', () => {
            // Very real alert (negative score) should have confidence 0
            const realText = 'Acct: ****1234\nAmt: NGN50,000.00 CR\nAvail Bal: NGN120,000.00\nDate: 25/03/2026\nGTBank\nTransaction ref: TXN123';
            const realResult = scoreTextAlert(realText);
            expect(realResult.confidence).toBe(0);

            // Very fake alert should have confidence capped at 1
            const fakeText = 'URGENT! You have been credited with prize won. Click the link! Verify your account! Call now! Security alert!';
            const fakeResult = scoreTextAlert(fakeText);
            expect(fakeResult.confidence).toBeLessThanOrEqual(1);
            expect(fakeResult.confidence).toBeGreaterThan(0);
        });

        it('trustScore is between 0 and 100', () => {
            const fakeText = 'URGENT! Prize won! Click the link! Call now!';
            const result = scoreTextAlert(fakeText);
            expect(result.trustScore).toBeGreaterThanOrEqual(0);
            expect(result.trustScore).toBeLessThanOrEqual(100);
        });

        it('correctly identifies Credit vs Debit transaction type', () => {
            const creditText = 'GTBank: NGN10,000.00 credited to Acct ****1234';
            expect(scoreTextAlert(creditText).transactionType).toBe('credit');

            const debitText = 'GTBank: NGN10,000.00 debited from Acct ****1234';
            expect(scoreTextAlert(debitText).transactionType).toBe('debit');
        });
    });
});


// ============================================================
// CREATE ALERT SCORING
// ============================================================
describe('scoreCreateAlert', () => {

    const validPayload = {
        bankName: 'GTBank',
        accountNumber: '0123456789',
        amount: 50000,
        transactionType: 'credit',
        description: 'Transfer from savings',
        balanceAfterTransaction: 120000,
    };

    it('scores a valid alert as real_looking', () => {
        const result = scoreCreateAlert(validPayload);
        expect(result.status).toBe('real_looking');
        expect(result.confidence).toBe(0);
        expect(result.warnings).toHaveLength(0);
    });

    it('flags unrecognized bank name', () => {
        const result = scoreCreateAlert({ ...validPayload, bankName: 'FakeBank XYZ' });
        expect(result.warnings.some(w => w.includes('not in recognized'))).toBe(true);
    });

    it('flags invalid account number (not 10 digits)', () => {
        const result = scoreCreateAlert({ ...validPayload, accountNumber: '12345' });
        expect(result.warnings.some(w => w.includes('Account number format'))).toBe(true);
    });

    it('flags account number with letters', () => {
        const result = scoreCreateAlert({ ...validPayload, accountNumber: 'ABC1234567' });
        expect(result.warnings.some(w => w.includes('Account number format'))).toBe(true);
    });

    it('flags missing amount', () => {
        const result = scoreCreateAlert({ ...validPayload, amount: 0 });
        expect(result.warnings.some(w => w.includes('Amount is missing'))).toBe(true);
    });

    it('flags negative amount', () => {
        const result = scoreCreateAlert({ ...validPayload, amount: -100 });
        expect(result.warnings.some(w => w.includes('Amount is missing'))).toBe(true);
    });

    it('detects scam phrases in description', () => {
        const result = scoreCreateAlert({ ...validPayload, description: 'URGENT ACTION REQUIRED: Verify your account now' });
        expect(result.warnings.some(w => w.includes('Scam phrase'))).toBe(true);
        expect(result.warnings.some(w => w.includes('Urgent or phishing'))).toBe(true);
    });

    it('handles missing optional fields gracefully', () => {
        const result = scoreCreateAlert({
            bankName: 'Access Bank',
            accountNumber: '0123456789',
            amount: 10000,
        });
        // Should not throw, should still produce a result
        expect(result.status).toBeDefined();
        expect(result.trustScore).toBeDefined();
    });

    it('recognizes all supported Nigerian banks', () => {
        const bankNames = ['Access Bank', 'GTBank', 'UBA', 'Zenith Bank', 'FCMB', 'Kuda', 'OPay', 'Moniepoint', 'First Bank', 'Fidelity'];

        bankNames.forEach(bankName => {
            const result = scoreCreateAlert({ ...validPayload, bankName });
            expect(result.warnings.some(w => w.includes('not in recognized'))).toBe(false);
        });
    });
});


// ============================================================
// CONSTANTS
// ============================================================
describe('constants', () => {
    it('BANKS list contains major Nigerian banks', () => {
        const majors = ['gtbank', 'access', 'uba', 'zenith', 'fcmb', 'kuda', 'opay', 'first bank'];
        majors.forEach(bank => {
            expect(BANKS.some(b => b.includes(bank))).toBe(true);
        });
    });

    it('SCAM_PHRASES list is non-empty', () => {
        expect(SCAM_PHRASES.length).toBeGreaterThan(0);
    });
});
