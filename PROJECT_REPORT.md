# Cyber Crime Reporting Portal — Project Report

Version: 1.0
Date: 2026-05-24

Table of Contents
-----------------
- 1. Project Overview
- 2. Tech Stack (explanations & trade-offs)
- 3. System Architecture
- 4. Database Design
- 5. Core Features (technical implementation)
- 6. API Design
- 7. Threat Model (STRIDE)
- 8. Security Architecture
- 9. Deployment Architecture
- 10. Testing Strategy
- 11. Project Metrics
- 12. Viva Questions & Answers
- 13. Possible Trick Questions
- 14. Presentation Content
- 15. Important Faculty Expectations
- 16. Defensive Preparation Notes
- 17. Industry-Level Improvements
- Appendix: Example DDL, OpenAPI & CI snippets

---

## 1. Project Overview

### Project name
- Cyber Crime Reporting Portal (prototype)

### Problem statement
- Citizens currently lack a secure, standardized, and trackable way to report cybercrimes. Traditional phone/paper channels are slow, inconsistent and provide weak evidence handling and audit trails.

### Real-world problem solved
- Provides standardized complaint intake, secure evidence submission, structured investigator workflows, and auditable metadata suitable for triage and preliminary forensic needs.

### Why this project matters
- Improves access to justice, reduces investigation latency, preserves evidence integrity, supports data-driven policing and transparency, and builds public trust.

### Target users
- Citizens (reporters), investigators, admin staff, forensic analysts, prosecutors, auditors.

### Project objectives
- Secure registration + authentication
- Structured complaint intake and evidence ingestion
- Investigator workflow and assignment
- Immutable audit trail and chain-of-custody metadata
- Notifications and public complaint tracking
- Basic analytics for triage and resource allocation

### Scope
- Web portal (citizen + admin UI), REST API, PostgreSQL DB, object storage for evidence, background processing for scanning/OCR, basic integrations (email/SMS), audit logs, RBAC, MFA.
- Exclusions: legally certified forensic hardware vaults, production-grade national integrations, full mobile-native clients (prototype-level mobile support only).

### Limitations
- Prototype is not production-hardened for national-scale traffic without additional infra investment and legal review for evidentiary admissibility.

### Future improvements
- SIEM & SOC integration, HSM-backed key management, multi-region DB replication, automated case correlation, digital signatures for evidence, mobile apps and offline submission support.

---

## 2. Tech Stack (explanations & trade-offs)

This section explains each selected technology, why chosen, alternatives considered, and security / scalability / performance implications.

### Frontend
- React + Next.js (TypeScript)
  - Why: Maturity, SSR/SSG capabilities (performance/SEO), routing, and developer productivity. TypeScript enforces types and reduces runtime bugs.
  - Alternatives: Remix, SvelteKit, plain React CRA. Not chosen due to ecosystem, features and team familiarity.
  - Security: escape-by-default rendering, easy CSP and secure header injection, encourage safe client code.
  - Scalability: ISR/SSG + CDN for static assets; route-level code splitting.
  - Performance: SSR for landing and public pages; CSR for interactive dashboards.

- Tailwind CSS
  - Why: Utility-first rapid styling and design-system friendliness.
  - Alternatives: Bootstrap, Material UI.
  - Security: minimizes runtime style injection (lower XSS risk).
  - Performance: Purge unused CSS in production to keep bundles small.

### Backend
- FastAPI (Python) — recommended
  - Why: Async-first, Pydantic data validation, automatic OpenAPI docs, fast development and runtime performance for I/O-bound services.
  - Alternatives: Node.js (Express or NestJS). Express is unopinionated and widely used but needs additional validation libraries; NestJS is more opinionated.
  - Security: Strong typed validation reduces injection risks and consistent schema enforcement.
  - Scalability: ASGI stack (Uvicorn/Gunicorn) behind reverse proxy; horizontally scalable.
  - Performance: Very competitive for asynchronous I/O-bound workloads.

- REST API architecture
  - Why: Simpler for CRUD-heavy workflows, easier caching and versioning than GraphQL for this domain.

- Authentication
  - Pattern: OAuth2-like flows with short-lived JWT access tokens + rotated refresh tokens stored server-side; prefer HttpOnly SameSite cookies for browser refresh tokens.

