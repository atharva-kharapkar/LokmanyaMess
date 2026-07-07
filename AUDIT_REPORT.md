# Lokmanya Mess — Complete Audit Report
**Date:** 10 June 2026
**Scope:** Full codebase analysis (App.js + 20 component files + firebase config)

---

## A. CODE QUALITY

### A1. Marathi Text Encoding Issues

| Severity | Location | Issue |
|----------|----------|-------|
| ✅ OK | App.js lines 127–191 | All Marathi Devanagari text (`mr` locale strings) is properly encoded. No broken Unicode sequences (à¤, ðŸ) found. |
| ⚠️ Minor | App.js line 189 | `व्हॉट्सअ‍ॅप` contains a zero-width-joiner artifact. Should be `व्हॉट्सअॅप` (WhatsApp in Marathi) for proper rendering. |

**Verdict:** Marathi encoding is clean overall. No mojibake found.

### A2. Emoji Rendering Issues

All emoji used in the app are standard Unicode emoji, which render natively on modern devices. However, **33 hardcoded emoji instances** should be replaced with Expo vector icons for:
- Cross-platform consistency (older Android emoji may appear as monochrome)
- Accessibility (screen readers handle icons differently from emoji)

| File | Emoji Used | Count |
|------|-----------|-------|
| `HomeTab.js` | 👋 👥 ✅ ⏳ ❌ 💰 📋 💵 💳 📱 | 11 |
| `StatsCard.js` | 📊 👥 🟢 🟠 🔴 ✅ ⏳ | 7 |
| `CustomerCard.js` | 📞 | 1 |
| App.js (Payment flow) | 📋 | 1 |

### A3. Unused / Dead Files Identified

| File | Reason | Action |
|------|--------|--------|
| **`src/components/HomeTab_FIXED.js`** | Duplicate of `HomeTab.js` with minor refactored styling. NOT imported anywhere. App.js imports `./HomeTab`. | **SAFE TO DELETE** |
| **`src/components/CardContainer.js`** | Contains a **circular self-import** (`import CardContainer from './CardContainer'`). Exports as `CustomerCard`. This file is dead code — the real CustomerCard is in `CustomerCard.js`. NOT imported anywhere. | **SAFE TO DELETE** |
| **`src/components/modals/PaymentModal.js`** | An empty modal shell. NOT imported anywhere. The actual payment modal is inline in App.js (lines 991–1021). | **SAFE TO DELETE** |
| **`src/components/TransactionCard.js`** | NOT imported anywhere. Transaction rendering is done inline in PaymentsTab.js. | **SAFE TO DELETE** |

### A4. Other Code Quality Issues

| Issue | Location | Detail |
|-------|----------|--------|
| Overly-large `App.js` | App.js (1164 lines) | All business logic, state, styles, and inline modals are in one file. Should be modularized. |
| Inline styles in components | HomeTab.js, CustomersTab.js, etc. | Many components use inline style objects instead of `StyleSheet.create()`, hurting performance. |
| Dead imports | `CustomersTab.js` imports `StatsCard` but it's used | OK actually it is used |
| Self-import bug | `CardContainer.js` line 8 | `import CardContainer from './CardContainer'` — infinite import, will crash if loaded |

---

## B. DATA VALIDATION

### B1. Date Inputs — No Format Validation

| Location | Field | Validation Status |
|----------|-------|------------------|
| `CustomerModal.js` lines 174–184 | `joinDate` | **NONE** — free-text input, no YYYY-MM-DD regex check |
| App.js line 1004 (inline payment modal) | `payForm.date` | **NONE** — free-text input, no YYYY-MM-DD regex check |
| App.js line 717 | `empForm.joinDate` | Uses `todayStr()` — OK for form initialization |
| App.js line 653 | `paidDate` in `markSal` | Uses `todayStr()` — OK |

**Risk:** Invalid date strings (e.g., "15/03/2026", "March 5", empty string) can be saved to Firestore. This will crash `computeStatus()`, `daysLeft()`, `expiryStr()` since they all `new Date(invalidDate)` which returns `Invalid Date`.

### B2. Phone Number / WhatsApp Number Handling

| Location | Field | Current Behavior | Issue |
|----------|-------|-----------------|-------|
| `CustomerModal.js` lines 96–105 | `phone` | Slice to 10 digits only. Placeholder says "91XXXXXXXXXX" | **BROKEN**: User sees "91XXXXXXXXXX" placeholder but input is sliced to 10 chars. If they enter "919876543210", only "9198765432" is saved. |
| `EmployeeModal.js` lines 137–148 | `phone` | Same 10-digit slice | Same issue |
| App.js line 749 `waSingle()` | WhatsApp URL | `https://wa.me/` + `c.phone` | If user enters "9876543210" (10-digit Indian number), WA link becomes `wa.me/9876543210` — **missing 91 country code**. WhatsApp links REQUIRE full international format. |

