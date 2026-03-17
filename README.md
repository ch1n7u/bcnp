# Cyber Crime Reporting Portal

## 1) Project Folder Structure

```text
Cyber-Crime-Reporting/
  backend/
    src/
      app.js
      server.js
      config/
        env.js
        db.js
        supabase.js
      controllers/
        authController.js
        reportController.js
        evidenceController.js
        caseController.js
        analyticsController.js
      middleware/
        auth.js
        roles.js
        validate.js
        errorHandler.js
      routes/
        index.js
        authRoutes.js
        reportRoutes.js
        evidenceRoutes.js
        caseRoutes.js
        analyticsRoutes.js
      validations/
        authValidation.js
        reportValidation.js
      utils/
        hash.js
      db/
        schema.sql
    .env.example
    package.json
    render.yaml
  frontend/
    src/
      app/
        page.js
        layout.js
        globals.css
        login/page.js
        register/page.js
        report/page.js
        track/page.js
        resources/page.js
        dashboard/
          admin/page.js
          analytics/page.js
      components/
        Navbar.jsx
        AuthForm.jsx
        ReportForm.jsx
        EvidenceUploader.jsx
        CaseTracker.jsx
        AdminReportsTable.jsx
        AnalyticsCharts.jsx
      lib/
        api.js
        auth.js
    .env.example
    package.json
    tailwind.config.js
    postcss.config.js
    next.config.js
    vercel.json
  .gitignore
  README.md
```

## 2) Backend Implementation (Express + PostgreSQL)

### Security Included
- JWT authentication
- bcrypt password hashing
- role-based access control (citizen, investigator, admin)
- input validation with Zod
- rate limiting
- Helmet and HPP middleware
- SQL-safe parameterized queries

### API Endpoints

#### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

#### Reports
- `POST /api/reports` (citizen/admin)
- `GET /api/reports/me` (all authenticated users)
- `GET /api/reports` (admin/investigator)
- `GET /api/reports/:reportId`

#### Evidence
- `POST /api/evidence/:reportId` (multipart file upload)
- `GET /api/evidence/:reportId`

#### Case Management
- `PATCH /api/cases/:reportId/status`
- `PATCH /api/cases/:reportId/assign`
- `POST /api/cases/:reportId/notes`
- `GET /api/cases/:reportId/notes`

#### Analytics
- `GET /api/analytics/dashboard`

### Evidence Handling
- File validation (images, PDF, plain text)
- Max size: 10MB
- SHA256 hash generation and storage
- Upload to Supabase Storage (when configured)

## 3) Database Schema (PostgreSQL)

Run the SQL from:
- `backend/src/db/schema.sql`

Tables created:
- `users`
- `reports`
- `evidence`
- `case_notes`

This schema includes constraints, foreign keys, status checks, and indexes for dashboard queries.

## 4) Frontend Pages (Next.js + Tailwind + Recharts)

### Citizen Portal
- Register/Login
- Submit report form
- Evidence uploader
- Track case status by report ID
- Awareness resources

### Admin/Investigator
- Report list with filters
- Case status updates
- Investigator assignment
- Case note management

### Analytics Dashboard
- Crime category distribution (bar chart)
- Status breakdown (pie chart)
- Monthly crime trends (line chart)
- Financial fraud summary cards

## 5) Deployment Configuration (Free Tier)

### A. Supabase (Database + Storage)
1. Create a Supabase project (free tier).
2. Open SQL editor and run `backend/src/db/schema.sql`.
3. Create Storage bucket named `evidence-files`.
4. Copy:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - PostgreSQL connection string (`DATABASE_URL`).

### B. Backend on Render
1. Push project to GitHub.
2. In Render, create a new Web Service from your repo.
3. Set root directory to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variables (from `.env.example`).
7. Set `FRONTEND_URL` to your deployed Vercel URL.

### C. Frontend on Vercel
1. Import GitHub repository in Vercel.
2. Set root directory to `frontend`.
3. Add env variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-render-service.onrender.com/api`
4. Deploy.

## Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Suggested Future Enhancements
- Add heatmap visualization with geo-json map layer
- Add email/SMS notifications for status updates
- Add audit logs for admin actions
- Add AI-based phishing URL classifier module