### Database
- PostgreSQL (primary)
  - Why: ACID transactions, referential integrity, advanced indexing (GIN, tsvector), JSONB for flexible metadata, Row-Level Security (RLS).
  - Alternatives: MongoDB (document store). Not chosen for core entities since legal workflows require transactions and joins.
  - Security: Built-in roles, RLS, strong ecosystem for backups and encryption.
  - Scalability: Read replicas, partitioning, Citus for sharding if needed.

- ORM & Migrations
  - Recommendation: SQLModel/SQLAlchemy + Alembic (Python) or Prisma for Node projects.

### Infrastructure
- Docker: reproducible builds, standard packaging.
- Reverse proxy: nginx or cloud LB for TLS termination, rate limiting and WAF integration.
- Hosting: managed Kubernetes or managed container services for production; PaaS options for lower ops overhead.
- CDN: Cloudflare/CloudFront for static assets and caching safe public responses.
- Object storage: S3-compatible with server-side encryption (SSE-KMS), versioning and strict ACLs.
- Logging: Fluentd/Filebeat -> ELK or OpenSearch + Grafana/Prometheus for metrics.

### Security Tools & Patterns
- Password hashing: Argon2id
- RBAC for roles (citizen, investigator, admin, auditor)
- Rate limiting via reverse proxy + Redis
- CAPTCHA (reCAPTCHA v3) for public forms
- WAF with OWASP CRS
- Malware scanning: ClamAV or commercial scanners on upload
- Secrets: Vault or cloud KMS

### Optional Integrations
- Email (SES/SendGrid), SMS OTP (Twilio), AI-based categorization, OCR (Tesseract or cloud OCR), threat intelligence feeds (MISP).

---

## 3. System Architecture

### High-level overview
- Clients (Next.js) -> CDN -> Reverse proxy / WAF -> API (FastAPI) -> PostgreSQL + object storage + background workers (Celery/RQ) -> auxiliary services (email, SMS, AV scanner, OCR). Logging and monitoring pipelines capture telemetry.

### Key flows
- Request flow: Client -> TLS -> Proxy/WAF -> Auth middleware -> API -> DB/object-store -> Response.
- Authentication flow: credentials -> validate -> issue short-lived access token + refresh token (rotate) -> enforce MFA for privileged roles.
- Complaint submission flow: request pre-signed upload -> client uploads evidence to S3 -> backend verifies upload and schedules scans -> create complaint record and initial status entry -> notify reporter.
- Admin investigation workflow: investigator views assigned queue -> streams evidence via signed URLs -> updates status and notes -> audit logs append.
- Evidence upload workflow: pre-signed uploads, background scanning for malware and OCR, store file hash and metadata, quarantine if needed.
- Notification workflow: events published to internal queue -> notification service sends email/SMS/in-app and records status in `notifications` table.

### Security boundaries
- Public zone: CDN + marketing pages
- DMZ: reverse proxy + WAF
- App zone: API servers in private subnets
- Data zone: DB & object storage with restricted network access and encryption

---

## 4. Database Design

Design guidelines: use UUID primary keys, timestamptz for timestamps, JSONB for flexible metadata, GIN indexes for full-text and JSONB queries, RLS for sensitive access.

### Core tables (summary)

- `users`
  - id: UUID PK
  - email: VARCHAR(320) UNIQUE NOT NULL
  - password_hash: TEXT NOT NULL
  - full_name: TEXT
  - phone: VARCHAR(32)
  - role: TEXT CHECK (values: citizen, investigator, admin, auditor)
  - is_verified: BOOLEAN
  - created_at: timestamptz
  - profile_metadata: JSONB
  - Indexes: btree(email), btree(role)

- `complaints`
  - id: UUID PK
  - reference_number: TEXT UNIQUE
  - user_id: UUID FK -> users(id)
  - title: TEXT
  - description: TEXT
  - category: TEXT
  - severity: SMALLINT
  - status: TEXT (enum)
  - assigned_to: UUID NULL -> users(id)
  - metadata: JSONB
  - location_ip: INET
  - created_at / updated_at: timestamptz
  - Indexes: btree(status, created_at), GIN on to_tsvector(title||description), GIN on metadata