**Bug:** Indian 10-digit numbers (e.g., "9876543210") are stored without country code and used directly in WhatsApp links. They must be normalized to "919876543210" for WhatsApp to work.

**Recommendation:** Add auto-detection: if phone length === 10, prepend "91" for WhatsApp links. Store normalized format.

---

## C. PAYMENT SYSTEM REVIEW

### C1. "Record Payment" — Customer Selection ✓

The flow `PaymentsTab → openCustomerPicker → selectCustomerForPayment → openRecordPay(customer)` correctly:
- Opens a searchable customer picker from the Payments tab
- Passes the selected customer to `openRecordPay`
- The payment modal displays the correct customer info (line 1002)

**Verdict: PASS** — Record Payment always opens the selected customer.

### C2. Duplicate Payment Prevention ⚠️

| Check | Status |
|-------|--------|
| Blocks payment if subscription is "active" (status !== 'active') in `openRecordPay` (line 730) | ✅ |
| After payment, updates `joinDate` to payment date (line 676), which triggers status change | ✅ |
| No check for whether a payment was already recorded for the same date/customer | ❌ |

**Bug:** A user can close the payment modal, reopen it, and record another payment for the same customer on the same date. No deduplication check exists.

### C3. Total Collection Calculation ✓

```js
const totalCollection = transactions.reduce(
  (sum, txn) => sum + (Number(txn.amount) || 0), 0
);
```

**Verdict: PASS** — Correctly sums all transaction amounts. Handles NaN gracefully with `|| 0`.

### C4. Payment-Related Bugs

| # | Bug | Location | Impact |
|---|-----|----------|--------|
| 1 | Payment form state (`payForm`) not reset after submission | App.js, `recordPayment()` (line 669) | Next payment form shows stale values |
| 2 | Plan amount mismatch: `PLAN_AMT.Weekly = 500` but might need review | App.js line 41 | Verify Weekly amount is correct for business logic |
| 3 | No validation that payment amount > 0 | App.js line 670 | Only checks `!payForm.amount` — "0" passes |

---

## D. EMPLOYEE SALARY REVIEW

### D1. `markSal()` (App.js lines 647–662)

```js
const markSal = useCallback(async (id) => {
  await setDoc(doc(db,'employees',id), {
    paid: true,
    paidDate: todayStr(),     // ✓ stored
    updatedAt: serverTimestamp()
  }, { merge:true });
}, []);
```

**Verdict:** Correct. Stores both `paid: true` and `paidDate: todayStr()`.

### D2. `markAllSal()` (App.js lines 664–667)

```js
const markAllSal = useCallback(async () => {
  await Promise.all(employees.map(e =>
    setDoc(doc(db,'employees',e.id), {
      paid: true,               // ✓ sets paid
      updatedAt: serverTimestamp()  // ✓ updates timestamp
    }, { merge:true })
  ));
}, [employees]);
```

**BUG:** `markAllSal()` does NOT store `paidDate`. This means:
- After marking all salaries, employee cards show "Salary Paid" (because `paid: true`)
- But `paidDate` may be from a previous month or absent
- The `EmployeeCard.js` logic (lines 128–138) compares `item.paidDate?.slice(0,7)` to current month — if paidDate is missing, `isPaidThisMonth` will be false
- This creates an inconsistency: `paid: true` but `isPaidThisMonth === false`

**Fix needed:** Add `paidDate: todayStr()` to `markAllSal`.

### D3. `paidDate` Consistency

| Method | Sets `paid` | Sets `paidDate` | Sets `updatedAt` |
|--------|------------|-----------------|-------------------|
| `markSal` | ✅ | ✅ `todayStr()` | ✅ |
| `markAllSal` | ✅ | ❌ **MISSING** | ✅ |
| Employee creation | ❌ (default false) | ❌ (not applicable) | ✅ |

### D4. Reporting Improvements

| Issue | Detail |
|-------|--------|
| Viewing salary history | Only most recent `paidDate` is available. No salary history log. |
| Monthly filtering | No way to view which employees were paid in a given month. |

---

## E. SECURITY REVIEW

### E1. PIN Storage — CRITICAL

