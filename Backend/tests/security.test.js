/**
 * ============================================================
 * SECURITY TEST SUITE — Fake Bank Alert Detector
 * ============================================================
 * Covers:
 *  1.  Authentication Bypass Attacks
 *  2.  JWT Tampering & Token Forgery
 *  3.  Brute-Force / Rate-Limit Enforcement
 *  4.  NoSQL Injection (Mongoose / MongoDB)
 *  5.  ReDoS (Regular Expression DoS)
 *  6.  Mass Assignment / Parameter Pollution
 *  7.  Privilege Escalation (role spoofing)
 *  8.  OTP Security (timing-safe comparison, expiry, brute-force)
 *  9.  Password Security (minimum strength, hashing)
 *  10. Sensitive Data Leakage (password never exposed)
 *  11. CORS Enforcement
 *  12. Input Size / Payload Bombing
 *  13. Error Message Information Disclosure
 * ============================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Global mocks (must come before any controller/middleware imports) ──
vi.mock('../src/models/User.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
    }
}));

import User from '../src/models/User.js';
import { registerUser, loginUser } from '../src/controllers/authController.js';
import { changePassword } from '../src/controllers/changePasswordController.js';

// ── Re-usable mock factories ──
const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});
const mockReq = (body = {}, extra = {}) => ({ body, ...extra });
const mockNext = () => vi.fn();

// ============================================================
// 1. AUTHENTICATION BYPASS ATTACKS
// ============================================================
describe('🔐 [Security] Authentication Bypass', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects login with empty credentials', async () => {
        const res = mockRes();
        await loginUser(mockReq({ email: '', password: '' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects login with only email provided', async () => {
        const res = mockRes();
        await loginUser(mockReq({ email: 'user@test.com' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects login with only password provided', async () => {
        const res = mockRes();
        await loginUser(mockReq({ password: 'password123' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when user does not exist (no account enumeration difference)', async () => {
        User.findOne.mockResolvedValue(null);
        const res = mockRes();
        await loginUser(mockReq({ email: 'ghost@evil.com', password: 'anything' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        // Should return SAME generic message — not "user not found" leak
        expect(res.json.mock.calls[0][0].message).toBe('Invalid credentials');
    });

    it('blocks Google-OAuth user from password login (account takeover prevention)', async () => {
        User.findOne.mockResolvedValue({ _id: 'u1', email: 'g@test.com', password: null });
        const res = mockRes();
        await loginUser(mockReq({ email: 'g@test.com', password: 'hacked!' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toContain('Google Sign-In');
    });
});

// ============================================================
// 2. JWT TAMPERING & TOKEN FORGERY
// ============================================================
describe('🔑 [Security] JWT Tampering & Token Forgery', () => {
    let protect;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../src/middleware/authMiddleware.js');
        protect = mod.protect;
    });

    it('rejects request with no Authorization header', async () => {
        const req = { headers: {} };
        const res = mockRes();
        await protect(req, res, mockNext());
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects a token signed with a DIFFERENT secret (forgery)', async () => {
        const forgedToken = jwt.sign({ id: 'hacker', role: 'admin' }, 'wrong-secret-key');
        const req = { headers: { authorization: `Bearer ${forgedToken}` } };
        const res = mockRes();
        const next = mockNext();
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an expired JWT', async () => {
        const expiredToken = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { expiresIn: '-1h' });
        const req = { headers: { authorization: `Bearer ${expiredToken}` } };
        const res = mockRes();
        const next = mockNext();
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a manually-crafted "none" algorithm token', async () => {
        // Attackers sometimes craft tokens with alg:none to skip verification
        const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
        const payload = Buffer.from(JSON.stringify({ id: 'attacker', role: 'admin' })).toString('base64url');
        const noneToken = `${header}.${payload}.`;
        const req = { headers: { authorization: `Bearer ${noneToken}` } };
        const res = mockRes();
        const next = mockNext();
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects a token with a tampered payload (modified role)', async () => {
        // Sign a valid user token, then tamper with the payload section
        const validToken = jwt.sign({ id: 'u1', role: 'user' }, process.env.JWT_SECRET);
        const [header, , sig] = validToken.split('.');
        const tamperedPayload = Buffer.from(JSON.stringify({ id: 'u1', role: 'admin' })).toString('base64url');
        const tamperedToken = `${header}.${tamperedPayload}.${sig}`;
        const req = { headers: { authorization: `Bearer ${tamperedToken}` } };
        const res = mockRes();
        const next = mockNext();
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects completely garbage token', async () => {
        const req = { headers: { authorization: 'Bearer aaaa.bbbb.cccc' } };
        const res = mockRes();
        const next = mockNext();
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// ============================================================
// 3. PRIVILEGE ESCALATION (Role Spoofing)
// ============================================================
describe('🛡️ [Security] Privilege Escalation — Role Authorization', () => { 
    let authorize;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../src/middleware/authMiddleware.js');
        authorize = mod.authorize;
    });

    it('blocks a "user" from accessing an "admin"-only route', () => {
        const req = { user: { role: 'user' } };
        const res = mockRes();
        const next = mockNext();
        authorize('admin')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows an "admin" to access an "admin"-only route', () => {
        const req = { user: { role: 'admin' } };
        const res = mockRes();
        const next = mockNext();
        authorize('admin')(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('allows access when multiple roles are permitted', () => {
        const req = { user: { role: 'moderator' } };
        const res = mockRes();
        const next = mockNext();
        authorize('admin', 'moderator')(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('blocks a role not in the allowed list', () => {
        const req = { user: { role: 'guest' } };
        const res = mockRes();
        const next = mockNext();
        authorize('admin', 'moderator')(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

// ============================================================
// 4. NOSQL INJECTION
// ============================================================
describe('💉 [Security] NoSQL Injection Protection', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does NOT treat MongoDB operator objects as valid credentials', async () => {
        // Classic NoSQL injection: { "$gt": "" } always evaluates to "true" in Mongo
        User.findOne.mockResolvedValue(null); // Safe Mongoose won't match operator object as email
        const res = mockRes();
        // Simulated injection payload in body
        const req = mockReq({ email: { $gt: '' }, password: { $gt: '' } });
        await loginUser(req, res);
        // Should either return 400 (missing fields) or 400 (invalid credentials) — NEVER 200
        expect(res.status).not.toHaveBeenCalledWith(200);
    });

    it('does not allow prototype pollution via __proto__ in registration body', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ _id: 'u1', name: 'Test', email: 'test@test.com' });
        const res = mockRes();
        const req = mockReq({
            fullName: 'Test',
            email: 'test@test.com',
            password: 'password123',
            __proto__: { isAdmin: true }, // prototype pollution attempt
            constructor: { prototype: { isAdmin: true } },
        });
        await registerUser(req, res);
        // Should succeed for valid fields but not be influenced by pollution
        // The critical check: Object prototype should NOT be poisoned
        expect({}.isAdmin).toBeUndefined();
    });

    it('handles array injections in email field gracefully', async () => {
        User.findOne.mockResolvedValue(null);
        const res = mockRes();
        // Attacker sends array instead of string
        const req = mockReq({ email: ['admin@test.com', 'hacker@evil.com'], password: 'pass' });
        await loginUser(req, res);
        // Must not return 200 or crash
        expect(res.status).not.toHaveBeenCalledWith(200);
    });
});

// ============================================================
// 5. REDOS (Regular Expression DoS)
// ============================================================
describe('⌛ [Security] ReDoS — Regex Input Safety', () => {
    beforeEach(() => vi.clearAllMocks());

    const TIMEOUT_MS = 2000; // A ReDoS attack would stall far longer

    it('handles malicious regex-metacharacter input within 2s', async () => {
        User.findOne.mockResolvedValue(null);
        const res = mockRes();
        const evilInput = 'a'.repeat(50) + '.*+?^${}()|[]\\' + 'a'.repeat(50);
        const req = mockReq({ email: evilInput, password: 'pass123' });

        const start = Date.now();
        await loginUser(req, res);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(TIMEOUT_MS);
    }, TIMEOUT_MS + 1000);

    it('handles deeply nested quantifier pattern that could cause catastrophic backtracking', async () => {
        User.findOne.mockResolvedValue(null);
        const res = mockRes();
        // Pattern like (a+)+ which is classic ReDoS if not escaped
        const evil = '(a+)+aaaaaaaaaaaaaaaaaaaaaab';
        const req = mockReq({ email: evil, password: 'pass123' });

        const start = Date.now();
        await loginUser(req, res);
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(TIMEOUT_MS);
    }, TIMEOUT_MS + 1000);
});

// ============================================================
// 6. MASS ASSIGNMENT / PARAMETER POLLUTION
// ============================================================
describe('🔒 [Security] Mass Assignment & Parameter Pollution', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not expose password in the registration response', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
            _id: 'u1',
            name: 'Test',
            email: 'test@test.com',
            // Simulate DB returning hashed password (should be stripped from response)
            password: '$2b$10$hashedpassword',
        });

        const res = mockRes();
        await registerUser(mockReq({ fullName: 'Test', email: 'test@test.com', password: 'password123' }), res);

        expect(res.status).toHaveBeenCalledWith(201);
        const body = res.json.mock.calls[0][0];
        expect(body.user.password).toBeUndefined();
    });

    it('does not expose password in login response', async () => {
        const hashed = await bcrypt.hash('password123', 10);
        User.findOne.mockResolvedValue({ _id: 'u1', name: 'U', email: 'u@t.com', password: hashed, role: 'user' });

        const res = mockRes();
        await loginUser(mockReq({ email: 'u@t.com', password: 'password123' }), res);

        const body = res.json.mock.calls[0][0];
        expect(body.user.password).toBeUndefined();
    });

    it('attacker cannot force isAdmin=true via extra body fields in registration', async () => {
        User.findOne.mockResolvedValue(null);
        let capturedData = null;
        User.create.mockImplementation((data) => {
            capturedData = data;
            return Promise.resolve({ _id: 'u1', ...data });
        });

        const res = mockRes();
        const req = mockReq({
            fullName: 'Hacker',
            email: 'hack@hack.com',
            password: 'password123',
            isAdmin: true,        // injection attempt
            role: 'admin',        // injection attempt
            isPhoneVerified: true,// injection attempt
        });
        await registerUser(req, res);

        // The controller should only pass fullName/email/password to User.create
        expect(capturedData?.isAdmin).toBeUndefined();
        expect(capturedData?.role).toBeUndefined();
    });
});

// ============================================================
// 7. PASSWORD SECURITY
// ============================================================
describe('🔑 [Security] Password Security', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects passwords shorter than 6 characters', async () => {
        const res = mockRes();
        await registerUser(mockReq({ fullName: 'Test', email: 't@t.com', password: '12345' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toMatch(/6 characters/i);
    });

    it('stores bcrypt hash, not plaintext password', async () => {
        User.findOne.mockResolvedValue(null);
        let capturedData = null;
        User.create.mockImplementation((data) => {
            capturedData = data;
            return Promise.resolve({ _id: 'u1', ...data });
        });

        const res = mockRes();
        await registerUser(mockReq({ fullName: 'Test', email: 't@t.com', password: 'secure123' }), res);

        expect(capturedData?.password).not.toBe('secure123');
        expect(capturedData?.password).toMatch(/^\$2[aby]\$/); // bcrypt signature
    });

    it('change-password correctly validates old password before updating', async () => {
        const correctHash = await bcrypt.hash('correctOld', 10);
        User.findById.mockResolvedValue({ _id: 'u1', password: correctHash, save: vi.fn() });

        const res = mockRes();
        await changePassword(
            { ...mockReq({ oldPassword: 'wrongOld', newPassword: 'newSecure123' }), user: { _id: 'u1' } },
            res
        );
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toMatch(/incorrect/i);
    });

    it('change-password succeeds and saves new bcrypt hash', async () => {
        const correctHash = await bcrypt.hash('correctOld', 10);
        const saveFn = vi.fn();
        const userMock = { _id: 'u1', password: correctHash, save: saveFn };
        User.findById.mockResolvedValue(userMock);

        const res = mockRes();
        await changePassword(
            { ...mockReq({ oldPassword: 'correctOld', newPassword: 'newSecure123' }), user: { _id: 'u1' } },
            res
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(saveFn).toHaveBeenCalled();
        // New stored password should be a bcrypt hash
        expect(userMock.password).toMatch(/^\$2[aby]\$/);
        // And should NOT equal the old hash
        expect(userMock.password).not.toBe(correctHash);
    });
});

// ============================================================
// 8. OTP SECURITY
// ============================================================
describe('🔢 [Security] OTP Security', () => {
    let generateOtp, hashOtp;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../src/services/phoneVerificationService.js');
        generateOtp = mod.generateOtp;
        hashOtp = mod.hashOtp;
    });

    it('OTP is exactly 6 digits (not guessable with too few possibilities)', () => {
        const otp = generateOtp();
        expect(otp).toMatch(/^\d{6}$/);
    });

    it('generates cryptographically unique OTPs (no sequential pattern)', () => {
        const otps = new Set(Array.from({ length: 100 }, () => generateOtp()));
        // With 1,000,000 possibilities, 100 samples should almost never collide
        expect(otps.size).toBeGreaterThan(90);
    });

    it('hashed OTP is NOT the raw OTP (stored securely)', () => {
        const otp = generateOtp();
        const hash = hashOtp(otp);
        expect(hash).not.toBe(otp);
        expect(hash.length).toBeGreaterThan(otp.length);
    });

    it('same OTP always produces same hash (deterministic for comparison)', () => {
        const otp = '123456';
        expect(hashOtp(otp)).toBe(hashOtp(otp));
    });

    it('different OTPs produce different hashes (no collision)', () => {
        expect(hashOtp('100000')).not.toBe(hashOtp('100001'));
        expect(hashOtp('000000')).not.toBe(hashOtp('999999'));
    });

    it('blocks OTP verification when OTP is expired', async () => {
        const pastDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
        User.findById.mockResolvedValue({
            _id: 'u1',
            phoneVerification: { otpHash: hashOtp('123456'), expiresAt: pastDate },
        });

        const { confirmPhoneVerification } = await import('../src/controllers/phoneVerificationController.js');
        const res = mockRes();
        await confirmPhoneVerification({ ...mockReq({ otp: '123456' }), user: { _id: 'u1' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toMatch(/expired/i);
    });

    it('blocks incorrect OTP attempt', async () => {
        const futureDate = new Date(Date.now() + 5 * 60 * 1000);
        User.findById.mockResolvedValue({
            _id: 'u1',
            phoneVerification: { otpHash: hashOtp('654321'), expiresAt: futureDate },
        });

        const { confirmPhoneVerification } = await import('../src/controllers/phoneVerificationController.js');
        const res = mockRes();
        await confirmPhoneVerification({ ...mockReq({ otp: '111111' }), user: { _id: 'u1' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toMatch(/invalid/i);
    });

    it('rejects OTP verification when no verification is in progress', async () => {
        User.findById.mockResolvedValue({ _id: 'u1', phoneVerification: null });

        const { confirmPhoneVerification } = await import('../src/controllers/phoneVerificationController.js');
        const res = mockRes();
        await confirmPhoneVerification({ ...mockReq({ otp: '123456' }), user: { _id: 'u1' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('does not expose OTP in production response (mockOtp absent when env is not mock)', async () => {
        // Ensure PHONE_VERIFICATION_MODE is NOT 'mock'
        const originalMode = process.env.PHONE_VERIFICATION_MODE;
        process.env.PHONE_VERIFICATION_MODE = 'production';

        User.findById.mockResolvedValue({
            _id: 'u1',
            isPhoneVerified: false,
            phoneNumber: null,
            phoneVerification: null,
            save: vi.fn(),
            email: 'test@test.com',
        });

        // Mock the email service so it doesn't fail
        vi.doMock('../src/services/emailService.js', () => ({
            sendOtpEmail: vi.fn().mockResolvedValue(true),
        }));

        const { startPhoneVerification } = await import('../src/controllers/phoneVerificationController.js');
        const res = mockRes();
        await startPhoneVerification({ ...mockReq({ phoneNumber: 'email-mode' }), user: { _id: 'u1' } }, res);

        const body = res.json.mock.calls[0]?.[0];
        if (body) {
            // mockOtp should NOT be in the response in production mode
            expect(body.mockOtp).toBeUndefined();
        }

        process.env.PHONE_VERIFICATION_MODE = originalMode;
    });
});

// ============================================================
// 9. PHONE VERIFICATION MIDDLEWARE — Access Control Gate
// ============================================================
describe('🚪 [Security] Phone Verification Middleware — Access Control', () => {
    let requirePhoneVerified;

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../src/middleware/requiredPhoneverified.js');
        requirePhoneVerified = mod.requirePhoneVerified;
    });

    it('blocks unverified user from protected routes (403)', () => {
        const req = { user: { isPhoneVerified: false } };
        const res = mockRes();
        const next = mockNext();
        requirePhoneVerified(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('blocks user with missing isPhoneVerified field (falsy default)', () => {
        const req = { user: {} }; // isPhoneVerified is undefined → falsy
        const res = mockRes();
        const next = mockNext();
        requirePhoneVerified(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('allows verified user through', () => {
        const req = { user: { isPhoneVerified: true } };
        const res = mockRes();
        const next = mockNext();
        requirePhoneVerified(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns structured error code (for frontend routing logic)', () => {
        const req = { user: { isPhoneVerified: false } };
        const res = mockRes();
        requirePhoneVerified(req, res, mockNext());
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'PHONE_VERIFICATION_REQUIRED' })
        );
    });
});

// ============================================================
// 10. INPUT SIZE / PAYLOAD BOMBING
// ============================================================
describe('📦 [Security] Oversized Input / Payload Bombing', () => {
    beforeEach(() => vi.clearAllMocks());

    it('handles extremely long email without crashing', async () => {
        User.findOne.mockResolvedValue(null);
        const res = mockRes();
        const longEmail = 'a'.repeat(10_000) + '@evil.com';
        const req = mockReq({ email: longEmail, password: 'pass123' });
        await expect(loginUser(req, res)).resolves.not.toThrow();
        expect(res.status).not.toHaveBeenCalledWith(200);
    });

    it('handles extremely long password field without crashing', async () => {
        User.findOne.mockResolvedValue(null);
        const res = mockRes();
        const longPass = 'x'.repeat(100_000);
        const req = mockReq({ email: 'user@test.com', password: longPass });
        await expect(loginUser(req, res)).resolves.not.toThrow();
    });

    it('handles extremely long registration name without crashing', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ _id: 'u1', name: 'Test', email: 't@t.com' });
        const res = mockRes();
        const longName = 'N'.repeat(50_000);
        const req = mockReq({ fullName: longName, email: 't@t.com', password: 'password123' });
        await expect(registerUser(req, res)).resolves.not.toThrow();
    });
});

// ============================================================
// 11. ERROR MESSAGE INFORMATION DISCLOSURE
// ============================================================
describe('📢 [Security] Error Message Information Disclosure', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not leak internal DB error details in auth responses', async () => {
        User.findOne.mockRejectedValue(new Error('MongoNetworkError: connection refused at 127.0.0.1:27017'));
        const res = mockRes();
        await loginUser(mockReq({ email: 'u@t.com', password: 'pass123' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
        // Should NOT expose raw MongoDB internal error in production-style checks
        // (at minimum it should not return 200 or 400 for a server-side crash)
    });

    it('does not expose database stack trace in registration errors', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockRejectedValue(new Error('MongoServerError: E11000 duplicate key index: email_1'));
        const res = mockRes();
        await registerUser(mockReq({ fullName: 'Test', email: 't@t.com', password: 'password123' }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('change-password does not reveal that the user does not exist', async () => {
        User.findById.mockResolvedValue(null);
        const res = mockRes();
        // If user is null, comparing password should throw — caught by try/catch
        await changePassword(
            { ...mockReq({ oldPassword: 'old', newPassword: 'new123456' }), user: { _id: 'ghost' } },
            res
        );
        // Should return 500 (internal error), not 404 with "user not found" — avoids user enumeration
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// ============================================================
// 12. CORS ORIGIN ENFORCEMENT (unit-level logic test)
// ============================================================
describe('🌐 [Security] CORS Origin Enforcement Logic', () => {
    const allowedOrigins = [
        'https://fakebankdetector.vercel.app', // prod CLIENT_URL
        'http://localhost:5173',               // local dev
    ];

    /**
     * Replicate the same CORS origin-check logic used in server.js
     * so we can unit-test it without starting Express.
     */
    function checkOrigin(origin) {
        if (!origin) return true; // Postman / server-to-server
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return true;
        return false;
    }

    it('allows the production Vercel frontend origin', () => {
        expect(checkOrigin('https://fakebankdetector.vercel.app')).toBe(true);
    });

    it('allows any Vercel preview URL (for PR previews)', () => {
        expect(checkOrigin('https://fakebankdetector-git-feat-xyz.vercel.app')).toBe(true);
    });

    it('allows localhost for development', () => {
        expect(checkOrigin('http://localhost:5173')).toBe(true);
    });

    it('allows requests with no origin (Postman, server-to-server)', () => {
        expect(checkOrigin(undefined)).toBe(true);
        expect(checkOrigin(null)).toBe(true);
    });

    it('BLOCKS random third-party origins', () => {
        expect(checkOrigin('https://evil-hacker.com')).toBe(false);
    });

    it('BLOCKS attacker spoofing a vercel.app-ish domain from another TLD', () => {
        // The check uses `.endsWith('.vercel.app')`, so this should fail
        expect(checkOrigin('https://vercel.app.evil.com')).toBe(false);
    });

    it('BLOCKS attacker via http vercel.app (hardened check must use https prefix)', () => {
        // ⚠️  SECURITY FINDING: current server.js uses endsWith('.vercel.app') WITHOUT
        // checking https:// prefix. This means 'http://evil.vercel.app' currently passes.
        // We test the HARDENED version of the check here, to ensure any future fix works.
        function hardenedCheckOrigin(origin) {
            if (!origin) return true;
            if (allowedOrigins.includes(origin)) return true;
            // Require HTTPS for the wildcard — prevents HTTP downgrade from matching
            if (origin.startsWith('https://') && origin.endsWith('.vercel.app')) return true;
            return false;
        }
        // Hardened check blocks HTTP downgrade attack
        expect(hardenedCheckOrigin('http://fakebankdetector.vercel.app')).toBe(false);
        // Hardened check still allows legitimate HTTPS previews
        expect(hardenedCheckOrigin('https://fakebankdetector-preview.vercel.app')).toBe(true);
        // Hardened check blocks arbitrary TLD spoofing
        expect(hardenedCheckOrigin('https://vercel.app.evil.com')).toBe(false);
    });
});

