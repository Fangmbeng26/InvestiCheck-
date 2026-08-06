# InvestiCheck Backend — Postman Testing Guide

Work through this top to bottom. Each step gives you the **method**, **URL**, **body to paste**, and **what a pass looks like**.

- **Base URL:** `http://localhost:4000`
- Every request with a body: **Body → raw → JSON**
- Steps marked 🔒 need an `Authorization` header (Step 17 explains)

---

## Contents

| Part | Steps | Covers |
|---|---|---|
| [0. Setup](#part-0--setup) | — | Start the server, configure Postman |
| [1. Smoke tests](#part-1--smoke-tests) | 1–3 | Health, docs |
| [2. Discovery](#part-2--discovery) | 4–5 | Questions and complaint types |
| [3. OSINT](#part-3--osint-fr-04--fr-07) | 6–7 | Domain, DNS, TLS, reachability |
| [4. Risk assessment](#part-4--risk-assessment-fr-12--fr-14) | 8–13 | High / Medium / Low / Insufficient / v1 vs v2 |
| [5. Security](#part-5--security-ssrf--validation) | 14–15 | SSRF and URL validation |
| [6. Reports](#part-6--reports-fr-15--fr-16) | 16 | Complaint submission |
| [7. Auth](#part-7--authentication-fr-17) | 17–21 | Signup, login, roles |
| [8. Admin](#part-8--admin-dashboard-fr-18) | 22–26 | Stats, moderation |
| [9. Watchlist](#part-9--watchlist-override-the-cameroon-layer) | 27–30 | Regulator override |
| [10. Edge cases](#part-10--edge-cases-and-limits) | 31–34 | Rate limits, errors |
| [Cleanup](#cleanup) | — | Remove test data |

---

## Part 0 — Setup

### 0.1 Start the server

```powershell
cd D:\IdeaProjects\NTEC\Princess\InvestiCheck-\Backend_project
npm run dev
```

Expect:

```
  InvestiCheck API listening on http://localhost:4000
  API docs: http://localhost:4000/api/docs
  Environment: development | default risk model: v2
  Database connected
```

If you see `Invalid environment configuration`, fix the named variable in `.env` — the server refuses to start with bad config, by design.

### 0.2 Create a Postman environment

Environments (top right) → **+** → name it `InvestiCheck Local`. Add these variables, leaving the last four blank — later steps fill them in:

| Variable | Initial value |
|---|---|
| `baseUrl` | `http://localhost:4000` |
| `token` | *(blank)* |
| `adminToken` | *(blank)* |
| `analysisId` | *(blank)* |
| `reportId` | *(blank)* |
| `watchlistId` | *(blank)* |

Select the environment in the dropdown. Now `{{baseUrl}}` works in every URL.

### 0.3 Optional shortcut

`GET {{baseUrl}}/api/docs` in a browser gives you Swagger UI, where you can fire any request without Postman. Useful for cross-checking.

---

## Part 1 — Smoke tests

### Step 1 — Health check

```
GET {{baseUrl}}/api/health
```

**Pass:** `200`

```json
{ "status": "ok", "database": "connected", "uptimeSeconds": 12 }
```

> `"database": "disconnected"` means MongoDB isn't reachable — check `MONGO_URI`. Steps 1–15 still work without a database; anything that saves or reads records (Steps 12, 16, 22+) will not.

### Step 2 — OpenAPI document

```
GET {{baseUrl}}/api/docs.json
```

**Pass:** `200`, JSON starting `"openapi": "3.0.3"`, with a `paths` object listing every endpoint.

### Step 3 — Security headers

Re-send Step 1 and open the **Headers** tab of the response.

**Pass:** `X-Content-Type-Options: nosniff` and similar are present, and there is **no** `X-Powered-By` header (the Express banner is suppressed).

---

## Part 2 — Discovery

### Step 4 — The questions the system asks

```
GET {{baseUrl}}/api/analysis/indicators
```

**Pass:** `200` with `questions` (7 items), `technicalIndicators` (5 items), and `bands`.

Check these, because the rest of the guide depends on them:

- Each question has `answers: ["yes", "no", "unknown"]` — three-state, not a checkbox
- Each has a `help` string in plain language
- `bands` are `30 / 60 / 100` — the SRS FR-13 boundaries

**The 7 answer keys.** Copy these; every assessment body uses them:

| Key | Weight (v2) | Requirement |
|---|---|---|
| `guaranteedReturns` | 18 | FR-08 |
| `withdrawalProblems` | 18 | FR-11 |
| `unusuallyHighReturns` | 12 | FR-08 |
| `referralRewards` | 10 | FR-09 |
| `taskBasedEarning` | 8 | FR-10 |
| `multiLevelReferral` | 6 | FR-09 |
| `depositBeforeEarning` | 4 | FR-08 |

Behavioural total **76**. The 5 technical indicators (domain age 12, unreachable 4, no HTTPS 4, weak DNS 2, short registration 2) make up the other **24**. Total exactly **100**.

### Step 5 — Complaint categories

```
GET {{baseUrl}}/api/reports/complaint-types
```

**Pass:** `200` with 7 categories, each having a `value` and a human-readable `label`.

Values: `unable_to_withdraw`, `withdrawal_delays`, `account_blocked`, `extra_payment_demanded`, `platform_shutdown`, `misleading_promises`, `other`.

---

## Part 3 — OSINT (FR-04 … FR-07)

### Step 6 — OSINT on a real domain

```
POST {{baseUrl}}/api/analysis/osint
```

```json
{
  "website": "google.com"
}
```

**Pass:** `200`, and all four probes report `"status": "ok"`:

| Probe | Look for |
|---|---|
| `availability` | `reachable: true`, `statusCode: 200` |
| `domain_registration` | `registrationDate` around **1997**, a `registrar`, `ageDays` over 10000 |
| `dns` | 4 nameservers, `hasMx: true` |
| `tls` | `httpsAvailable: true`, `certValid: true`, an `issuer` |

Also check `durationMs` — should be roughly **1500–3000ms**. All four probes run concurrently, so this is the time of the slowest one, not the sum.

> Note the deliberate omission: `website` accepts a **bare hostname**. No `https://` needed — it's added for you.

### Step 7 — Cameroon ccTLD

```
POST {{baseUrl}}/api/analysis/osint
```

```json
{
  "website": "camtel.cm"
}
```

**Pass:** `200` with `domain_registration.status: "ok"` and a registration date around **2009**.

This matters for the dissertation: it confirms Cameroon's `.cm` registry runs an RDAP server. Many ccTLDs don't, so this isn't a given.

**Send it a second time.** `cached` should flip to `true` and `durationMs` drop to near zero.

---

## Part 4 — Risk assessment (FR-12 … FR-14)

### Step 8 — HIGH RISK (the SRS §14 worked example)

This is the example from your specification document.

```
POST {{baseUrl}}/api/analysis
```

```json
{
  "platformName": "Example Investment Platform",
  "website": "example.com",
  "answers": {
    "guaranteedReturns": "yes",
    "referralRewards": "yes",
    "taskBasedEarning": "yes",
    "depositBeforeEarning": "yes",
    "withdrawalProblems": "yes",
    "unusuallyHighReturns": "unknown",
    "multiLevelReferral": "unknown"
  },
  "model": "v2"
}
```

**Pass:** `201` with `riskLevel: "high"` and a score in the **low 60s**.

Things worth reading in the response:

- `coverage` around `0.8` — two answers were `unknown`, so ~20% of the weight was unassessable
- `detectedIndicators` — sorted by points, each with its `source` (the SEC / FTC citation)
- `overrides` — contains **`task_scam_pattern`**, because `taskBasedEarning` and `depositBeforeEarning` are both `yes`. That pair is the FTC's task-scam signature, and it forces a floor of 61 regardless of the weighted total.
- `explanation.narrative` — the plain-English sentence for the results page
- `explanation.disclaimer` — must be present on every result

> **Why not exactly the SRS's 95?** That figure is the v1 model. Run the same body with `"model": "v1"` in Step 12 to see it. Also, the SRS example assumes a 4-month-old domain, whereas the real `example.com` is ~28 years old — so the domain-age indicator contributes 0 here instead of 6.

**Save the id.** Copy `id` from the response into your `analysisId` environment variable. Or automate it — **Scripts → Post-response**:

```javascript
pm.environment.set("analysisId", pm.response.json().id);
```

### Step 9 — LOW RISK (a clean platform)

```
POST {{baseUrl}}/api/analysis
```

```json
{
  "platformName": "Legitimate Test Platform",
  "website": "google.com",
  "answers": {
    "guaranteedReturns": "no",
    "unusuallyHighReturns": "no",
    "withdrawalProblems": "no",
    "referralRewards": "no",
    "multiLevelReferral": "no",
    "taskBasedEarning": "no",
    "depositBeforeEarning": "no"
  }
}
```

**Pass:** `201`, `riskScore: 0`, `riskLevel: "low"`, `coverage: 1`, and `detectedIndicators` empty.

Coverage of exactly 1 means every indicator was assessed — nothing unknown.

### Step 10 — MEDIUM RISK

```
POST {{baseUrl}}/api/analysis
```

```json
{
  "platformName": "Borderline Platform",
  "website": "google.com",
  "answers": {
    "guaranteedReturns": "yes",
    "unusuallyHighReturns": "yes",
    "referralRewards": "yes",
    "withdrawalProblems": "no",
    "multiLevelReferral": "no",
    "taskBasedEarning": "no",
    "depositBeforeEarning": "no"
  }
}
```

**Pass:** `201`, `riskScore: 40` (18 + 12 + 10), `riskLevel: "medium"`, `coverage: 1`.

Note `taskBasedEarning` and `depositBeforeEarning` are both `no` here, so the override from Step 8 does **not** fire.

### Step 11 — INSUFFICIENT DATA (the honesty check)

Send only the two fields FR-02 requires — no answers at all.

```
POST {{baseUrl}}/api/analysis
```

```json
{
  "platformName": "Unknown Platform",
  "website": "google.com"
}
```

**Pass:** `201`, `riskScore: 0`, but **`riskLevel: "insufficient_data"`**, not `"low"`, with `insufficientData: true` and `coverage` around `0.24`.

**This is the most important behaviour in the system.** A score of 0 derived from almost no evidence is not reassurance. Because coverage fell below 0.6, the system refuses to tell the user "Low Risk". Check `unknownIndicators` — it lists exactly what wasn't assessed, and `explanation.notes` says so in plain language.

Contrast this with Step 9: same score of 0, but there coverage was 1, so "Low Risk" was earned.

### Step 12 — v1 vs v2 (the SRS model)

Same body as Step 8, but change the last line:

```json
{
  "platformName": "Example Investment Platform",
  "website": "example.com",
  "answers": {
    "guaranteedReturns": "yes",
    "referralRewards": "yes",
    "taskBasedEarning": "yes",
    "depositBeforeEarning": "yes",
    "withdrawalProblems": "yes",
    "unusuallyHighReturns": "unknown",
    "multiLevelReferral": "unknown"
  },
  "model": "v1"
}
```

**Pass:** `201`, `modelVersion: "v1"`, `coverage: null` (v1 has no such concept), and a **higher score** than Step 8.

Now the overflow. Answer everything `yes` under v1:

```json
{
  "platformName": "Overflow Test",
  "website": "example.com",
  "answers": {
    "guaranteedReturns": "yes",
    "unusuallyHighReturns": "yes",
    "withdrawalProblems": "yes",
    "referralRewards": "yes",
    "multiLevelReferral": "yes",
    "taskBasedEarning": "yes",
    "depositBeforeEarning": "yes"
  },
  "model": "v1"
}
```

**Pass:** `riskScore: 100` but **`uncappedScore` above 100** and **`scoreExceededScale: true`**.

That's the specification defect made visible: FR-12's six weights sum to 120 on a 0–100 scale. v1 reports the overflow rather than hiding it; v2 can't overflow because its weights sum to exactly 100.

### Step 13 — Retrieve a stored assessment

```
GET {{baseUrl}}/api/analysis/{{analysisId}}
```

**Pass:** `200`, the same platform and score you saw in Step 8, with the explanation rebuilt.

Then try a well-formed but non-existent id:

```
GET {{baseUrl}}/api/analysis/000000000000000000000000
```

**Pass:** `404`, `{ "error": "Analysis not found" }`

And a malformed one:

```
GET {{baseUrl}}/api/analysis/not-an-id
```

**Pass:** `400`, `"Validation failed"`

---

## Part 5 — Security (SSRF + validation)

This is the part to screenshot for your dissertation's security chapter.

### Step 14 — SSRF payloads must all be refused

Send each of these to `POST {{baseUrl}}/api/analysis/osint`. **Every one must return `400`.**

| # | Body | Expected message |
|---|---|---|
| 1 | `{"website": "javascript:alert(1)"}` | Only http:// and https:// addresses can be analysed |
| 2 | `{"website": "file:///etc/passwd"}` | Only http:// and https:// addresses can be analysed |
| 3 | `{"website": "ftp://example.com"}` | Only http:// and https:// addresses can be analysed |
| 4 | `{"website": "http://127.0.0.1/admin"}` | That address points to a private or reserved network |
| 5 | `{"website": "http://localhost:8080"}` | That address points to a private or reserved network |
| 6 | `{"website": "http://169.254.169.254/latest/meta-data/"}` | That address points to a private or reserved network |
| 7 | `{"website": "http://10.0.0.5"}` | That address points to a private or reserved network |
| 8 | `{"website": "http://192.168.1.1"}` | That address points to a private or reserved network |
| 9 | `{"website": "http://[::1]/"}` | That address points to a private or reserved network |
| 10 | `{"website": "https://user:pass@example.com"}` | Remove the username and password from the address |
| 11 | `{"website": "http://example.com:22"}` | That port cannot be analysed |

**Payload 6 is the one that matters most.** `169.254.169.254` is the cloud instance-metadata address — on a deployed server, reaching it can expose credentials. If any of these returns `200`, stop and report it.

Repeat payloads 1, 4 and 6 against `POST {{baseUrl}}/api/analysis` (with a `platformName` added) — same refusals apply there.

### Step 15 — URL validation both ways (FR-03)

**Should be ACCEPTED** — send to `/api/analysis/osint`:

```json
{ "website": "example.com" }
```

**Pass:** `200`. A bare hostname is how most non-technical users type an address; it's normalised to `https://example.com/`. Check `osint.website` in the response.

Also accepted: `www.example.com`, `https://example.com`, `http://example.com/path?q=1`, `EXAMPLE.COM`.

**Should be REJECTED:**

| Body | Expected |
|---|---|
| `{"website": "not a url"}` | `400` — Enter a valid website address |
| `{"website": ""}` | `400` — Validation failed |
| `{}` | `400` — Validation failed, `details[0].field: "website"` |

---

## Part 6 — Reports (FR-15, FR-16)

> ⚠️ **Rate limit: 5 submissions per hour.** Don't burn them on retries — get the body right first.

### Step 16 — Submit a report

```
POST {{baseUrl}}/api/reports
```

```json
{
  "platformName": "Example Investment Platform",
  "website": "example.com",
  "complaintType": "extra_payment_demanded",
  "description": "I deposited 50000 FCFA and completed the daily tasks as instructed. When I tried to withdraw my earnings I was told to pay a release fee first. After paying, my account was blocked."
}
```

**Pass:** `201`, with `report.status: "pending"`.

**`pending` is the point.** Nothing counts this report yet — not the admin statistics, not the risk engine's corroboration rule. It has to be reviewed by an admin first (Step 25). Without that, anyone could file complaints about a competitor and move their risk score.

Save `report.id` into `reportId`.

**Validation checks** (each should be `400`):

```json
{ "platformName": "Test", "complaintType": "unable_to_withdraw", "description": "too short" }
```
→ description must be at least 10 characters

```json
{ "platformName": "Test", "complaintType": "made_up_category", "description": "A long enough description here." }
```
→ `complaintType` must be one of the seven from Step 5

---

## Part 7 — Authentication (FR-17)

### Step 17 — Sign up

```
POST {{baseUrl}}/api/auth/signup
```

```json
{
  "firstName": "Test",
  "lastName": "User",
  "email": "test.user@example.com",
  "password": "a-strong-test-password",
  "country": "Cameroon"
}
```

**Pass:** `201`. Check the `user` object carefully:

- ✅ `country: "Cameroon"` is present — it used to be silently discarded
- ✅ `role: "user"`
- ✅ **No `password` field anywhere in the response** — search the raw response for `"password"`; it must not appear
- ✅ A `token` is returned

Save the token:

```javascript
pm.environment.set("token", pm.response.json().token);
```

Then set the header on any 🔒 request:

```
Authorization: Bearer {{token}}
```

Or use **Authorization → Type: Bearer Token → Token: `{{token}}`**.

### Step 18 — Duplicate signup

Send Step 17 again, unchanged.

**Pass:** `409`, "An account with that email already exists".

### Step 19 — Weak input rejection

```json
{ "firstName": "A", "lastName": "B", "email": "test2@example.com", "password": "short" }
```
**Pass:** `400` — password must be at least 8 characters

```json
{ "firstName": "A", "lastName": "B", "email": "not-an-email", "password": "long-enough-password" }
```
**Pass:** `400` — invalid email

### Step 20 — Login and the enumeration check

```
POST {{baseUrl}}/api/auth/login
```

**A — correct credentials:**

```json
{ "email": "test.user@example.com", "password": "a-strong-test-password" }
```
**Pass:** `200`, returns `user` and `token`.

**B — wrong password:**

```json
{ "email": "test.user@example.com", "password": "definitely-wrong-password" }
```

**C — email that doesn't exist:**

```json
{ "email": "nobody-here-at-all@example.com", "password": "definitely-wrong-password" }
```

**Pass for both B and C:** `401` with the **identical** message `"Invalid email or password"`.

They must be indistinguishable. If B said "wrong password" and C said "user not found", anyone could discover which email addresses are registered. Compare the response times too — they should be similar, because a dummy hash comparison runs even when the account doesn't exist.

### Step 21 — 🔒 Who am I

```
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{token}}
```

**Pass:** `200` with your user object.

Now try it with a broken token — change `Bearer {{token}}` to `Bearer rubbish`.

**Pass:** `401`, "Invalid token".

---

## Part 8 — Admin dashboard (FR-18)

### Step 22 — Anonymous access is blocked

```
GET {{baseUrl}}/api/admin/stats
```
*(no Authorization header)*

**Pass:** `401`, "Authentication required".

Same for `/api/admin/reports`, `/api/admin/analyses`, `/api/admin/watchlist`.

### Step 23 — 🔒 A normal user is blocked

```
GET {{baseUrl}}/api/admin/stats
Authorization: Bearer {{token}}
```

Using the **ordinary user** token from Step 17.

**Pass:** `403`, "Administrator access required".

The distinction matters: `401` means "you aren't logged in", `403` means "you are, but you're not allowed". FR-17 requires both to be enforced.

### Step 24 — Create an administrator

There is deliberately **no API endpoint** that creates admins. Use the seed script, in a second terminal:

```powershell
cd D:\IdeaProjects\NTEC\Princess\InvestiCheck-\Backend_project
npm run seed:admin
```

It prompts for each field. Suggested test values:

```
Admin email:     admin@investicheck.local
Admin username:  admin
First name:      Site
Last name:       Administrator
Password:        admin-password-min-12-chars
```

> Admin passwords must be **at least 12 characters** — longer than the 8 required for ordinary users.

Then log in as the admin:

```
POST {{baseUrl}}/api/auth/login
```

```json
{ "email": "admin@investicheck.local", "password": "admin-password-min-12-chars" }
```

Confirm `user.role` is `"admin"`, and save this one separately:

```javascript
pm.environment.set("adminToken", pm.response.json().token);
```

### Step 25 — 🔒 Dashboard statistics

```
GET {{baseUrl}}/api/admin/stats
Authorization: Bearer {{adminToken}}
```

**Pass:** `200`. All seven FR-18 metrics, computed from the records you created in Parts 4 and 6:

| Field | What it should show |
|---|---|
| `analyses.total` | The number of assessments you ran |
| `analyses.high` / `.medium` / `.low` / `.insufficientData` | Should match Steps 8–11 |
| `reports.total` / `.pending` | 1 pending, from Step 16 |
| `frequentlyReportedPlatforms` | **Empty** — correct, because your report is still `pending` |
| `mostCommonIndicators` | Ranked, e.g. "Guaranteed or fixed returns promised" |
| `recentAnalyses` | Your most recent assessments |
| `watchlistEntries` | `0` until Step 27 |

### Step 26 — 🔒 Moderate the report

List the queue:

```
GET {{baseUrl}}/api/admin/reports?status=pending
Authorization: Bearer {{adminToken}}
```

**Pass:** `200`, your report from Step 16, with pagination fields.

Approve it:

```
PATCH {{baseUrl}}/api/admin/reports/{{reportId}}
Authorization: Bearer {{adminToken}}
```

```json
{
  "status": "reviewed",
  "moderatorNote": "Consistent with known task-scam withdrawal patterns."
}
```

**Pass:** `200`, `report.status: "reviewed"`.

**Now re-run Step 25.** `frequentlyReportedPlatforms` should contain the platform, and `reports.reviewed` should be 1. That transition — from invisible to counted — is the moderation gate working.

Also try `GET {{baseUrl}}/api/admin/analyses?page=1&limit=5` for the paginated assessment list.

---

## Part 9 — Watchlist override (the Cameroon layer)

This demonstrates the strongest evidence channel in the system.

### Step 27 — 🔒 Add a test entry

```
POST {{baseUrl}}/api/admin/watchlist
Authorization: Bearer {{adminToken}}
```

```json
{
  "entityName": "Fictional Test Scheme",
  "aliases": ["Fictional Test Scheme Ltd"],
  "domains": ["example.com"],
  "regulator": "other",
  "sourceUrl": "https://example.com/test-notice",
  "notes": "TEST DATA — delete after testing."
}
```

**Pass:** `201`. Save `entry._id` into `watchlistId`.

Try omitting `sourceUrl` — it must return `400`. Every entry has to be citable, because a match is presented to users as *a regulator's published warning*, not as InvestiCheck's own accusation.

### Step 28 — Watch it force High Risk

Now assess that domain with **every answer set to `no`** — the most favourable possible input:

```
POST {{baseUrl}}/api/analysis
```

```json
{
  "platformName": "Fictional Test Scheme",
  "website": "example.com",
  "answers": {
    "guaranteedReturns": "no",
    "unusuallyHighReturns": "no",
    "withdrawalProblems": "no",
    "referralRewards": "no",
    "multiLevelReferral": "no",
    "taskBasedEarning": "no",
    "depositBeforeEarning": "no"
  }
}
```

**Pass:** `201` with **`riskLevel: "high"`** and **`riskScore` of at least 85** — despite every answer being favourable.

Look at `overrides`:

```json
[{ "type": "watchlist",
   "reason": "Named in a published warning by other",
   "sourceUrl": "https://example.com/test-notice" }]
```

The override is **not added to the weighted score** — it sets a floor. A published regulator warning is categorically stronger than any combination of self-reported answers, so averaging it in would dilute it. `explanation.overrides[0].attributed` is `true`, which tells the frontend to name the source rather than assert the claim itself.

### Step 29 — 🔒 Matching by name

Repeat Step 28 but change `website` to `google.com`, keeping `platformName: "Fictional Test Scheme"`.

**Pass:** still High Risk. Matching works on **entity name** as well as domain — schemes rebrand and move domains constantly, so domain-only matching would be trivial to evade.

### Step 30 — 🔒 List and remove

```
GET {{baseUrl}}/api/admin/watchlist
Authorization: Bearer {{adminToken}}
```

**Pass:** `200`, your entry listed.

```
DELETE {{baseUrl}}/api/admin/watchlist/{{watchlistId}}
Authorization: Bearer {{adminToken}}
```

**Pass:** `200`. Re-run Step 28 — it should drop back to Low Risk.

> **For real use:** a production entry would look like `entityName: "Global Investment Trading (Liyeplimal)"`, `aliases: ["LimoCoin SWAP", "Simtrex Commercial Brokers LLC"]`, `regulator: "COSUMAF"`, with the actual COSUMAF notice URL as `sourceUrl`. Only add real entities with a genuine, citable regulator notice.

---

## Part 10 — Edge cases and limits

### Step 31 — Unknown route

```
GET {{baseUrl}}/api/no-such-endpoint
```

**Pass:** `404`, `{ "error": "Not found", "path": "/api/no-such-endpoint" }` — JSON, not an HTML error page.

### Step 32 — Malformed JSON

Paste this **deliberately broken** body into `POST {{baseUrl}}/api/analysis`:

```
{ "platformName": "Test", "website": }
```

**Pass:** `400`. It must not return a stack trace.

### Step 33 — A domain that doesn't exist

```
POST {{baseUrl}}/api/analysis
```

```json
{
  "platformName": "Vanished Platform",
  "website": "this-domain-definitely-does-not-exist-12345.com",
  "answers": {
    "guaranteedReturns": "yes",
    "withdrawalProblems": "yes"
  }
}
```

**Pass:** `201` — **not** an error.

This is NFR 11.4. A domain that doesn't resolve is a *finding*, not a reason to refuse service. Check that `osint.dns.data.resolves` is `false`, `osint.availability.data.reachable` is `false`, and the assessment still completed using the answers you gave.

### Step 34 — Rate limits

| Endpoint | Limit |
|---|---|
| Everything | 300 / 15 min |
| `/api/auth/*` | 10 failed attempts / 15 min |
| `/api/analysis*` | 30 / 15 min |
| `/api/reports` | 5 / hour |

Easiest to prove: send Step 16's report six times. The sixth returns `429` with "Too many reports submitted".

Check the `RateLimit-*` response headers on any request to see your remaining allowance. Restart the server to reset the counters (they're in-memory).

---

## Cleanup

Test records live in your Atlas database. To clear them, run from `Backend_project`:

```powershell
node -e "Promise.all([import('mongoose'),import('./config/env.js'),import('./models/userSchema.js'),import('./models/analysisSchema.js'),import('./models/reportSchema.js'),import('./models/watchlistSchema.js')]).then(async ([m,c,U,A,R,W])=>{await m.default.connect(c.default.MONGO_URI);console.log('users   ',(await U.default.deleteMany({email:{$in:['test.user@example.com']}})).deletedCount);console.log('analyses',(await A.default.deleteMany({})).deletedCount);console.log('reports ',(await R.default.deleteMany({})).deletedCount);console.log('watchlist',(await W.default.deleteMany({notes:/TEST DATA/})).deletedCount);await m.default.disconnect()})"
```

> This deletes **all** analyses and reports. Adjust the filters if you want to keep any. It leaves your admin account in place — remove it manually if you don't want it.

---

## Quick checklist

Tick these off; together they cover every functional requirement the backend implements.

- [ ] Health reports `database: connected` (Step 1)
- [ ] 7 questions, all three-state (Step 4)
- [ ] RDAP returns a 1997 date for google.com (Step 6)
- [ ] `.cm` RDAP works (Step 7)
- [ ] Second OSINT call is cached (Step 7)
- [ ] SRS §14 example → High Risk, `task_scam_pattern` override (Step 8)
- [ ] All-no + clean domain → score 0, Low Risk, coverage 1 (Step 9)
- [ ] No answers → **insufficient_data**, not Low Risk (Step 11)
- [ ] v1 all-yes → `scoreExceededScale: true` (Step 12)
- [ ] **All 11 SSRF payloads rejected** (Step 14)
- [ ] `example.com` accepted without a scheme (Step 15)
- [ ] Report saved as `pending` (Step 16)
- [ ] Signup response contains **no** password (Step 17)
- [ ] Wrong password and unknown email give identical 401s (Step 20)
- [ ] Admin routes: 401 anonymous, 403 for a normal user (Steps 22–23)
- [ ] All seven FR-18 metrics present (Step 25)
- [ ] Reviewing a report makes it count in the stats (Step 26)
- [ ] Watchlist match forces High Risk despite all-no answers (Step 28)
- [ ] Non-existent domain still returns 201 (Step 33)

If every box ticks, the backend meets the specification and Phase 4 (frontend integration) can start.
