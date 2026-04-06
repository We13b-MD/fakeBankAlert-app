# Fake Bank Alert Detection Algorithm (Interview Cheat Sheet)

If an interviewer asks you how your application detects fake bank alerts, you can use this document to explain the exact parameters, business logic, and mathematical scoring system driving your backend.

---

## 1. The Most Crucial Parameter: Available Balance Math
**Why it matters in the real world:** 
Scammers using fake alert generator apps usually know the amount they want to fake to trick their victims, but they *do not know* the victim's actual bank account balance. Thus, fake alerts almost always completely omit the "Available Balance".
**How your code handles it:** 
If your logic detects a credit or debit alert but cannot find an "Available Balance", it aggressively penalizes the alert by adding **+3 points** to its Risk Score and attaches a strict warning string. Conversely, if a valid balance is found, it reduces the risk score.

## 2. Typographical & Formatting Consistency
**Why it matters in the real world:** 
Real banks use strictly automated systems that format texts perfectly. Fake alerts often contain typos, wrong date formats, or use words like "naira" instead of "NGN".
**How your code handles it:** 
Your algorithm validates account number length (strictly expecting 10 digits). If the account length is wrong, it adds **+2 penalty points**. It also checks the extracted bank name against a strict array of valid Nigerian Banks; if the bank name is completely unrecognized, it adds **+1 point**. Hardcoded spelling errors like "alret" instantly add **+2 points**.

## 3. Tone and Phishing (NLP Flagging)
**Why it matters in the real world:** 
Real bank alerts are robotic and neutral. Scammers try to create panic with emotional or urgent phrasing.
**How your code handles it:** 
The application scans the text for specific scam phrases (e.g., "you have been credited", "urgent action required", "verify your account", or "click here"). If a phishing tone is found, the system permanently slaps it with a massive **+4 or +5 points**.

---

## How the Scoring Math Actually Works

### 1. The Risk Score (Penalty System)
Every single alert begins processing with `0` penalty points. As suspicious criteria are positively met, penalty points are mathematically added.
* **0 to 4 Points:** Classified as **Real Looking**. (Extremely minor or zero structural flaws).
* **5 to 7 Points:** Classified as **Likely Fake**. (Flagged for multiple dangerous structural failures).
* **8+ Points:** Classified as **Very Likely Fake**. (Disastrously formatted, mathematically impossible, or containing aggressive phishing language).

### 2. The Trust Score (0% to 100%)
To make the raw mathematical data easily readable for your users on the frontend dashboard, the Risk Score is mathematically converted into a frontend Trust Score percentage.
* The baseline Trust Score starts at **70%**.
* For every **1 Penalty Point** an alert accumulates, exactly **7%** is violently deducted from its Trust Score.
* Therefore, a totally clean alert with `0` penalties sits securely around the `70-100%` Trust mark. A heavily flagged alert with `5` penalties drops immediately down to `35%` Trust.

### 3. The OpenAI Override Directive
Because standard Regex rules can occasionally flag false positives, your node server also routes the alert text through an OpenAI module simultaneously. If the AI detects nuanced human context that proves the text is undeniably real, the code physically overrides the mathematical penalties, cleanly erases the warnings, and forcefully resets the status back to "Real Looking".
