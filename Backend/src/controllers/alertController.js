import { normalize } from "path";
import Alert from "../models/Alert.js";
import Tesseract from 'tesseract.js'
import fs from 'fs'
import { analyzeAlertWithAi } from '../utils/openaianalyzer.js'
// CREATE ALERT

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

    // Legitimacy signals
    if (transactionType === 'credit' || transactionType === 'debit') score -= 1;
    if (balanceAfterTransaction && !isNaN(balanceAfterTransaction)) score -= 1;

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
      // Construct a text representation for AI to analyze
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
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json(alerts);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all user alerts
    const alerts = await Alert.find({ user: userId }).sort({ createdAt: -1 });

    // Total alerts count
    const totalAlerts = alerts.length;

    // Fake alerts (confidence > 0.3 or has warnings)
    const fakeAlerts = alerts.filter(alert =>
      alert.confidence > 0.3 || (alert.warnings && alert.warnings.length > 0)
    ).length;

    // Real alerts
    const realAlerts = totalAlerts - fakeAlerts;

    // Unique accounts monitored (unique account numbers)
    const uniqueAccounts = [...new Set(alerts.map(a => a.accountNumber).filter(Boolean))];
    const accountsMonitored = uniqueAccounts.length;

    // Last alert info
    const lastAlert = alerts[0] || null;
    let lastAlertInfo = null;

    if (lastAlert) {
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

    // Calculate trends (compare last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const recentAlerts = alerts.filter(a => new Date(a.createdAt) >= thirtyDaysAgo);
    const previousAlerts = alerts.filter(a =>
      new Date(a.createdAt) >= sixtyDaysAgo && new Date(a.createdAt) < thirtyDaysAgo
    );

    const calculateTrend = (recent, previous) => {
      if (previous === 0) return recent > 0 ? 100 : 0;
      return Math.round(((recent - previous) / previous) * 100);
    };

    const totalTrend = calculateTrend(recentAlerts.length, previousAlerts.length);
    const recentFake = recentAlerts.filter(a => a.confidence > 0.3 || (a.warnings && a.warnings.length > 0)).length;
    const previousFake = previousAlerts.filter(a => a.confidence > 0.3 || (a.warnings && a.warnings.length > 0)).length;
    const fakeTrend = calculateTrend(recentFake, previousFake);

    return res.status(200).json({
      totalAlerts,
      fakeAlerts,
      realAlerts,
      accountsMonitored,
      lastAlert: lastAlertInfo,
      trends: {
        total: { value: Math.abs(totalTrend), isPositive: totalTrend >= 0 },
        fake: { value: Math.abs(fakeTrend), isPositive: fakeTrend <= 0 } // For fake alerts, lower is better
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
      confidence: Math.round((1 - alert.confidence) * 100), // Convert to "realness" score
      warnings: alert.warnings || []
    };

    return res.status(200).json(alertDetails);

  } catch (err) {
    console.error('Recent alert details error:', err);
    return res.status(500).json({ message: err.message });
  }
};




/*export const detectTextAlert = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Alert text is required' });
    }

    const normalized = text.toLowerCase();

    // Rule-based extraction
    const amountMatch = text.match(/(?:ngn|₦)\s?([\d,]+(?:\.\d{2})?)/i);
    const refMatch = text.match(/ref[:\s]*([a-z0-9]+)/i);
    const acctMatch = text.match(/acct[:\s]*([0-9x]+)/i);
    const bankMatch = BANKS.find(bank => normalized.includes(bank));

    let warnings = [];

    if (!refMatch) warnings.push('Missing reference number');
    if (!amountMatch) warnings.push('Amount format missing');
    if (!bankMatch) warnings.push('Bank name missing or invalid');

    SCAM_PHRASES.forEach(phrase => {
      if (normalized.includes(phrase)) {
        warnings.push(`Scam phrase detected: "${phrase}"`);
      }
    });

    if (
      normalized.includes('alret') ||
      normalized.includes('aler') ||
      normalized.includes('aelrt')
    ) {
      warnings.push('Possible spelling mistakes detected');
    }

    const totalChecks = 3 + SCAM_PHRASES.length + 1;
    const failedChecks = warnings.length;
    const confidence = Number((failedChecks / totalChecks).toFixed(2));

    // AI analysis (optional) - MUST BE INSIDE THE FUNCTION
    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeAlertWithAi(text);
    } catch (err) {
      console.warn('AI analysis failed:', err.message);
    }

    await Alert.create({
      user: req.user._id,
      bankName: bankMatch || 'unknown',
      accountNumber: acctMatch ? acctMatch[1] : 'unknown',
      amount: amountMatch
        ? Number(amountMatch[1].replace(/,/g, ''))
        : 0,
      transactionType: normalized.includes('debit') ? 'debit' : 'credit',
      description: 'Text-based alert detection',
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

    return res.status(200).json({
      status: failedChecks > 0 ? 'likely_fake' : 'real_looking',
      confidence,
      extracted: {
        bank: bankMatch || null,
        amount: amountMatch ? amountMatch[1] : null,
        account: acctMatch ? acctMatch[1] : null,
      },
      warnings,
      aiAnalysis,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};*/


/*export const detectTextAlert = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Alert text is required" });
    }

    const normalized = text.toLowerCase();
    let warnings = [];
    let score = 0; // lower = more legitimate, higher = more suspicious

    // =============================
    // BASIC EXTRACTIONS
    // =============================

    const amountMatch = text.match(/(?:ngn|₦)\s?([\d,]+(?:\.\d{2})?)/i);
    const refMatch = text.match(/ref[:\s]*([a-z0-9]+)/i);
    const acctMatch = text.match(/acct[:\s]*([0-9x*]+)/i);
    const bankMatch = BANKS.find(bank =>
      normalized.includes(bank.toLowerCase())
    );

    const hasCR = normalized.includes(" cr") || normalized.includes("credit");
    const hasDR = normalized.includes(" dr") || normalized.includes("debit");

    const hasAvailBal = normalized.includes("avail bal");
    const hasDate = normalized.includes("date");
    const maskedAccountPattern = /\*{2,}\d{3,4}/.test(text);

    // =============================
    // LEGITIMACY SIGNALS (Reduce Score)
    // =============================

    if (amountMatch) score -= 2;
    if (acctMatch) score -= 2;
    if (hasCR || hasDR) score -= 1;
    if (hasAvailBal) score -= 1;
    if (hasDate) score -= 1;
    if (maskedAccountPattern) score -= 2;

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

    // Bank name missing is NOT critical
    if (!bankMatch) {
      score += 1;
    }

    // Scam phrases (heavy penalty)
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

    // Obvious spelling mistakes
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

    // Normalize confidence between 0–1
    const confidence = Math.min(Math.abs(score) / 10, 1);

    // =============================
    // OPTIONAL AI ANALYSIS
    // =============================

    let aiAnalysis = null;
    try {
      aiAnalysis = await analyzeAlertWithAi(text);
    } catch (err) {
      console.warn("AI analysis failed:", err.message);
    }

    // =============================
    // SAVE ALERT
    // =============================

    await Alert.create({
      user: req.user._id,
      bankName: bankMatch || "unknown",
      accountNumber: acctMatch ? acctMatch[1] : "unknown",
      amount: amountMatch
        ? Number(amountMatch[1].replace(/,/g, ""))
        : 0,
      transactionType: hasDR ? "debit" : hasCR ? "credit" : "unknown",
      description: "Text-based alert detection (weighted scoring)",
      extracted: {
        bank: bankMatch || null,
        amount: amountMatch ? amountMatch[1] : null,
        reference: refMatch ? refMatch[1] : null,
        account: acctMatch ? acctMatch[1] : null,
      },
      warnings,
      confidence,
      riskScore: score,
      ocrText: text,
    });

    return res.status(200).json({
      status,
      confidence,
      riskScore: score,
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
*/


export const detectTextAlert = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Alert text is required" });
    }

    const normalized = text.toLowerCase();
    let warnings = []; // plain JS array of strings
    let score = 0; // lower = more legitimate, higher = more suspicious

    // =============================
    // BASIC EXTRACTIONS (broadened for OCR text)
    // =============================

    // Amount: try multiple patterns from most specific to least
    const amountMatch =
      text.match(/(?:ngn|₦|n)\s?([\d,]+(?:\.\d{2})?)/i) ||           // NGN 50,000.00 or ₦50,000 or N50,000
      text.match(/(?:amt|amount)[:\s]*([\d,]+(?:\.\d{2})?)/i) ||      // Amt: 50,000.00
      text.match(/(?:sum|total)[:\s]*([\d,]+(?:\.\d{2})?)/i) ||       // Sum/Total: 50,000
      text.match(/([\d,]{4,}(?:\.\d{2}))/i) ||                        // Any number with decimals like 50,000.00
      text.match(/([\d,]{4,}\.\d{2})/);                               // Standalone formatted number

    // Reference: try multiple patterns
    const refMatch =
      text.match(/(?:ref|reference|txn|trans)[.:\s]*([a-z0-9-]+)/i) ||
      text.match(/(?:trx|transaction)\s*(?:id|no|ref)?[.:\s]*([a-z0-9-]+)/i);

    // Account: try multiple patterns
    const acctMatch =
      text.match(/(?:acct|account|a\/c|acc)[.:\s]*(?:no\.?\s*)?([0-9x*]{4,})/i) || // Acct: 1234, Account No: 1234
      text.match(/(\*{2,}[0-9]{3,4})/i) ||                           // ****1234 or **5678
      text.match(/([0-9]{10})/);                                      // Standalone 10-digit number (Nigerian acct)

    // Bank name: check against expanded list
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

    // Bank name missing is not critical
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

    // =============================
    // FINAL DECISION LOGIC
    // =============================
    let status = "real_looking"; // JS-friendly

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
      // (OCR text is messy, so rule-based often gives false positives on images)
      if (aiAnalysis && aiAnalysis.verdict === 'real' && status !== 'real_looking') {
        console.log('AI override: AI says real, rules said', status, '- adjusting');
        status = 'real_looking';
        score = Math.min(score, 2); // reduce score significantly
        // Remove structural warnings that are likely OCR artifacts
        warnings = warnings.filter(w =>
          !w.includes('Amount not detected') &&
          !w.includes('Account number not detected')
        );
      }
    } catch (err) {
      console.warn("AI analysis failed:", err.message);
    }

    // =============================
    // TRANSACTION TYPE (fix unknown)
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
      riskScore: score,
      ocrText: text,
    });

    // =============================
    // RESPONSE
    // =============================
    // Convert raw score to a user-friendly 0-100 Trust Score
    // Negative score = very trustworthy, positive = suspicious
    // Range: score -15 → 100, score 0 → 70, score 5 → 35, score 10+ → 0
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


/*export const detectImageAlert = async (req, res) => {
  console.log('Body:', req.body);
  console.log('File:', req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imagePath = req.file.path;

    // Run OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");


    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.warn("Failed to delete temp image:", err.message);
    }

    // Pass extracted text to text detection
    req.body.text = text;
    return detectTextAlert(req, res);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
*/






export const detectImageAlert = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imagePath = req.file.path;

    // =============================
    // OCR: extract text from image
    // =============================
    const { data: { text } } = await Tesseract.recognize(imagePath, "eng");

    // Log OCR output for debugging
    console.log("===== OCR EXTRACTED TEXT =====");
    console.log(text);
    console.log("=============================");

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

    // =============================
    // Pass extracted text to text detection
    // =============================
    req.body.text = text;

    // Call detectTextAlert directly
    return detectTextAlert(req, res);
  } catch (err) {
    console.error("Image detection failed:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