| Issue | Detail | Severity |
|-------|--------|----------|
| Plain text storage | PINs stored in AsyncStorage with keys `ownerPin`, `workerPin` as plain strings (lines 419, 434) | **HIGH** |
| No encryption | AsyncStorage data is **not encrypted** on Android/iOS by default. Rooted/jailbroken devices can read PINs. | **HIGH** |
| Weak defaults | Default PINs are `123456` and `654321` (lines 382–383) | **MEDIUM** |
| No hashing | No SHA256/bcrypt hashing before storage | **HIGH** |

**Suggestion (without breaking changes):** Use `expo-secure-store` for PIN storage (hardware-backed keystore) instead of AsyncStorage.

### E2. AsyncStorage Usage Audit

| Key | Sensitivity | Current Storage | Suggested |
|-----|-----------|----------------|-----------|
| `lang` | Low | AsyncStorage ✅ | Keep |
| `upiId` | Low | AsyncStorage ✅ | Keep |
| `qrImg` | Low (base64) | AsyncStorage ✅ | Keep |
| `waTemplate` | Low | AsyncStorage ✅ | Keep |
| `admin` | Medium (name, phone) | AsyncStorage as JSON ✅ | Could use SecureStore |
| `ownerPin` | **CRITICAL** | AsyncStorage plain text ❌ | **Must use SecureStore** |
| `workerPin` | **CRITICAL** | AsyncStorage plain text ❌ | **Must use SecureStore** |

### E3. Firebase Security Requirements

| Concern | Detail |
|---------|--------|
| API key exposed | `firebaseConfig.js` contains the API key — this is **normal** for client-side Firebase apps |
| No Firebase Auth | App bypasses authentication entirely. Anyone who decompiles the app can write to Firestore if security rules allow |
| No Security Rules file | No `.firebaserc` or `firestore.rules` in project — **cannot verify** current Firestore security posture |

**Recommendation:** Implement Firebase App Check + Firestore security rules that restrict writes to validated app instances.

### E4. Firestore Write Access Protection

Current write endpoints (all direct Firestore writes with no server-side validation):
- `setDoc` to `customers/{id}` — Name, phone, amount, plan
- `setDoc` to `employees/{id}` — Employee data
- `setDoc` to `transactions/{id}` — Transaction records
- `deleteDoc` to `customers/{id}` — Customer deletion
- `deleteDoc` to `employees/{id}` — Employee deletion

**All writes happen client-side.** No Cloud Functions, no Firebase Auth UID checks. If Firestore security rules are set to `true` for all reads/writes, anyone can wipe the database.

---

## F. UX IMPROVEMENTS — Ranked List

### Priority 1: Quick Wins (1–2 days each)

| # | Improvement | Effort | Impact | File(s) |
|---|-------------|--------|--------|---------|
| 1 | **Fix WhatsApp number normalization** — Auto-prepend "91" to 10-digit Indian numbers for WhatsApp links | 1 hr | **HIGH** — Fixes broken WhatsApp messaging | App.js `waSingle()`, `sendNext()` |
| 2 | **Add YYYY-MM-DD validation** on date inputs in CustomerModal and payment form | 2 hrs | **HIGH** — Prevents app crashes from invalid dates | CustomerModal.js, App.js payment modal |
| 3 | **Fix `markAllSal` missing `paidDate`** — Add `paidDate: todayStr()` | 30 min | **MEDIUM** — Fixes salary tracking inconsistency | App.js |
| 4 | **Replace hardcoded emojis with vector icons** — Swap 33 emoji instances for MaterialIcons/Ionicons/FontAwesome5 | 3 hrs | **MEDIUM** — Better cross-platform consistency | HomeTab.js, StatsCard.js, CustomerCard.js |
| 5 | **Delete dead files** — Remove HomeTab_FIXED.js, CardContainer.js, PaymentModal.js, TransactionCard.js | 15 min | **LOW** — Cleanup | N/A |
| 6 | **Reset payForm after payment** — Clear form state after successful recording | 30 min | **LOW** — UX polish | App.js `recordPayment()` |

### Priority 2: Medium Effort (3–5 days each)

| # | Improvement | Effort | Impact | Notes |
|---|-------------|--------|--------|-------|
| 7 | **Move PINs to expo-secure-store** — Encrypt PIN storage with hardware-backed keystore | 1 day | **CRITICAL** — Security fix | Must install `expo-secure-store` |
| 8 | **Add Firebase Security Rules** — Lock down Firestore with proper validation rules | 1 day | **CRITICAL** — Prevents data loss | Create `firestore.rules` |
| 9 | **Implement monthly collection reports** — Filter transactions by month and show breakdown | 2 days | **HIGH** — Useful for owner | New screen or filter in PaymentsTab |
| 10 | **Add transaction filters** — Filter by date range, payment mode, customer | 2 days | **HIGH** — Useful for data lookup | PaymentsTab |
| 11 | **Add due-date reminders** — Local push notifications for expiring subscriptions | 2 days | **HIGH** — Reduces churn | Requires `expo-notifications` |
| 12 | **Improve WhatsApp bulk messaging** — Sequential sending with progress tracking (current is basic) | 2 days | **MEDIUM** — Better UX | waModal |