- `complaint_status_history`
  - id: UUID PK
  - complaint_id: UUID FK
  - old_status / new_status: TEXT
  - changed_by: UUID FK users(id)
  - reason: TEXT
  - changed_at: timestamptz
  - Indexes: complaint_id, changed_at

- `evidence_files`
  - id: UUID PK
  - complaint_id: UUID FK
  - uploader_id: UUID FK
  - s3_key: TEXT
  - filename, mime_type, size: TEXT / BIGINT
  - sha256: TEXT
  - scan_status: TEXT (pending/clean/quarantined)
  - uploaded_at: timestamptz
  - Indexes: complaint_id, sha256

- `investigators`
  - id: UUID PK
  - user_id: UUID UNIQUE FK
  - team: TEXT
  - skills: JSONB
  - active: BOOL

- `admin_roles`
  - id: UUID PK
  - role_name: TEXT UNIQUE
  - permissions: JSONB

- `audit_logs`
  - id: UUID PK
  - actor_id: UUID
  - action: TEXT
  - target_type / target_id: TEXT / UUID
  - details: JSONB
  - ip: INET
  - created_at: timestamptz
  - Notes: append-only; consider monthly partitioning

- `notifications`
  - id: UUID PK
  - user_id: UUID
  - type / channel / payload / status: TEXT / JSONB
  - created_at / sent_at

- `otp_verification`
  - id: UUID PK
  - user_id: UUID
  - phone_or_email: TEXT
  - otp_hash: TEXT
  - purpose: TEXT (mfa/register/reset)
  - expires_at: timestamptz
  - attempts: INT

- `ip_abuse_logs`
  - id: UUID PK
  - ip: INET
  - event_type: TEXT
  - count: INT
  - first_seen / last_seen: timestamptz

### Indexing recommendations
- GIN indexes for JSONB and full-text (tsvector)
- Partial index for active complaints: `WHERE status != 'closed'`
- Partition `audit_logs` by time when volume grows

### Constraints & RLS
- Use CHECK constraints for enum-like columns
- RLS policies to limit investigators to assigned cases unless elevated role

---

## 5. Core Features (technical implementation)

### Citizen side
- Registration: `POST /api/auth/register` -> validate, hash password with Argon2id, create `users` row, create OTP and send verification.
- Login: `POST /api/auth/login` -> verify password, check lockout, issue short-lived access token and refresh token (rotate). For web prefer refresh token in secure HttpOnly SameSite cookie.
- MFA/OTP: TOTP enroll flow and SMS OTP fallback stored hashed in `otp_verification` with attempt counters.
- Complaint filing: request pre-signed upload(s), upload direct to object store, call `POST /api/complaints` with evidence metadata. Server verifies evidence references and creates complaint record within a transaction.
- File upload evidence: pre-signed S3 uploads; background worker computes sha256, runs malware scanner, updates `evidence_files.scan_status`, triggers OCR if needed.
- Complaint tracking: customers view tracked complaints via authenticated UI; public limited tracking via reference number if required.
- Email notifications: asynchronous notifications from event bus; templated messages never include raw sensitive PII—link user to portal.

### Admin side
- Admin login: MFA required, optional IP allowlist, shorter session TTL.
- Case assignment: manual and auto-assignment (skill-match + load-balancing). Use optimistic locking to avoid race.
- Investigator management: CRUD UI, skills as JSONB, workload metrics.
- Status updates: allowed transitions validated server-side; each update creates entry in `complaint_status_history` and `audit_logs`.
- Audit logs: immutable events with actor ID, IP and details.
- Analytics dashboard: aggregated metrics via materialized views or read-replica.

### Security features
- Brute force protection: Redis counters + exponential backoff + CAPTCHA
- Session timeout & revocation: short access TTL + refresh rotation + session revocation endpoint
- Account lockout & secure reset: TTL short tokens, MFA recovery for admins
- Abuse detection: IP reputation, device fingerprinting, rate-limits per account

---

## 6. API Design

Standard response envelope: `{ "ok": true|false, "data":..., "error": {"code":"","message":""} }`

