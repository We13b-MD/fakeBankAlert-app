import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ── Mock dependencies BEFORE importing the controller ──
vi.mock('../src/models/User.js', () => ({
    default: {
        findOne: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
    }
}));

import User from '../src/models/User.js';
import { registerUser, loginUser } from '../src/controllers/authController.js';

// Helper to create mock req/res objects
function mockRes() {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res;
}

function mockReq(body = {}) {
    return { body };
}


// ============================================================
// REGISTER
// ============================================================
describe('registerUser', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 if fields are missing', async () => {
        const req = mockReq({ fullName: '', email: '', password: '' });
        const res = mockRes();

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'All fields are required' });
    });

    it('returns 400 if password is too short', async () => {
        const req = mockReq({ fullName: 'Test', email: 'test@test.com', password: '123' });
        const res = mockRes();

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters' });
    });

    it('returns 400 if email already exists', async () => {
        User.findOne.mockResolvedValue({ email: 'test@test.com' });

        const req = mockReq({ fullName: 'Test', email: 'test@test.com', password: 'password123' });
        const res = mockRes();

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Email already registered' });
    });

    it('returns 201 with user and token on success', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({
            _id: 'user123',
            name: 'Test User',
            email: 'test@test.com',
        });

        const req = mockReq({ fullName: 'Test User', email: 'test@test.com', password: 'password123' });
        const res = mockRes();

        await registerUser(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.message).toBe('User registered successfully');
        expect(responseData.user).toBeDefined();
        expect(responseData.user.email).toBe('test@test.com');
        expect(responseData.token).toBeDefined();
    });

    it('hashes password before saving', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockResolvedValue({ _id: 'user123', name: 'Test', email: 'test@test.com' });

        const req = mockReq({ fullName: 'Test', email: 'test@test.com', password: 'password123' });
        const res = mockRes();

        await registerUser(req, res);

        // User.create should have been called with a hashed password, not plaintext
        const createCall = User.create.mock.calls[0][0];
        expect(createCall.password).not.toBe('password123');
        expect(createCall.password.startsWith('$2')).toBe(true); // bcrypt hash
    });
});


// ============================================================
// LOGIN
// ============================================================
describe('loginUser', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 if email or password missing', async () => {
        const req = mockReq({ email: '', password: '' });
        const res = mockRes();

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 for non-existent user', async () => {
        User.findOne.mockResolvedValue(null);

        const req = mockReq({ email: 'nobody@test.com', password: 'password123' });
        const res = mockRes();

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('returns 400 for wrong password', async () => {
        User.findOne.mockResolvedValue({
            _id: 'user123',
            name: 'Test',
            email: 'test@test.com',
            password: await bcrypt.hash('correctpassword', 10),
        });

        const req = mockReq({ email: 'test@test.com', password: 'wrongpassword' });
        const res = mockRes();

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('returns 400 for Google-only user (no password)', async () => {
        User.findOne.mockResolvedValue({
            _id: 'user123',
            name: 'Google User',
            email: 'google@test.com',
            password: null, // Google-only user
        });

        const req = mockReq({ email: 'google@test.com', password: 'anything' });
        const res = mockRes();

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json.mock.calls[0][0].message).toContain('Google Sign-In');
    });

    it('returns 200 with token on successful login', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        User.findOne.mockResolvedValue({
            _id: 'user123',
            name: 'Test User',
            email: 'test@test.com',
            password: hashedPassword,
        });

        const req = mockReq({ email: 'test@test.com', password: 'password123' });
        const res = mockRes();

        await loginUser(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData.message).toBe('Login successful');
        expect(responseData.token).toBeDefined();
        expect(responseData.user.email).toBe('test@test.com');
    });

    it('handles RegExp special characters in username safely', async () => {
        User.findOne.mockResolvedValue(null);

        // These characters could cause ReDoS if not escaped
        const req = mockReq({ email: 'user.*+?^${}()|[]\\@test.com', password: 'password123' });
        const res = mockRes();

        // Should NOT throw an error
        await expect(loginUser(req, res)).resolves.not.toThrow();
        expect(res.status).toHaveBeenCalledWith(400); // user not found
    });

    it('generates a valid JWT token', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        User.findOne.mockResolvedValue({
            _id: 'user123',
            name: 'Test',
            email: 'test@test.com',
            password: hashedPassword,
            role: 'user',
        });

        const req = mockReq({ email: 'test@test.com', password: 'password123' });
        const res = mockRes();

        await loginUser(req, res);

        const token = res.json.mock.calls[0][0].token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        expect(decoded.id).toBe('user123');
        expect(decoded.email).toBe('test@test.com');
    });
});