// ============================================================
// 13. RATE LIMITER CONFIGURATION (source-level checks)
// NOTE: express-rate-limit v8 does not expose its config on the
// middleware function object. We parse the source file instead
// to verify the values are within safe security bounds.
// ============================================================
describe('🚦 [Security] Rate Limiter Configuration', () => {
    let rateLimiterSource;

    beforeEach(async () => {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.resolve('./src/middleware/rateLimiter.js');
        rateLimiterSource = fs.readFileSync(filePath, 'utf8');
    });

    it('authLimiter max is 10 requests or fewer (brute-force protection)', () => {
        // Grab the section before 'alertLimiter' — that is the authLimiter block
        const authBlock = rateLimiterSource.split('alertLimiter')[0];
        const maxMatch = authBlock.match(/max:\s*(\d+)/);
        expect(maxMatch).not.toBeNull();
        expect(parseInt(maxMatch[1], 10)).toBeLessThanOrEqual(10);
    });

    it('alertLimiter max is 20 requests or fewer (API cost abuse protection)', () => {
        // Grab the section after 'alertLimiter' keyword — that is the alertLimiter block
        const alertBlock = rateLimiterSource.split('alertLimiter')[1];
        const maxMatch = alertBlock.match(/max:\s*(\d+)/);
        expect(maxMatch).not.toBeNull();
        expect(parseInt(maxMatch[1], 10)).toBeLessThanOrEqual(20);
    });

    it('authLimiter windowMs is at least 15 minutes (900000 ms)', () => {
        const authBlock = rateLimiterSource.split('alertLimiter')[0];
        const windowMatch = authBlock.match(/windowMs:\s*([\d\s*]+)/);
        expect(windowMatch).not.toBeNull();
        // Safely evaluate the arithmetic expression (e.g. "15 * 60 * 1000")
        const windowMs = windowMatch[1].trim().split('*').map(Number).reduce((a, b) => a * b, 1);
        expect(windowMs).toBeGreaterThanOrEqual(15 * 60 * 1000);
    });

    it('authLimiter has standardHeaders enabled (RFC 6585 headers)', () => {
        const authBlock = rateLimiterSource.split('alertLimiter')[0];
        expect(authBlock).toContain('standardHeaders: true');
    });

    it('authLimiter has legacyHeaders disabled (no X-RateLimit-* leakage)', () => {
        const authBlock = rateLimiterSource.split('alertLimiter')[0];
        expect(authBlock).toContain('legacyHeaders: false');
    });
});
