# CrediTrust — AI-Powered Collateral Assessment Platform

> **No Field Officer. No Paperwork. Just AI.**  
> Loan collateral verified in under 3 minutes, directly by the borrower.

🔗 **Live Demo:** [loan-verify.vercel.app](https://loan-verify.vercel.app)  
🏦 **Bank Portal:** [loan-verify.vercel.app/admin/login](https://loan-verify.vercel.app/admin/login)  
👥 **Team:** Midnight Sun  

---

## 📌 Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [AI & Intelligence Layer](#ai--intelligence-layer)
- [Fraud Detection System](#fraud-detection-system)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Demo Credentials](#demo-credentials)
- [Market Context](#market-context)
- [Team](#team)
- [Credits & References](#credits--references)

---

## 🚨 Problem Statement

India's lending ecosystem faces a critical bottleneck — collateral verification. Before any secured loan can be approved, a bank officer must physically travel to the borrower's location to assess the asset being offered as collateral. This process is:

- **Expensive** — costs ₹3,000 to ₹5,000 per field visit
- **Slow** — takes 7 to 14 days per assessment
- **Unscalable** — one officer can visit 3 to 4 sites per day
- **Fraud-prone** — borrowers rent or borrow assets specifically for inspection day

With over 87% of India's MSMEs lacking access to formal institutional credit and a credit gap exceeding ₹20–25 lakh crore, the system is broken and unable to serve the millions of underserved borrowers across rural and semi-urban India.

---

## 💡 Our Solution

CrediTrust is a borrower-led, AI-powered collateral verification platform that replaces physical field visits with intelligent digital evidence. Borrowers verify their own collateral from their smartphone in minutes. Banks get a complete, fraud-checked, AI-assessed application delivered to their dashboard in real time.

---

## ✨ Key Features

### Borrower Side (Mobile PWA)
- Guided step-by-step photo capture with live instructions
- Automatic GPS tagging and timestamp watermarking on every photo
- On-device AI asset verification using TensorFlow.js MobileNet
- Real-time blur and darkness detection for photo quality assurance
- Instant credit score calculation (300–900 scale)
- Claude AI plain-language score explanation
- Real-time application status updates

### Bank Officer Side (Admin Dashboard)
- Live applications queue with real-time updates (no refresh needed)
- Risk band filtering — Low / Medium / High
- Complete application detail view with photos, GPS, and fraud flags
- Claude AI generated full assessment report per application
- One-tap Approve / Reject / Request More Info decision panel
- Analytics dashboard with score distribution and approval rates
- PDF report download per application

---

## 🔄 How It Works

**Step 1 — Borrower Onboarding**  
Borrower logs in via OTP and fills out a three-step form covering personal details, financial information, and loan requirements including the type of collateral asset being offered.

**Step 2 — Self-Inspection**  
The app guides the borrower through a structured photo capture process specific to their asset type — vehicles require five photos including odometer, properties require four photos. Every photo is GPS-tagged and timestamped automatically.

**Step 3 — AI Fraud Detection**  
On-device AI runs four checks on every captured photo — asset type classification, blur detection, darkness detection, and speed analysis. Any anomaly is flagged before submission.

**Step 4 — Credit Score**  
A weighted scoring algorithm evaluates payment history (35%), collateral strength (25%), income stability (20%), debt-to-income ratio (10%), and behavioral signals (10%) to generate a score between 300 and 900.

**Step 5 — Claude AI Explanation**  
Claude Sonnet 4.6 generates a plain-language explanation of the score for the borrower and a formal assessment report for the bank officer.

**Step 6 — Bank Decision**  
The officer reviews the complete application on the dashboard, sees all fraud flags, photos, and the AI report, then issues a decision. The borrower is notified instantly via real-time subscription.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Real-time | Supabase Realtime |
| File Storage | Supabase Storage |
| Deployment | Vercel |
| Charts | Recharts |
| PDF Generation | jsPDF |
| AI — Cloud | Claude Sonnet 4.6 (Anthropic API) |
| AI — On Device | TensorFlow.js + MobileNet v2 |
| Computer Vision | Canvas API + Custom Heuristics |
| Location | Web Geolocation API |
| Local Storage | IndexedDB |
| Auth | Supabase Auth |

---

## 🤖 AI & Intelligence Layer

### On-Device AI (TensorFlow.js)
CrediTrust runs MobileNet v2 directly in the browser using TensorFlow.js. The model classifies every captured photo and compares the detected asset category against the declared collateral type. This runs entirely on the borrower's device — no photo is sent to any server for AI analysis. This approach protects privacy and works even in low-connectivity environments.

### Cloud AI (Claude Sonnet 4.6)
When the application is submitted and the officer reviews it, Claude Sonnet 4.6 by Anthropic generates two outputs — a plain-language score explanation for the borrower explaining their score in simple terms and suggesting improvements, and a formal structured assessment report for the bank officer covering executive summary, asset assessment, credit analysis, risk factors, and recommendation.

### Credit Scoring Algorithm
The scoring engine uses a weighted multi-factor model mapping raw scores from 0 to 100 onto the 300 to 900 CIBIL-compatible range. Each factor is scored independently and combined using predetermined weights based on industry-standard credit assessment practices.

---

## 🛡 Fraud Detection System

CrediTrust implements a four-layer fraud detection system that runs entirely on the borrower's device before submission:

**Layer 1 — Asset Classification**  
TensorFlow.js MobileNet classifies every photo in real time. If the declared asset type does not match what the AI detects in the image, a fraud flag is raised immediately.

**Layer 2 — GPS Verification**  
Every photo is tagged with real-time GPS coordinates using the Web Geolocation API. Missing GPS data or coordinates that do not match the declared asset location trigger an automatic flag.

**Layer 3 — Timestamp Hardening**  
Photos taken less than three seconds apart are flagged as suspicious, catching cases where borrowers attempt to rapidly submit pre-taken gallery images instead of live captures.

**Layer 4 — Quality Analysis**  
Laplacian variance calculation detects blurry photos. Average pixel brightness analysis detects photos taken in the dark. Both conditions produce flags visible to the bank officer.

---

## 📁 Project Structure

```
loan-app/
├── src/
│   ├── app/
│   │   ├── (borrower)/
│   │   │   ├── login/
│   │   │   ├── onboarding/
│   │   │   ├── inspection/
│   │   │   ├── score/
│   │   │   └── status/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── login/
│   │   │       ├── dashboard/
│   │   │       ├── analytics/
│   │   │       └── application/[id]/
│   │   └── api/
│   │       └── claude/
│   ├── components/
│   │   ├── borrower/
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── ScoreDial.tsx
│   │   │   └── ScoreBreakdown.tsx
│   │   ├── admin/
│   │   │   ├── ApplicationTable.tsx
│   │   │   └── DecisionPanel.tsx
│   │   └── shared/
│   │       ├── BorrowerNav.tsx
│   │       ├── OfflineBanner.tsx
│   │       └── StatusBadge.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── claude.ts
│   │   ├── scoring.ts
│   │   ├── imageAI.ts
│   │   └── pdf.ts
│   └── types/
│       └── index.ts
├── public/
│   └── manifest.json
└── next.config.ts
```

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/loan-app.git
cd loan-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase and Anthropic API keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root of your project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
SMTP_USER=For email OTP (Gmail App Password recommended)
SMTP_PASS=For email OTP (Gmail App Password recommended)
```

---

## 🗄 Database Schema

CrediTrust uses six tables in Supabase PostgreSQL:

```
users           — borrower identity and income details
applications    — loan requests, scores, status, fraud flags
assets          — collateral details and GPS location
documents       — captured photos with GPS and fraud flags per photo
credit_profiles — score breakdown per factor
ai_reports      — Gemini generated explanations and reports
```

Run the complete SQL schema from the Supabase SQL editor before starting the application. The schema file is included in the repository.

---

## 🔑 Demo Credentials

**Bank Officer Login**
```
URL      : loan-verify.vercel.app/admin/login
Email    : officer@bank.com
Password : demo1234
```

**Borrower Login**
```
URL      : loan-verify.vercel.app/login
Phone    : any 10 digit number
OTP      : 123456
```

---

## 📊 Market Context

These statistics informed the design and scope of CrediTrust:

- India's MSME credit gap stands at ₹20–25 lakh crore (Source: RBI / Parliamentary Report)
- 87.38% of India's 633.88 lakh MSMEs are excluded from institutional credit (Source: Nexdigm Digital Lending Report)
- India's alternative lending sector is projected to reach USD 52.30 billion by 2029, growing at 14.3% annually (Source: Research and Markets, January 2026)
- India's fintech market is USD 51.30 billion in 2026, projected to reach USD 109.06 billion by 2031 (Source: Mordor Intelligence)
- MSMEs face a $240 billion credit gap with only 16% served by formal banks (Source: State of Indian Fintech Report H1 2025)
- Digital lending is expected to capture more than 53% of fintech revenue, translating to $133 billion by end of decade (Source: State of Indian Fintech Report H1 2025)

---

## 👥 Team

**Team Midnight Sun**  
Built for Build With KodeMaster.ai Hackathon

---

## 🙏 Credits & References

### AI & Machine Learning
- [gemini](https://www.aistudio.google.com) — AI report generation and score explanation
- [TensorFlow.js](https://www.tensorflow.org/js) — On-device machine learning
- [MobileNet v2](https://github.com/tensorflow/tfjs-models/tree/master/mobilenet) — Image classification model by Google

### Backend & Infrastructure
- [Supabase](https://supabase.com) — Database, authentication, real-time, and storage
- [Vercel](https://vercel.com) — Deployment and hosting
- [PostgreSQL](https://www.postgresql.org) — Relational database

### Frontend
- [Next.js 15](https://nextjs.org) — React framework by Vercel
- [TypeScript](https://www.typescriptlang.org) — Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com) — Component library built on Radix UI
- [Recharts](https://recharts.org) — Chart library for React
- [jsPDF](https://github.com/parallax/jsPDF) — PDF generation in browser
- [Lucide React](https://lucide.dev) — Icon library

### Research & Market References
- [State of Indian Fintech Report H1 2025](https://www.birenparekh.com/technology/state-of-indian-fintech-report-h1-2025/)
- [Nexdigm India Digital Lending Market Report](https://www.nexdigm.com/market-research/report-store/india-digital-lending-market-report/)
- [Mordor Intelligence — India Fintech Market](https://www.mordorintelligence.com/industry-reports/india-fintech-market)
- [Research and Markets — India Alternative Lending](https://www.globenewswire.com/news-release/2026/01/05/3212542/)
- [AI Fraud Detection in MSME Lending — Finezza](https://finezza.in/blog/ai-fraud-detection-msme-loan-risks/)
- [AI in Indian FinTech — AI Tech News](https://aitechnews.in/ai-in-indian-fintech/)
- [Practical Applications of AI in Lending — Bonadio](https://www.bonadio.com/article/practical-applications-ai-financial-institutions-part-1-lending/)
- [Policy Circle — India MSME Funding Gap](https://www.policycircle.org/policy/india-msmes-funding-gap/)

### Tools Used During Development
- [OBS Studio](https://obsproject.com) — Screen recording
- [Canva](https://canva.com) — Presentation and banner design
- [Nanobanana](https://nanobanana.ai) — Logo and banner generation
- [Google Veo](https://labs.google.com/video) — Video generation for demo
- [Claude AI](https://claude.ai) — Development assistance and code generation
- [VS Code](https://code.visualstudio.com/)- IDE
---

## 📄 License

This project was built for hackathon purposes. All third-party libraries and services retain their respective licenses.

---

<div align="center">
  Built with ❤️ by Team Midnight Sun 🌙
  <br/>
  Build With KodeMaster.ai Hackathon
  <br/><br/>
  <strong>loan-verify.vercel.app</strong>
</div>
