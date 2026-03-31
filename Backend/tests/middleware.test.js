import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// ── Mock User model ──
vi.mock('../src/models/User.js', () => ({
    default: {
        findById: vi.fn(),
    }
}));

import User from '../src/models/User.js';


// ============================================================
// AUTH MIDDLEWARE
// ============================================================
describe('authMiddleware - protect', () => {
    let protect;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Dynamic import to get fresh module
        const mod = await import('../src/middleware/authMiddleware.js');
        protect = mod.protect;
    });

    it('calls next() with valid token', async () => {
        const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);

        User.findById.mockReturnValue({
            select: vi.fn().mockResolvedValue({ _id: 'user123', name: 'Test', email: 'test@test.com' }),
        });

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
    });

    it('returns 401 when no token provided', async () => {
        const req = { headers: {} };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 with malformed token', async () => {
        const req = { headers: { authorization: 'Bearer invalid-token-here' } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 with expired token', async () => {
        // Create a token that expired 1 hour ago
        const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET, { expiresIn: '-1h' });

        const req = { headers: { authorization: `Bearer ${token}` } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await protect(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});


// ============================================================
// PHONE VERIFICATION MIDDLEWARE
// ============================================================
describe('requirePhoneVerified middleware', () => {
    let requirePhoneVerified;

    beforeEach(async () => {
        const mod = await import('../src/middleware/requiredPhoneverified.js');
        requirePhoneVerified = mod.requirePhoneVerified;
    });

    it('calls next() for verified user', () => {
        const req = { user: { isPhoneVerified: true } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        requirePhoneVerified(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 403 with PHONE_VERIFICATION_REQUIRED code for unverified user', () => {
        const req = { user: { isPhoneVerified: false } };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        requirePhoneVerified(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ code: 'PHONE_VERIFICATION_REQUIRED' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 when isPhoneVerified is undefined', () => {
        const req = { user: {} };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        requirePhoneVerified(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});


// ============================================================
// OTP UTILITIES
// ============================================================
describe('phone verification utilities', () => {
    let generateOtp, hashOtp;

    beforeEach(async () => {
        const mod = await import('../src/services/phoneVerificationService.js');
        generateOtp = mod.generateOtp;
        hashOtp = mod.hashOtp;
    });

    it('generates a 6-digit OTP', () => {
        const otp = generateOtp();
        expect(otp).toMatch(/^\d{6}$/);
    });

    it('generates different OTPs each time', () => {
        const otp1 = generateOtp();
        const otp2 = generateOtp();
        // Very unlikely to be the same — not impossible, but statistically safe
        const otps = new Set(Array.from({ length: 20 }, () => generateOtp()));
        expect(otps.size).toBeGreaterThan(1);
    });

    it('hashOtp returns consistent hash for same OTP', () => {
        const otp = '123456';
        const hash1 = hashOtp(otp);
        const hash2 = hashOtp(otp);
        expect(hash1).toBe(hash2);
    });

    it('hashOtp returns different hashes for different OTPs', () => {
        const hash1 = hashOtp('123456');
        const hash2 = hashOtp('654321');
        expect(hash1).not.toBe(hash2);
    });

    it('hashOtp does not return the original OTP', () => {
        const otp = '123456';
        const hash = hashOtp(otp);
        expect(hash).not.toBe(otp);
        expect(hash.length).toBeGreaterThan(6);
    });
});
