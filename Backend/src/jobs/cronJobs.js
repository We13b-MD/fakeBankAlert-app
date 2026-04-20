import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import mongoose from 'mongoose';

// ============================================================
// CRON JOBS — Automated Cleanup Tasks
// ============================================================

/**
 * Job 1: Clean expired OTP tokens (every 10 minutes)
 * Removes phoneVerification data from users whose OTP has expired
 */
function cleanExpiredOTPs() {
    setInterval(async () => {
        try {
            const result = await User.updateMany(
                { 'phoneVerification.expiresAt': { $lt: new Date() } },
                { $unset: { phoneVerification: '' } }
            );

            if (result.modifiedCount > 0) {
                console.log(`[CRON] Cleaned ${result.modifiedCount} expired OTPs`);
            }
        } catch (err) {
            console.error('[CRON] OTP cleanup error:', err.message);
        }
    }, 10 * 60 * 1000); // Every 10 minutes
}

/**
 * Job 2: Clean orphan upload files (every 1 hour)
 * Deletes image files in uploads/ that are older than 30 minutes
 * These are leftovers from failed OCR or server crashes
 */
function cleanOrphanUploads() {
    const uploadsDir = path.resolve('uploads');

    setInterval(() => {
        try {
            if (!fs.existsSync(uploadsDir)) return;

            const files = fs.readdirSync(uploadsDir);
            const thirtyMinAgo = Date.now() - (30 * 60 * 1000);
            let cleaned = 0;

            files.forEach(file => {
                const filePath = path.join(uploadsDir, file);
                try {
                    const stat = fs.statSync(filePath);
                    if (stat.mtimeMs < thirtyMinAgo) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                } catch (err) {
                    // File may have been deleted by another process
                }
            });

            if (cleaned > 0) {
                console.log(`[CRON] Deleted ${cleaned} orphan upload(s)`);
            }
        } catch (err) {
            console.error('[CRON] Upload cleanup error:', err.message);
        }
    }, 60 * 60 * 1000); // Every 1 hour
}

/**
 * Job 3: Clean expired sessions (every 6 hours)
 * Removes expired session documents from MongoDB sessions collection
 */
function cleanExpiredSessions() {
    setInterval(async () => {
        try {
            const db = mongoose.connection.db;
            if (!db) return;

            const sessionsCollection = db.collection('sessions');
            const result = await sessionsCollection.deleteMany({
                expires: { $lt: new Date() }
            });

            if (result.deletedCount > 0) {
                console.log(`[CRON] Cleared ${result.deletedCount} expired session(s)`);
            }
        } catch (err) {
            console.error('[CRON] Session cleanup error:', err.message);
        }
    }, 6 * 60 * 60 * 1000); // Every 6 hours
}

/**
 * Start all cron jobs
 */
export function startCronJobs() {
    cleanExpiredOTPs();
    cleanOrphanUploads();
    cleanExpiredSessions();
    console.log('[CRON] Cleanup jobs started: OTPs (10min), Uploads (1hr), Sessions (6hr)');
}