### Priority 3: Major Features (1–2 weeks each)

| # | Feature | Effort | Impact | Notes |
|---|---------|--------|--------|-------|
| 13 | **PDF/Excel export** — Generate monthly reports for customers and payments | 1 week | **HIGH** — Professional reporting | Requires `expo-file-system` + `expo-sharing` |
| 14 | **Dashboard charts** — Visual charts for collection trends, active/expired counts | 1 week | **HIGH** — Visual insights | Requires chart library (react-native-chart-kit) |
| 15 | **Renewal history** — Track subscription renewal timeline per customer | 1 week | **MEDIUM** — Audit trail | New Firestore collection needed |
| 16 | **Staff salary reports** — Monthly salary log with paid/pending/download | 3 days | **MEDIUM** — HR feature | New tab or screen |
| 17 | **UPI QR improvements** — Better QR scanning, auto-paste from clipboard | 3 days | **MEDIUM** — Faster payments | PaymentsTab |
| 18 | **Backup/Restore** — Export/import Firestore data to JSON file | 1 week | **MEDIUM** — Data safety | Requires file picker + upload |

---

## BUGS FOUND — Summary

| ID | Severity | Description | File/Line | Status |
|----|----------|-------------|-----------|--------|
| B1 | **HIGH** | WhatsApp links broken for 10-digit Indian numbers (missing "91" prefix) | App.js:749, 761 | Unfixed |
| B2 | **HIGH** | `markAllSal()` does not store `paidDate` — inconsistent with `markSal()` | App.js:664-667 | Unfixed |
| B3 | **HIGH** | PINs stored in plain text in AsyncStorage — no encryption | App.js:419, 434 | Unfixed |
| B4 | **HIGH** | No date format validation on joinDate and paymentDate inputs — can crash app | CustomerModal.js:174, App.js:1004 | Unfixed |
| B5 | **MEDIUM** | Duplicate payments possible — no deduplication check on same customer/date | App.js:669-679 | Unfixed |
| B6 | **MEDIUM** | `CardContainer.js` has circular self-import — will crash if ever loaded | CardContainer.js:8 | Unfixed (file is dead) |
| B7 | **LOW** | Payment form not reset after submission — stale values shown next time | App.js:669-679 | Unfixed |
| B8 | **LOW** | No validation that payment amount > 0 | App.js:670 | Unfixed |
| B9 | **LOW** | Marathi "WhatsApp" has zero-width joiner artifact | App.js:189 | Unfixed |

---

## FILES SAFE TO DELETE

| File | Size (approx) | Reason |
|------|--------------|--------|
| `src/components/HomeTab_FIXED.js` | ~12 KB | Duplicate of HomeTab.js. Not imported anywhere. |
| `src/components/CardContainer.js` | ~2 KB | Dead code with circular self-import. Real CustomerCard is in CustomerCard.js. |
| `src/components/modals/PaymentModal.js` | ~1 KB | Empty shell. Not imported. Real payment modal is inline in App.js. |
| `src/components/TransactionCard.js` | ~2 KB | Not imported anywhere. Transaction rendering is inline in PaymentsTab.js. |

Total recoverable: ~17 KB of dead code.

---

## RECOMMENDED IMPLEMENTATION ORDER

### Phase 1 — Critical Fixes (do first)
1. **B1**: Fix WhatsApp number normalization (10-digit → 91XXXXXXXXXX)
2. **B2**: Fix `markAllSal()` to include `paidDate`
3. **B4**: Add YYYY-MM-DD validation on all date inputs
4. **B3**: Move PIN storage to `expo-secure-store`
5. **B8**: Add Firebase Security Rules

### Phase 2 — Code Cleanup
6. Delete dead files (HomeTab_FIXED.js, CardContainer.js, PaymentModal.js, TransactionCard.js)
7. Replace hardcoded emojis with Expo vector icons
8. Fix payment form reset and add amount > 0 validation
9. Fix Marathi zero-width joiner character

### Phase 3 — UX Improvements (Priority 1)
10. Add monthly collection reports
11. Add transaction filters
12. Add due-date reminders

### Phase 4 — Major Features (Priority 2-3)
13. Dashboard charts
14. PDF/Excel export
15. Renewal history
16. Staff salary reports
17. UPI QR improvements
18. Backup/Restore

---

*End of Audit Report*