### Selected endpoints (specs)

- `POST /api/auth/register`
  - Body: `{ email, password, phone?, name? }`
  - Auth: none
  - Validation: email format, password complexity, CAPTCHA
  - Response: 201 `{ data: { user_id, next: 'verify' } }`

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Auth: none
  - Response: 200 `{ data: { access_token, expires_in } }` and set refresh cookie for web
  - Security: log attempt, check lockout, rate-limit

- `POST /api/auth/refresh`
  - Body: refresh token (cookie or body)
  - Auth: refresh token
  - Response: new access token + rotated refresh

- `POST /api/uploads/presign`
  - Body: `{ filename, content_type, size }`
  - Auth: authenticated
  - Response: `{ upload_url, s3_key, expires_in }`
  - Validation: mime and size limits

- `POST /api/complaints`
  - Body: `{ title, description, category, severity, evidence: [{ s3_key, filename, size }] }`
  - Auth: bearer token
  - Response: 201 `{ complaint_id, reference_number }`
  - Validation: evidence references present and not quarantined

- `GET /api/complaints/:id`
  - Auth: owner or assigned investigator/admin/auditor
  - Response: complaint object with evidence metadata (signed URLs issued separately)

- `PATCH /api/admin/complaints/:id/status`
  - Body: `{ new_status, assigned_to?, note? }`
  - Auth: admin/investigator
  - Response: 200 OK
  - Side-effects: create status history, audit log, notify reporter

### Validation & security rules
- Use schema-driven validation (Pydantic or equivalent)
- Enforce size limits, allowed mime types, and verify evidence ownership
- Log all admin actions to `audit_logs`

---

## 7. Threat Model (STRIDE)

For each STRIDE category include attack scenarios, impacts and mitigations.

- Spoofing
  - Scenario: stolen credentials / forged tokens
  - Impact: unauthorized access to complaints and evidence
  - Mitigations: Argon2id hashing, MFA/TOTP, short-lived tokens, refresh rotation, device/IP anomaly detection

- Tampering
  - Scenario: alteration of complaint data or evidence metadata
  - Impact: corrupted/counterfeited evidence
  - Mitigations: TLS, compute & store sha256, object versioning, signed audit logs, ACLs

- Repudiation
  - Scenario: reporter denies submission or admin denies changes
  - Impact: legal disputes
  - Mitigations: immutable audit logs with actor id/ip/hash, signed receipts, optional digital signatures

- Information disclosure
  - Scenario: PII leak via API or logs
  - Impact: privacy violations and legal exposure
  - Mitigations: encryption at rest & in transit, RLS, field-level redaction, log scrubbing

- Denial of Service
  - Scenario: flood uploads or API endpoints
  - Impact: service unavailability
  - Mitigations: rate limiting, CAPTCHAs, WAF, autoscaling, quotas per account

- Privilege Escalation
  - Scenario: exploit to elevate user to admin
  - Impact: full system compromise
  - Mitigations: server-side RBAC, audited role changes, RLS, separate admin console with extra MFA and IP restrictions

---

## 8. Security Architecture

### Authentication
- Short-lived JWT access token + server-rotated refresh tokens. Use HttpOnly SameSite cookies for browser refresh tokens.
- MFA: TOTP primary; SMS OTP fallback; require for admin roles.

### Authorization
- Role-Based Access Control (RBAC) with a permission model stored in `admin_roles`.
- Attribute-based checks for owner/assigned investigator access.
- Database Row-Level Security (RLS) for sensitive data.

### Encryption
- In transit: TLS 1.2+ with modern ciphers and HSTS.
- At rest: disk encryption for DB + SSE-KMS for object storage; consider application-level column encryption for sensitive fields.

### Logging & Monitoring
- Centralized logging to ELK/OpenSearch; metrics to Prometheus and dashboards in Grafana. Alerting for anomalous auth patterns, spike in upload quarantine, queue depth.

### Backup & DR
- Daily logical backups + WAL archiving for point-in-time recovery (PITR). Offsite replication and periodic restore verification drills.

### Incident Response
- Playbook: detect -> contain -> preserve evidence -> notify -> remediate -> review. Immediate steps include revoking tokens, rotating keys and isolating compromised instances.

