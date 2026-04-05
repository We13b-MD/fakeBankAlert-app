import { normalize } from "path";
import Alert from "../models/Alert.js";
import Tesseract from 'tesseract.js'
import fs from 'fs'
import { analyzeAlertWithAi } from '../utils/openaianalyzer.js'

const SCAM_PHRASES = [
  'you have been credited',
  'urgent action required',
  'click the link',
  'verify your account',
  'suspicious transanction',
  'prize won',
  'account locked',
  'security alert'
]

const BANKS = [
  'access bank',
  'access',
  'gtbank',
  'gtb',
  'guaranty trust',
  'gt bank',
  'uba',
  'united bank',
  'zenith',
  'zenith bank',
  'fcmb',
  'first city',
  'kuda',
  'kuda bank',
  'opay',
  'opal',
  'moniepoint',
  'first bank',
  'firstbank',
  'fidelity',
  'stanbic',
  'sterling',
  'wema',
  'polaris',
  'union bank',
  'ecobank',
  'keystone',
  'heritage',
  'jaiz',
  'providus',
  'palmpay',
  'chipper',
]

// CREATE ALERT
export const createAlert = async (req, res) => {
  try {
    const {
      bankName,
      accountNumber,
      amount,
      transactionType,
      description,
      balanceAfterTransaction,
      alertType
    } = req.body;

    // =============================
    // VERIFICATION: Analyze the alert data
    // =============================
    const normalized = (bankName || '').toLowerCase();
    let warnings = [];
    let score = 0;

    // Check if bank name is in known banks list
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

    // Suspicious tone in description
    const suspiciousTone =
      descNormalized.includes('urgent') ||
      descNormalized.includes('click here') ||
      descNormalized.includes('call now') ||
      descNormalized.includes('verify now');

    if (suspiciousTone) {
      score += 5;
      warnings.push('Urgent or phishing-style language detected in description');
    }

    // Legitimacy & Suspicious structural signals
    if (transactionType === 'credit' || transactionType === 'debit') score -= 1;

    if (balanceAfterTransaction && !isNaN(balanceAfterTransaction)) {
      score -= 1;
    } else {
      score += 3;
      warnings.push('Official bank alerts usually display an Available Balance. Missing balance is highly suspicious.');
    }

    // Final status
    let status = 'real_looking';
    if (score >= 5) status = 'likely_fake';
    if (score >= 8) status = 'very_likely_fake';

    // Normalize confidence 0–1
    const confidence = score <= 0 ? 0 : Math.min(score / 10, 1);

    // Trust score (0-100, higher = more trustworthy)
    const trustScore = Math.max(0, Math.min(100, Math.round(70 - (score * 7))));

    // =============================
    // AI ANALYSIS (Optional)
    // =============================
    let aiAnalysis = null;
    try {
      const alertText = `${transactionType === 'credit' ? 'Credit' : 'Debit'} Alert: NGN${Number(amount).toLocaleString()} ${transactionType === 'credit' ? 'credited to' : 'debited from'} your account ${accountNumber} at ${bankName}.${description ? ' ' + description : ''}${balanceAfterTransaction ? ` Available Balance: NGN${Number(balanceAfterTransaction).toLocaleString()}` : ''}`;
      aiAnalysis = await analyzeAlertWithAi(alertText);

      // AI override: if AI says real but rules say fake
      if (aiAnalysis && aiAnalysis.verdict === 'real' && status !== 'real_looking') {
        status = 'real_looking';
        score = Math.min(score, 2);
        warnings = warnings.filter(w =>
          !w.includes('Account number format') &&
          !w.includes('Amount is missing')
        );
      }
    } catch (err) {
      console.warn('AI analysis failed for createAlert:', err.message);
    }

    // =============================
    // SAVE ALERT WITH VERIFICATION DATA
    // =============================
    const alert = await Alert.create({
      user: req.user._id,
      bankName,
      accountNumber,
      amount,
      transactionType,
      description,
      balanceAfterTransaction,
      alertType,
      extracted: {
        bank: bankMatch || bankName,
        amount: String(amount),
        account: accountNumber,
        reference: null,
      },
      warnings,
      confidence,
    });

    return res.status(201).json({
      message: "Alert created and verified",
      alert,
      verification: {
        status,
        confidence,
        trustScore,
        riskScore: score,
        warnings,
        aiAnalysis,
      }
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


// GET ALL USER ALERTS
export const getUserAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json(alerts);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Single aggregation pipeline — all counting done in the database
    const [stats] = await Alert.aggregate([
      { $match: { user: userId } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                totalAlerts: { $sum: 1 },
                fakeAlerts: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: ['$confidence', 0.3] },
                          { $gt: [{ $size: { $ifNull: ['$warnings', []] } }, 0] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                },
                accountsMonitored: { $addToSet: '$accountNumber' }
              }
            }
          ],
          lastAlert: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 1, createdAt: 1 } }
          ],
          recentStats: [
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                fake: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: ['$confidence', 0.3] },
                          { $gt: [{ $size: { $ifNull: ['$warnings', []] } }, 0] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ],
          previousStats: [
            { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                fake: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: ['$confidence', 0.3] },
                          { $gt: [{ $size: { $ifNull: ['$warnings', []] } }, 0] }
                        ]
                      },
                      1,
                      0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    // Extract results (with safe defaults)
    const countData = stats.counts[0] || { totalAlerts: 0, fakeAlerts: 0, accountsMonitored: [] };
    const totalAlerts = countData.totalAlerts;
    const fakeAlerts = countData.fakeAlerts;
    const realAlerts = totalAlerts - fakeAlerts;
    const accountsMonitored = (countData.accountsMonitored || []).filter(Boolean).length;

    // Last alert info
    let lastAlertInfo = null;
    if (stats.lastAlert.length > 0) {
      const lastAlert = stats.lastAlert[0];
      const now = new Date();
      const alertDate = new Date(lastAlert.createdAt);
      const diffMs = now - alertDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      let timeAgo;
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        timeAgo = diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      lastAlertInfo = {
        date: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : alertDate.toLocaleDateString(),
        timeAgo,
        id: lastAlert._id
      };
    }

    // Trends
    const recentTotal = stats.recentStats[0]?.total || 0;
    const previousTotal = stats.previousStats[0]?.total || 0;
    const recentFake = stats.recentStats[0]?.fake || 0;
    const previousFake = stats.previousStats[0]?.fake || 0;

    const calculateTrend = (recent, previous) => {
      if (previous === 0) return recent > 0 ? 100 : 0;
      return Math.round(((recent - previous) / previous) * 100);
    };

    const totalTrend = calculateTrend(recentTotal, previousTotal);
    const fakeTrend = calculateTrend(recentFake, previousFake);

    return res.status(200).json({
      totalAlerts,
      fakeAlerts,
      realAlerts,
      accountsMonitored,
      lastAlert: lastAlertInfo,
      trends: {
        total: { value: Math.abs(totalTrend), isPositive: totalTrend >= 0 },
        fake: { value: Math.abs(fakeTrend), isPositive: fakeTrend <= 0 }
      }
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// GET RECENT ALERT DETAILS (for dashboard display)
export const getRecentAlertDetails = async (req, res) => {
  try {
    const alert = await Alert.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    if (!alert) {
      return res.status(200).json(null);
    }

    // Determine if fake based on confidence and warnings
    const isFake = alert.confidence > 0.3 || (alert.warnings && alert.warnings.length > 0);

    const alertDetails = {
      id: alert._id,
      message: `${alert.transactionType === 'credit' ? 'Credit' : 'Debit'} Alert: ₦${alert.amount?.toLocaleString() || '0'}`,
      status: isFake ? 'Fake' : 'Real',
      date: new Date(alert.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timestamp: new Date(alert.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      bank: alert.bankName || 'Unknown Bank',
      accountNumber: alert.accountNumber ? `****${alert.accountNumber.slice(-4)}` : '****0000',
      fullAccountNumber: alert.accountNumber || 'N/A',
      amount: `₦${alert.amount?.toLocaleString() || '0'}`,
      type: alert.transactionType === 'credit' ? 'Credit' : 'Debit',
      transactionId: alert.extracted?.reference || `TXN${alert._id.toString().slice(-10).toUpperCase()}`,
      reference: alert.extracted?.reference || 'N/A',
      balance: alert.balanceAfterTransaction ? `₦${alert.balanceAfterTransaction.toLocaleString()}` : 'N/A',
      description: alert.description || alert.ocrText?.slice(0, 100) || 'Alert detected via text analysis',
      verificationMethod: 'AI Analysis + Rule-based Detection',
      confidence: Math.round((1 - alert.confidence) * 100),
      warnings: alert.warnings || []
    };

    return res.status(200).json(alertDetails);

  } catch (err) {
    console.error('Recent alert details error:', err);
    return res.status(500).json({ message: err.message });
  }
};


// DETECT TEXT ALERT
export const detectTextAlert = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Alert text is required" });
    }

    const normalized = text.toLowerCase();
    let warnings = [];
    let score = 0;

    // =============================
    // BASIC EXTRACTIONS (broadened for OCR text)
    // =============================

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
      text.match(/(\*{2,}[0-9]{4,})/i) ||
      text.match(/([0-9]{10})/);

    const bankMatch = BANKS.find(bank =>
      normalized.includes(bank.toLowerCase())
    );

    // Transaction type signals
    const hasCR = /\b(cr|credit|credited)\b/i.test(text);
    const hasDR = /\b(dr|debit|debited)\b/i.test(text);
    const hasAvailBal = /\b(avail|available)\s*(bal|balance)\b/i.test(text);
    const hasDate = /\b(date|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/i.test(text);
    const maskedAccountPattern = /\*{2,}\d{2,4}/.test(text);
    const hasAmt = /\b(amt|amount)\b/i.test(text);
    const hasBal = /\b(bal|balance)\b/i.test(text);
    const hasTransKeyword = /\b(transfer|transaction|txn|trx|payment)\b/i.test(text);

    // =============================
    // LEGITIMACY SIGNALS (Reduce Score)
    // =============================
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

    // =============================
    // SUSPICIOUS SIGNALS (Increase Score)
    // =============================
    if (!amountMatch) {
      score += 3;
      warnings.push("Amount not detected");
    }

    if (!acctMatch) {
      score += 2;
      warnings.push("Account number not detected");
    }

    if (!bankMatch) score += 1;

    if (!hasAvailBal) {
      score += 3;
      warnings.push("Official bank alerts usually display an Available Balance. Missing balance is highly suspicious.");
    }

    // =============================
    // STRICT RECEIPT & OCR RULES
    // =============================
    if (refMatch) {
      if (refMatch[1].length < 10) {
        score += 3;
        warnings.push(`Suspiciously short Transaction Reference detected (${refMatch[1].length} chars). Real receipts use 12+ characters.`);
      }
    } else {
      score += 2;
      warnings.push("No Transaction Reference/ID detected. Receipts usually contain long reference numbers.");
    }

    if (amountMatch) {
      const rawAmount = amountMatch[1];
      // If amount is >= 1,000, enforce strict programmatic mathematical comma formatting
      if (parseFloat(rawAmount.replace(/,/g, '')) >= 1000) {
        const hasPerfectSyntax = /^[1-9]\d{0,2}(,\d{3})*\.\d{2}$/.test(rawAmount);
        if (!hasPerfectSyntax) {
          score += 4;
          warnings.push(`Poorly formatted amount syntax ("${rawAmount}"). Bank software strictly enforces perfect comma separators and 2 decimal points.`);
        }
      }
    }

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

    // =============================
    // FINAL DECISION LOGIC
    // =============================
    let status = "real_looking";

    if (score >= 5) status = "likely_fake";
    if (score >= 8) status = "very_likely_fake";

    // Normalize confidence 0–1 (clamp negative scores to 0 = very confident real)
    const confidence = score <= 0 ? 0 : Math.min(score / 10, 1);

    // =============================
    // AI ANALYSIS (Optional)
    // =============================
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeAlertWithAi(text);
      // If AI says it's real but rule-based says fake, trust AI more
      if (aiAnalysis && aiAnalysis.verdict === 'real' && status !== 'real_looking') {
        status = 'real_looking';
        score = Math.min(score, 2);
        warnings = warnings.filter(w =>
          !w.includes('Amount not detected') &&
          !w.includes('Account number not detected')
        );
      }
    } catch (err) {
      console.warn("AI analysis failed:", err.message);
    }

    // =============================
    // TRANSACTION TYPE
    // =============================
    let transactionType = "credit"; // default
    if (hasDR) transactionType = "debit";
    else if (hasCR) transactionType = "credit";

    // =============================
    // SAVE ALERT
    // =============================
    await Alert.create({
      user: req.user._id,
      bankName: bankMatch || "unknown",
      accountNumber: acctMatch ? acctMatch[1] : "unknown",
      amount: amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : 0,
      transactionType,
      description: "Text-based alert detection (weighted scoring)",
      extracted: {
        bank: bankMatch || null,
        amount: amountMatch ? amountMatch[1] : null,
        reference: refMatch ? refMatch[1] : null,
        account: acctMatch ? acctMatch[1] : null,
      },
      warnings,
      confidence,
      ocrText: text,
    });

    // =============================
    // RESPONSE
    // =============================
    const trustScore = Math.max(0, Math.min(100, Math.round(70 - (score * 7))));

    return res.status(200).json({
      status,
      confidence,
      riskScore: score,
      trustScore,
      extracted: {
        bank: bankMatch || null,
        amount: amountMatch ? amountMatch[1] : null,
        account: acctMatch ? acctMatch[1] : null,
        reference: refMatch ? refMatch[1] : null,
      },
      warnings,
      aiAnalysis,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


// DETECT IMAGE ALERT
export const detectImageAlert = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imagePath = req.file.path;

    // OCR: extract text from image
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");

    // Delete temp image after OCR
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.warn("Failed to delete temp image:", err.message);
    }

    if (!text || text.trim().length < 5) {
      return res.status(400).json({
        error: "Could not extract readable text from image. Please upload a clearer screenshot.",
        ocrText: text || ''
      });
    }

    // Pass extracted text to text detection
    req.body.text = text;
    return detectTextAlert(req, res);
  } catch (err) {
    console.error("Image detection failed:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
