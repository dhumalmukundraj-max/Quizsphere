# QuizSphere — Online Quiz Management & Examination Platform

QuizSphere is a complete, production-ready, multi-user web application for creating, managing, password-protecting, and conducting online MCQ examinations with automated server-side evaluation.

Built with **React**, **Vite**, **Tailwind CSS**, **Supabase Authentication & PostgreSQL Database**, and **Vercel Serverless Functions**.

---

## 🌟 Key Features

### 1. Dual Host & Candidate Role
A single unified user account allows users to both:
- **Host**: Create and manage quizzes, set questions, assign point values, publish/close exams, and monitor results.
- **Candidate**: Discover published quizzes, enter secure passwords, take timed examinations, and review historical attempt logs.

### 2. Google Forms-Style Quiz Builder
- Rich question management: Add, duplicate, edit, reorder (move up/down), and delete questions.
- Dynamic MCQ options (up to 6 choices per question, minimum 2).
- One-click correct answer designation per question.
- Custom marks/points per question with automated total mark computation.
- Duration configuration in minutes (or untimed assessments).
- Save as Draft or Publish directly to the catalog.
- Interactive Participant Preview mode for hosts.

### 3. Bulletproof Academic Integrity & Security
- **Confidential Answer Keys**: Correct answers are stored in a dedicated `correct_answers` table protected by PostgreSQL Row Level Security (RLS). They are **never** returned to candidate browsers or public APIs.
- **Server-Side Automatic Grading**: All evaluations occur exclusively in authenticated serverless API functions (`/api/submit-exam`). Candidate scores cannot be tampered with on the client.
- **Bcrypt Passcode Encryption**: Quiz access passwords are never saved in plaintext; they are hashed with bcrypt.
- **Anti-Brute Force Protection**: Rate limiting with sliding lockout windows prevents automated passcode guessing.
- **Duplicate Prevention**: Prevents duplicate test submissions by the same candidate.

### 4. Interactive Examination Interface
- Clean, distraction-free examination view with one question at a time.
- Real-time countdown timer with automated submission upon time expiry.
- Visual Question Navigator with live status (Answered vs. Unanswered).
- Review Answers drawer to inspect completion status before final submission.
- Confetti celebration animations on passing scores.

### 5. Host Analytics & CSV Export
- Detailed performance dashboard with 5 aggregate KPI cards: Total Participants, Highest Marks, Average Marks, Lowest Marks, and Cohort Average Percentage.
- Sortable student roster table (by highest/lowest marks, newest/oldest submission).
- Real-time search by candidate name and email.
- One-click CSV export formatted for academic gradebooks.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Lucide React, Canvas Confetti |
| **Backend** | Vercel Serverless Functions (`/api/*`), Node.js ES Modules |
| **Database & Auth** | Supabase Authentication, PostgreSQL Database, Row Level Security (RLS) |
| **Security** | bcryptjs, Rate-limiting sliding window, Secret service role keys |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher recommended; v24 supported)
- npm (v9 or higher)
- A free [Supabase](https://supabase.com) account

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Database (Supabase)
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor** in the Supabase Dashboard sidebar.
3. Open the file `supabase/schema.sql` from this repository, copy its entire contents, paste them into the SQL editor, and click **Run**.
   - This creates all relational tables (`profiles`, `quizzes`, `questions`, `question_options`, `correct_answers`, `attempts`, `attempt_answers`, `results`), sets up foreign keys, triggers, and configures Row Level Security (RLS) policies.

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and fill in your Supabase credentials:
```env
# Obtained from Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Service Role Key (Keep private! Used on the server for grading)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.
The development server automatically mounts the serverless `/api/*` endpoints via Vite dev middleware, enabling identical functionality locally and in production without running a separate server!

---

## ☁️ Vercel Deployment

QuizSphere is engineered for zero-config Vercel deployment:

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. Vercel will build the frontend via Vite and automatically expose all `/api/*.js` functions as serverless endpoints.

The included `vercel.json` ensures that single-page application (SPA) client-side routes rewrite to `/index.html` while preserving `/api/*` routing.

---

## 📂 Project Directory Structure

```
├── api/                             # Serverless API functions
│   ├── _supabaseServer.js           # Server-side Supabase client factory
│   ├── create-or-update-quiz.js     # Validates, hashes password, saves quiz
│   ├── get-exam-questions.js        # Serves sanitized exam questions (no answers!)
│   ├── submit-exam.js               # Evaluates answers against key, grades attempt
│   └── verify-password.js           # Rate-limited bcrypt passcode verification
├── public/
│   └── logo.svg                     # QuizSphere SVG vector branding
├── src/
│   ├── components/
│   │   ├── common/                  # Reusable components (ConfigBanner, ProtectedRoute)
│   │   └── layout/                  # Navbar, Footer, DashboardLayout with sidebar
│   ├── context/
│   │   ├── AuthContext.jsx          # Supabase auth state & profile synchronization
│   │   └── ToastContext.jsx         # Custom notifications container
│   ├── lib/
│   │   ├── api.js                   # Client-side wrapper for /api/* endpoints
│   │   └── supabase.js              # Supabase browser client
│   ├── pages/
│   │   ├── auth/                    # Login, Register, ForgotPassword, ResetPassword
│   │   ├── dashboard/               # Overview, MyQuizzes, CreateQuiz, Results, Attempts, Profile, Settings
│   │   ├── ExaminationPage.jsx      # Pre-test registration, active exam UI, grading results
│   │   ├── ExploreQuizzesPage.jsx   # Public catalog with real-time search
│   │   ├── LandingPage.jsx          # SaaS landing page with features & benefits
│   │   └── QuizDetailsPage.jsx      # Password gate & test overview
│   ├── App.jsx                      # React Router configuration
│   ├── index.css                    # Tailwind CSS directives
│   └── main.jsx                     # Application bootstrap
├── supabase/
│   └── schema.sql                   # Complete PostgreSQL schema, triggers & RLS
├── .env.example                     # Environment variables template
├── package.json
├── tailwind.config.js
├── vercel.json                      # Vercel SPA rewrites & serverless routing
└── vite.config.js                   # Vite config with dev serverless middleware
```

---

## 🔒 Security Summary

1. **Answer Confidentiality**: Unlike naive frontends that send correct answers in the initial payload, QuizSphere's `api/get-exam-questions` strips all correct answer references.
2. **PostgreSQL RLS**: Row Level Security guarantees that candidates can only view their own examination attempts, while hosts can view and export results for quizzes they own.
3. **Bcrypt Passcodes**: Quiz access passcodes are hashed with bcrypt before storage.
4. **Rate Limiting**: Passcode verification is limited to 5 attempts per IP/quiz with exponential lockout to eliminate brute-force vulnerability.
5. **Role Separation**: Secret service-role keys are never exposed in browser bundles.

---

## 📄 License
MIT License. Created for online examination management and academic evaluation.