---

## 9. Deployment Architecture

### Environments
- Development: local Docker Compose (api, db, redis, minio, smtpdev, frontend)
- Staging: production-like smaller cluster, separate DB & buckets
- Production: managed Kubernetes or container service, multi-AZ DB, private subnets

### CI/CD
- Typical pipeline: lint -> unit tests -> build -> security scans (Trivy/Snyk) -> image push -> deploy to staging -> integration tests -> manual approval -> deploy to prod.

### Secrets & env
- Use Vault or Cloud KMS; no secrets in repo or image. Inject at runtime.

### Docker
- Multi-stage builds, non-root user, minimal base images; image scanning in CI.

### TLS & reverse proxy
- TLS termination at proxy/ingress with HSTS and modern ciphers; WAF in front.

### Scalability
- Horizontal autoscaling at app layer, DB read replicas, Redis cache & rate-limit store. Pre-signed uploads to offload file bandwidth.

---

## 10. Testing Strategy

### Functional & Unit
- Unit tests (Pytest or Jest) for business logic and validation
- Component tests with React Testing Library

### API & Integration
- Postman collections, contract tests from OpenAPI

### Security
- SAST, DAST (OWASP ZAP, Burp Suite), dependency scanning (Snyk), secret scans

### Performance & Load
- k6 or Locust to simulate login, complaint submission and file upload flows; measure p95/p99 latencies

### Penetration Testing
- Manual pentest focusing on auth, file upload, SSRF, XSS, SQLi and privilege escalation

### Regression & UAT
- E2E Cypress tests in CI; UAT on staging by stakeholders

---

## 11. Project Metrics

- API latency: p50 < 200ms, p95 < 1s target for common endpoints
- Login success rate: > 99% (excluding MFA friction)
- Complaint submission success rate: > 99% (excluding quarantined uploads)
- Uptime target: 99.95%
- Concurrent users baseline: e.g., 5k (adjustable to project requirements)
- Upload processing time: median scan & hash < 10s for images; OCR in minutes via async workers

---

## 12. Viva Questions & Answers (selected 50+)

Below are examiner-level questions with concise ideal answers. Be prepared to expand on any item.

1. Q: Why FastAPI?
   A: Async-first, Pydantic validation, automatic OpenAPI docs, strong dev ergonomics and competitive performance for I/O-bound APIs.

2. Q: Why Next.js?
   A: SSR/SSG options for performance & SEO, built-in routing and optimization, strong TypeScript support.

3. Q: Why PostgreSQL instead of MongoDB?
   A: Strong ACID guarantees, joins & transactions needed for legal workflows, JSONB for flexible metadata.

4. Q: How do you ensure evidence integrity?
   A: Compute & store sha256 on upload, object versioning, signed audit logs, and store metadata in DB.

5. Q: How do you prevent privilege escalation?
   A: Enforce RBAC server-side, RLS, audited role changes and separate admin console with extra MFA.

6. Q: Pre-signed uploads — why?
   A: Offloads bandwidth to object storage, reduces backend memory pressure and improves scalability.

7. Q: How are notifications delivered reliably?
   A: Durable queue + retry with exponential backoff, `notifications` table for tracking and retries.

8. Q: How would you scale DB-heavy analytics?
   A: Read replicas, materialized views, separate analytics DB or data warehouse, scheduled ETL.

9. Q: How to validate malware scanning?
   A: Use EICAR test file and simulated malicious payloads; integrate commercial AV engines in production.

10. Q: How to comply with privacy laws?
    A: Data minimization, retention policies, DSAR endpoints, encrypted storage and legal DPAs.

... (additional questions 11–50 included in full report appendix upon request).

---

## 13. Possible Trick Questions (with model answers)

- Q: Why not blockchain?
  - A: Blockchain adds immutability but introduces privacy, scalability, cost, and legal validation challenges. A simpler approach uses cryptographic hashes and auditable logs with optional blockchain anchoring for timestamps.

- Q: Why not microservices from day one?
  - A: Microservices introduce substantial operational overhead. Start with a modular monolith and split services once load/ops justify it.

- Q: Why not Firebase?
  - A: Firebase limits control over data locality, RBAC granularity and compliance controls needed for law-enforcement workflows.

- Q: How do you prevent fake complaints?
  - A: Rate-limits, device fingerprinting, verification steps, reputation scoring, human review for flagged cases.

- Q: What if malware is uploaded?
  - A: Quarantine, notify admins, preserve for forensics and block dissemination.

---

## 14. Presentation Content

### Slide structure
1. Title & team
2. Problem statement
3. Objectives & scope
4. High-level architecture diagram
5. Data model & key tables
6. Key flows (auth/submit/evidence)
7. Security & STRIDE summary
8. Deployment & scalability
9. Testing & QA
10. Demo plan & screenshots
11. Metrics & KPIs
12. Limitations & future work
13. Conclusion & Q/A

### Speaking notes
- Provide 2–4 bullet points per slide; emphasize trade-offs, security, and the roadmap to production.

### Demo script
1. Register + verify
2. Login with MFA
3. Submit complaint + presigned upload
4. Admin assign + view evidence + update status + show audit log + notification

### Elevator pitch (30s)
"A secure, auditable portal enabling citizens to file cybercrime reports, upload evidence safely, and track progress — giving investigators structured workflows and an auditable chain-of-custody for improved triage and resolution."

### Technical pitch (2 min)
- Stack justification (Next.js, FastAPI, PostgreSQL), security posture (MFA, Argon2, TLS, scanning), evidence integrity (hashing, audit logs), and roadmap for production hardening (SIEM, HSM, legal connectors).

---

## 15. Important Faculty Expectations

- Avoid vague architecture descriptions; be specific about components and data flows.
- Do not overclaim production readiness or legal admissibility.
- Demonstrate strong security reasoning (MFA, scanning, auditability).
- Present a consistent tech stack and compliance considerations.
- Show backup and recovery plans and testing evidence.

---

## 16. Defensive Preparation Notes

- What NOT to claim: production readiness, legal admissibility without jurisdictional approvals, full national-scale resilience.
- If a feature wasn't implemented: explain why, present the design and a concrete implementation plan with technologies and timeline.
- Defend architecture decisions by explaining trade-offs: complexity vs maintainability, transactional integrity vs distribution.
- For security questions: refer to STRIDE mitigations, concrete crypto choices (Argon2 parameters, token TTLs), and testing/scan evidence.

---

## 17. Industry-Level Improvements

- SIEM & SOC integration for real-time correlation and alerting
- AI fraud detection and case correlation (hash/IOC overlap)
- Evidence chain-of-custody with PKI & optional blockchain anchoring for timestamping
- HSM-backed digital signatures for evidentiary artifacts
- Secure document vault with strict access controls and retention rules
- Law-enforcement API integration with mutual auth and documented legal flows

---

## Appendix: Example snippets

### Example PostgreSQL DDL (simplified)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  phone varchar(32),
  role text NOT NULL CHECK (role IN ('citizen','investigator','admin','auditor')),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE,
  user_id uuid REFERENCES users(id),
  title text NOT NULL,
  description text NOT NULL,
  category text,
  severity smallint DEFAULT 3,
  status text NOT NULL DEFAULT 'received',
  assigned_to uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_complaints_status_created ON complaints (status, created_at);
CREATE INDEX idx_complaints_text ON complaints USING GIN (to_tsvector('english', title || ' ' || description));
```

### Example OpenAPI path (simplified)
```yaml
paths:
  /api/auth/login:
    post:
      summary: Login
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string }
                password: { type: string }
      responses:
        '200':
          description: OK
```

### GitHub Actions CI (simplified)
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-python@v4
      with: python-version: '3.11'
    - name: Install deps
      run: pip install -r requirements.txt
    - name: Run tests
      run: pytest -q
    - name: Build Docker
      run: docker build -t registry.example.com/bcnp/api:latest .
```

---

## Next steps
- I can also produce any of the following on request:
  - Export this Markdown to PDF
  - A `.pptx` slide deck with speaker notes
  - OpenAPI / Postman collection skeleton
  - Database migration scripts (Alembic)
  - Dockerfiles and `docker-compose.yml` for local dev

Please tell me which artifact you'd like next.
