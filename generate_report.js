const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
    ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
    TabStopType, TabStopPosition, UnderlineType
} = require('docx');
const fs = require('fs');

// ── colour tokens ──────────────────────────────────────────────────────────
const NAVY = "000000";
const BLUE = "000000";
const LTBLUE = "F2F2F2";
const GRAY = "F2F2F2";
const BLACK = "000000";
const WHITE = "FFFFFF";

// ── border helper ──────────────────────────────────────────────────────────
const bdr = (color = "AAAAAA", sz = 6) => ({ style: BorderStyle.SINGLE, size: sz, color });
const allBorders = (color = "AAAAAA") => ({ top: bdr(color), bottom: bdr(color), left: bdr(color), right: bdr(color) });
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ── spacing helpers ────────────────────────────────────────────────────────
const sp = (before = 0, after = 120) => ({ before, after, line: 360, lineRule: "auto" });
const spBody = { before: 0, after: 120, line: 360, lineRule: "auto" };

// ── paragraph helpers ──────────────────────────────────────────────────────
function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text, bold: true, size: 36, color: NAVY, font: "Times New Roman" })],
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE } }
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text, bold: true, size: 28, color: BLUE, font: "Times New Roman" })],
        spacing: { before: 280, after: 120 }
    });
}

function h3(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text, bold: true, size: 24, color: NAVY, font: "Times New Roman" })],
        spacing: { before: 200, after: 80 }
    });
}

function body(text, opts = {}) {
    return new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
        spacing: spBody,
        children: [new TextRun({ text, size: 24, font: "Times New Roman", color: BLACK, ...(opts.bold ? { bold: true } : {}), ...(opts.italic ? { italics: true } : {}) })]
    });
}

function bodyRuns(runs) {
    return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: spBody,
        children: runs.map(r => new TextRun({ font: "Times New Roman", size: 24, color: BLACK, ...r }))
    });
}

function blank(n = 1) {
    return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun("")], spacing: { before: 0, after: 0 } }));
}

function pb() {
    return new Paragraph({ children: [new PageBreak()] });
}

function bullet(text, level = 0) {
    return new Paragraph({
        numbering: { reference: "bullets", level },
        spacing: { before: 40, after: 40, line: 300, lineRule: "auto" },
        children: [new TextRun({ text, size: 24, font: "Times New Roman", color: BLACK })]
    });
}

function numItem(text, level = 0) {
    return new Paragraph({
        numbering: { reference: "numbers", level },
        spacing: { before: 40, after: 40, line: 300, lineRule: "auto" },
        children: [new TextRun({ text, size: 24, font: "Times New Roman", color: BLACK })]
    });
}

// ── table helpers ──────────────────────────────────────────────────────────
function makeCell(text, opts = {}) {
    const { bold = false, shading, width = 4680, vAlign, colspan = 1 } = opts;
    return new TableCell({
        width: { size: width, type: WidthType.DXA },
        borders: allBorders("BBBBBB"),
        shading: shading ? { fill: shading, type: ShadingType.CLEAR } : undefined,
        verticalAlign: vAlign || VerticalAlign.CENTER,
        columnSpan: colspan,
        margins: { top: 80, bottom: 80, left: 140, right: 140 },
        children: [new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 0, after: 0, line: 280, lineRule: "auto" },
            children: [new TextRun({ text, size: 22, font: "Times New Roman", color: BLACK, bold })]
        })]
    });
}

function hdrCell(text, width = 4680) {
    return makeCell(text, { bold: true, shading: LTBLUE, width });
}

function simpleTable(headers, rows, colWidths) {
    const total = colWidths.reduce((a, b) => a + b, 0);
    return new Table({
        width: { size: total, type: WidthType.DXA },
        columnWidths: colWidths,
        rows: [
            new TableRow({ children: headers.map((h, i) => hdrCell(h, colWidths[i])) }),
            ...rows.map(row => new TableRow({ children: row.map((cell, i) => makeCell(cell, { width: colWidths[i] })) }))
        ]
    });
}

// ═══════════════════════════════════════════════════════════════════════════
//  TITLE PAGE
// ═══════════════════════════════════════════════════════════════════════════
function titlePageChildren() {
    return [
        ...blank(2),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [new TextRun({ text: "BHARAT CYBER NYAY PORTAL", bold: true, size: 36, color: NAVY, font: "Times New Roman", underline: { type: UnderlineType.SINGLE } })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [new TextRun({ text: "Cyber Crime Reporting and Case Tracking System", bold: false, size: 28, color: BLUE, font: "Times New Roman", italics: true })]
        }),
        ...blank(1),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: "A Project Report Submitted in Partial Fulfilment of", size: 24, font: "Times New Roman", color: BLACK })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: "the Requirements for the Award of the Degree of", size: 24, font: "Times New Roman", color: BLACK })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [new TextRun({ text: "BACHELOR OF COMPUTER APPLICATIONS (BCA)", bold: true, size: 28, color: NAVY, font: "Times New Roman" })]
        }),
        ...blank(1),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Submitted by", size: 24, font: "Times New Roman", color: BLACK, italics: true })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Arka Dey  |  Arijeet Kuiry", bold: true, size: 28, color: NAVY, font: "Times New Roman" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Roll No: [ROLL_NUMBER_1]  |  Roll No: [ROLL_NUMBER_2]", size: 24, font: "Times New Roman", color: BLACK })]
        }),
        ...blank(1),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Under the Guidance of", size: 24, font: "Times New Roman", color: BLACK, italics: true })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "[GUIDE_NAME]", bold: true, size: 28, color: BLUE, font: "Times New Roman" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "[GUIDE_DESIGNATION], Department of Computer Science", size: 24, font: "Times New Roman", color: BLACK })]
        }),
        ...blank(1),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Department of Computer Science", bold: true, size: 28, color: NAVY, font: "Times New Roman" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Netaji Subhash University", bold: true, size: 28, color: NAVY, font: "Times New Roman" })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Academic Session: 2023–2026", size: 24, font: "Times New Roman", color: BLACK })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: "Submission Date: June 2026", size: 24, font: "Times New Roman", color: BLACK })]
        }),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CERTIFICATE
// ═══════════════════════════════════════════════════════════════════════════
function certificateChildren() {
    return [
        h1("CERTIFICATE"),
        ...blank(1),
        body("This is to certify that the project entitled 'BHARAT CYBER NYAY PORTAL: Cyber Crime Reporting and Case Tracking System' has been successfully completed by Arka Dey (Roll No: [ROLL_NUMBER_1]) and Arijeet Kuiry (Roll No: [ROLL_NUMBER_2]), students of the Bachelor of Computer Applications programme at the Department of Computer Science, Netaji Subhash University, during the Academic Session 2023–2026."),
        ...blank(1),
        body("The work embodied in this report is original, carried out independently under our supervision, and has not been submitted elsewhere for the award of any degree or diploma."),
        ...blank(2),
        simpleTable(
            ["", ""],
            [
                ["Guide Signature:", "Head of Department Signature:"],
                ["[GUIDE_NAME]", "[HOD_NAME]"],
                ["[GUIDE_DESIGNATION]", "Head, Dept. of Computer Science"],
                ["Netaji Subhash University", "Netaji Subhash University"],
                ["Date:", "Date:"],
            ],
            [4680, 4680]
        ),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  DECLARATION
// ═══════════════════════════════════════════════════════════════════════════
function declarationChildren() {
    return [
        h1("DECLARATION"),
        ...blank(1),
        body("We, Arka Dey and Arijeet Kuiry, students of Bachelor of Computer Applications (Final Year) at the Department of Computer Science, Netaji Subhash University, hereby declare that the project report titled 'BHARAT CYBER NYAY PORTAL: Cyber Crime Reporting and Case Tracking System' submitted in partial fulfilment of the requirements for the degree of Bachelor of Computer Applications is an authentic record of work carried out by us."),
        ...blank(1),
        body("This project has been developed under the supervision of [GUIDE_NAME]. All sources of information have been duly acknowledged and referenced within the document. This work has not been submitted, in full or in part, to any other university or institution for the award of any degree, diploma, or certificate."),
        ...blank(1),
        body("We take complete responsibility for the authenticity of the work presented herein and declare that no part of this project has been plagiarised from any external source without proper attribution."),
        ...blank(3),
        simpleTable(
            ["", ""],
            [
                ["Arka Dey", "Arijeet Kuiry"],
                ["Roll No: [ROLL_NUMBER_1]", "Roll No: [ROLL_NUMBER_2]"],
                ["Date:", "Date:"],
            ],
            [4680, 4680]
        ),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  ACKNOWLEDGEMENT
// ═══════════════════════════════════════════════════════════════════════════
function acknowledgementChildren() {
    return [
        h1("ACKNOWLEDGEMENT"),
        ...blank(1),
        body("We take this opportunity to express our profound gratitude to all those who contributed to the successful completion of this project."),
        ...blank(1),
        body("We are deeply grateful to our project guide, [GUIDE_NAME], [GUIDE_DESIGNATION], Department of Computer Science, Netaji Subhash University, whose consistent guidance, constructive feedback, and intellectual encouragement proved invaluable throughout the duration of this project. Their expertise in software engineering and web application development greatly shaped the direction and quality of this work."),
        ...blank(1),
        body("We extend our sincere thanks to the Head of Department, [HOD_NAME], for providing us with the necessary academic resources, infrastructure, and a conducive environment for project development. The department's support has been instrumental in realising this project."),
        ...blank(1),
        body("We are indebted to all faculty members of the Department of Computer Science for imparting the theoretical knowledge and practical skills that formed the foundation upon which this system was designed and built. The coursework in web technologies, database management, and software engineering provided the essential building blocks for this project."),
        ...blank(1),
        body("We also wish to acknowledge the open-source community whose libraries, frameworks, and documentation — particularly the teams behind Next.js, Node.js, Express.js, Supabase, and Tailwind CSS — made this project feasible within the academic timeline."),
        ...blank(1),
        body("Finally, we are grateful to our families and friends for their patience, moral support, and encouragement throughout this journey."),
        ...blank(3),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: spBody,
            children: [new TextRun({ text: "Arka Dey & Arijeet Kuiry", size: 24, font: "Times New Roman", color: BLACK, bold: true })]
        }),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  ABSTRACT
// ═══════════════════════════════════════════════════════════════════════════
function abstractChildren() {
    return [
        h1("ABSTRACT"),
        ...blank(1),
        body("The Bharat Cyber Nyay Portal is a full-stack, cloud-native web application designed to bridge the critical gap between cyber crime victims and law enforcement authorities in India. The platform enables citizens to register complaints, upload digital evidence, track case progress in real time, and receive transparent status updates — all through a secure, role-based, mobile-responsive interface accessible from any device."),
        ...blank(1),
        body("India recorded over 15.9 lakh cybercrime complaints on the National Cyber Crime Reporting Portal (NCRP) in 2023, reflecting both the enormous scale of the problem and the urgent need for scalable, citizen-friendly digital infrastructure. The Bharat Cyber Nyay Portal directly addresses systemic deficiencies in the current reporting ecosystem: absence of real-time case tracking, informal evidence handling, lack of investigator collaboration tools, and no structured pathway for anonymous reporting of sensitive crimes."),
        ...blank(1),
        body("The system is architected as a three-tier client-server application. The frontend is built with Next.js 14 (React 18) and styled using Tailwind CSS, deployed on Vercel's global CDN. The backend comprises a Node.js/Express.js REST API, deployed on Render, which enforces a comprehensive security middleware pipeline including Helmet, CORS, CSRF protection, HTTP Parameter Pollution (HPP) guards, and per-IP rate limiting. The data layer is powered by a PostgreSQL database hosted on Supabase, with file storage for evidence uploaded to Supabase Storage. File integrity is assured through SHA-256 hashing of every evidence file uploaded to the system."),
        ...blank(1),
        body("Authentication is implemented via JSON Web Tokens (JWT) with bcrypt password hashing at a cost factor of 12. The platform enforces a three-tier Role-Based Access Control (RBAC) model separating citizen, investigator, and administrator functions at both the API and UI levels. An OTP-based email verification flow is implemented for registration, and a complete password-reset mechanism is provided through a multi-step OTP workflow. Google OAuth 2.0 is supported as an alternate authentication pathway."),
        ...blank(1),
        body("The portal supports seven enumerated cyber crime categories, validated by Zod schemas on both client and server sides. A dedicated analytics dashboard aggregates crime distribution, monthly filing trends, status breakdowns, geographic distribution, and aggregate financial loss data using server-side PostgreSQL stored functions. A full case timeline and chain-of-custody audit log is maintained for every report. Anonymous reporting is supported for three eligible crime categories — Phishing, Fake Websites, and Social Media Harassment — to reduce psychological barriers to reporting."),
        ...blank(1),
        body("Deployment is fully automated via GitHub Actions CI/CD pipelines, with infrastructure-as-code deployment scripts provisioning Nginx, SSL/TLS certificates via Let's Encrypt/Certbot, and PM2 process management on an AWS EC2 instance. The project successfully demonstrates a production-grade, security-conscious civic technology platform deployable on free-tier cloud services, serving as a functional prototype for a nationally scalable cyber crime case management system."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  TABLE OF CONTENTS (manual)
// ═══════════════════════════════════════════════════════════════════════════
function tocChildren() {
    const entries = [
        ["Certificate", "ii"], ["Declaration", "iii"], ["Acknowledgement", "iv"], ["Abstract", "v"],
        ["Table of Contents", "vi"],
        ["1. Introduction", "1"], ["   1.1  Background of Cyber Crime in India", "1"], ["   1.2  Motivation for the Project", "2"], ["   1.3  Project Overview", "2"],
        ["2. Problem Statement", "3"],
        ["3. Objectives of the Project", "5"],
        ["4. System Analysis", "6"], ["   4.1  Existing System Analysis", "6"], ["   4.2  Proposed System Analysis", "7"], ["   4.3  Feasibility Study", "7"],
        ["5. Software and Hardware Requirements", "9"],
        ["6. System Design", "11"], ["   6.1  Overall Architecture", "11"], ["   6.2  Data Flow Diagrams", "12"], ["   6.3  Use Case Diagram", "14"], ["   6.4  Entity Relationship Diagram", "15"], ["   6.5  Sequence Diagram", "16"],
        ["7. Module Description", "17"],
        ["8. Database Design", "28"],
        ["9. Implementation", "32"],
        ["10. Output Screens", "44"],
        ["11. Testing", "47"],
        ["12. Conclusion", "54"],
        ["13. Future Scope", "55"],
        ["14. Bibliography", "57"],
    ];
    return [
        h1("TABLE OF CONTENTS"),
        ...blank(1),
        ...entries.map(([title, pg]) => new Paragraph({
            spacing: { before: 40, after: 40, line: 300, lineRule: "auto" },
            tabStops: [{ type: TabStopType.RIGHT, position: 9000, leader: { type: "dot" } }],
            children: [
                new TextRun({ text: title, size: 24, font: "Times New Roman", color: BLACK, bold: !title.startsWith("   ") && title !== "Certificate" }),
                new TextRun({ text: "\t" + pg, size: 24, font: "Times New Roman", color: BLACK })
            ]
        })),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 1 — INTRODUCTION
// ═══════════════════════════════════════════════════════════════════════════
function chapter1() {
    return [
        h1("CHAPTER 1: INTRODUCTION"),
        h2("1.1 Background of Cyber Crime in India"),
        body("The rapid expansion of internet infrastructure, digital payment systems, and social media platforms across India over the past decade has been accompanied by an equally significant and worrying rise in cyber criminal activity. From Unified Payments Interface (UPI) fraud and phishing scams to identity theft, sextortion, and cryptocurrency fraud, the digital landscape presents increasingly sophisticated threats to individuals, businesses, financial institutions, and government entities alike."),
        ...blank(1),
        body("According to data published by the Indian Cyber Crime Coordination Centre (I4C) and the National Crime Records Bureau (NCRB), India witnessed a 113% increase in cyber crime complaints between 2021 and 2023. Financial fraud alone accounted for reported losses exceeding ₹10,319 crore in 2023. The National Cyber Crime Reporting Portal (NCRP), operated by the Ministry of Home Affairs, recorded over 15.9 lakh complaints in that year alone, representing only a fraction of actual incidents due to widespread under-reporting. The most affected demographics include senior citizens, students, rural populations with limited digital literacy, and first-time internet users."),
        ...blank(1),
        body("The legislative framework governing cyber crime in India — principally the Information Technology Act, 2000 (amended 2008), the IT (Reasonable Security Practices) Rules 2011, the Digital Personal Data Protection Act 2023, and CERT-In Directions under Section 70B — provides a legal basis for enforcement and reporting obligations. However, the absence of a scalable, transparent, citizen-facing digital infrastructure to operationalise these obligations at scale remains a significant governance gap."),
        h2("1.2 Motivation for the Project"),
        body("Despite the existence of the NCRP, several systemic limitations continue to undermine its effectiveness. Citizens who file complaints receive little to no transparency about the progress of their cases. Evidence submission is informal and unverified. Investigators operate in information silos without structured collaboration tools. Anonymous reporting — critical for socially sensitive crimes such as online harassment and phishing — is absent or inadequate. Finally, there is no analytics layer that allows administrators and policymakers to understand emerging crime patterns in real time."),
        ...blank(1),
        body("These gaps motivated the development of the Bharat Cyber Nyay Portal — a prototype full-stack web application that reimagines the cyber crime reporting and case management experience from the citizen's perspective. The project was undertaken as an academic demonstration of how modern web technologies can be leveraged to build accessible, secure, and transparent civic digital infrastructure within the constraints of a final-year BCA project."),
        h2("1.3 Project Overview"),
        body("The Bharat Cyber Nyay Portal provides three distinct user experiences corresponding to three roles: citizens who file and track complaints; investigators who manage assigned cases and record findings; and administrators who oversee the entire workflow, manage investigator accounts, and analyse aggregate data. The system supports seven enumerated crime categories, a mandatory evidence upload workflow with SHA-256 file integrity verification, an OTP-based email authentication system, anonymous reporting for eligible crime types, and a full case lifecycle audit trail. The analytics dashboard provides visual insights into crime distribution, monthly trends, geographic hotspots, and aggregate financial loss."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 2 — PROBLEM STATEMENT
// ═══════════════════════════════════════════════════════════════════════════
function chapter2() {
    return [
        h1("CHAPTER 2: PROBLEM STATEMENT"),
        h2("2.1 Deficiencies in Existing Reporting Mechanisms"),
        body("The current landscape of cyber crime reporting in India suffers from a series of interconnected structural and technological deficiencies that collectively reduce the system's effectiveness and deter citizen participation."),
        h3("2.1.1 Opacity of Case Status"),
        body("Once a citizen files a report — whether through an online portal or at a physical police station — there is typically no transparent, self-service mechanism for tracking the progress of their case. Complainants are left without any means to determine whether their report has been acknowledged, assigned to an officer, actively investigated, or resolved. This opacity erodes public trust and discourages future reporting."),
        h3("2.1.2 Inadequate Evidence Handling"),
        body("Physical and digital evidence such as transaction screenshots, chat logs, email headers, and phishing URLs is often submitted informally, without any standardised process for verifying file integrity, establishing a chain of custody, or linking evidence records permanently to their corresponding case. This creates vulnerabilities in the evidentiary chain that can be exploited during legal proceedings."),
        h3("2.1.3 Absence of Investigator Collaboration Tools"),
        body("Investigators assigned to cyber crime cases lack a structured digital workspace where they can record investigation notes, track status changes, review uploaded evidence, add case timeline entries, and communicate updates to the complainant. This gap produces information silos and contributes to delays in case resolution."),
        h3("2.1.4 No Structured Anonymous Reporting Pathway"),
        body("Many cyber crime victims — particularly those targeted in social media harassment, sextortion, or phishing attacks — are reluctant to file formal complaints due to fear of public exposure, social stigma, retaliation, or distrust of authorities. The absence of a formal anonymous reporting channel in existing systems contributes to significant under-reporting of sensitive crimes."),
        h3("2.1.5 Limited Analytical Capability"),
        body("Law enforcement agencies and policy makers lack real-time, accessible analytics to identify which crime types are increasing, which geographic regions are most affected, how case statuses are distributed, and what aggregate financial losses are being reported. Without such data, resource allocation and policy design remain reactive rather than proactive."),
        h2("2.2 Summary of Identified Gaps"),
        simpleTable(
            ["Gap Identified", "Operational Impact", "Severity"],
            [
                ["No citizen-facing case tracking", "Citizens feel ignored; case abandonment", "High"],
                ["Informal evidence submission", "Evidence integrity is unverifiable", "High"],
                ["No investigator notes / workspace", "Investigations lack documentation trails", "Medium"],
                ["No anonymous reporting pathway", "Under-reporting of sensitive crimes", "High"],
                ["No analytics dashboard", "Limited policy and resource planning capability", "Medium"],
                ["No email/SMS notification system", "Citizens unaware of case progression", "Medium"],
                ["No real-time case status updates", "Outdated information visible to citizens", "Medium"],
            ],
            [3400, 3400, 2200]
        ),
        ...blank(1),
        body("Each of the gaps identified in the table above is directly addressed by one or more features of the Bharat Cyber Nyay Portal, as detailed in the subsequent chapters of this report."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 3 — OBJECTIVES
// ═══════════════════════════════════════════════════════════════════════════
function chapter3() {
    return [
        h1("CHAPTER 3: OBJECTIVES OF THE PROJECT"),
        h2("3.1 Primary Objectives"),
        body("The following primary objectives guided the design, development, and deployment of the Bharat Cyber Nyay Portal:"),
        numItem("To provide a citizen-facing interface for submitting detailed, structured cyber crime reports with mandatory and optional metadata fields validated at both client and server layers."),
        numItem("To implement secure, integrity-verified digital evidence upload functionality using SHA-256 hashing and cloud object storage, ensuring a tamper-evident chain of custody."),
        numItem("To design and enforce a three-tier Role-Based Access Control (RBAC) model segregating citizen, investigator, and administrator functions at every API endpoint and UI route."),
        numItem("To deliver real-time case tracking capability using a unique Report ID, enabling citizens to monitor the lifecycle of their complaint from submission through resolution."),
        numItem("To support anonymous reporting for eligible crime categories, lowering the psychological and technical barriers for victims of sensitive crimes."),
        numItem("To equip investigators with a dedicated dashboard providing access to assigned cases, evidence review, investigation note-recording, case status updates, and a complete audit timeline."),
        numItem("To build an analytics dashboard for administrators visualising crime distribution, monthly trends, geographic hotspots, case status breakdowns, and aggregate financial loss data."),
        numItem("To deploy the system cost-effectively on modern cloud platforms using free-tier services, demonstrating a viable production-ready architecture suitable for national scaling."),
        h2("3.2 Security Objectives"),
        body("Given the sensitive nature of cyber crime data handled by the portal, the following security objectives were established as non-negotiable requirements:"),
        bullet("Implement JWT-based stateless authentication with secure HttpOnly cookie storage and a 7-day rolling expiry to prevent token exposure in JavaScript contexts."),
        bullet("Enforce bcrypt password hashing with a cost factor of 12, ensuring computational resistance against brute-force and dictionary attacks."),
        bullet("Apply multi-layer input validation using Zod schemas on both frontend and backend to eliminate injection attack surfaces."),
        bullet("Integrate CSRF protection via the csurf middleware with double-submit cookie pattern, preventing cross-site request forgery."),
        bullet("Configure comprehensive HTTP security headers through Helmet, including Content Security Policy, HSTS, X-Frame-Options, and Referrer-Policy."),
        bullet("Implement IP-level rate limiting (300 requests per 15-minute window) and account lockout after 5 consecutive failed login attempts."),
        bullet("Enforce file MIME type validation and magic-byte verification for all evidence uploads to prevent polyglot file attacks."),
        bullet("Maintain a full case timeline audit log capturing actor, role, IP address, user agent, timestamp, and action metadata for every significant system event."),
        h2("3.3 Performance and Usability Objectives"),
        bullet("Achieve mobile-first responsive design across all pages using Tailwind CSS breakpoints, ensuring full functionality on smartphones and tablets."),
        bullet("Minimise cold-start latency through deployment on Vercel's global CDN for the frontend and PM2-managed processes on EC2 for the backend."),
        bullet("Ensure all form interactions provide immediate, clear feedback including validation errors, loading states, and success confirmations."),
        bullet("Support bi-lingual operation (English and Hindi) through Google Translate integration via the LanguageSwitcher component."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 4 — SYSTEM ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════
function chapter4() {
    return [
        h1("CHAPTER 4: SYSTEM ANALYSIS"),
        h2("4.1 Existing System Analysis"),
        body("The National Cyber Crime Reporting Portal (NCRP) at cybercrime.gov.in is the primary government mechanism for cyber crime reporting in India. While it provides a channel for complaint registration, it suffers from several operational constraints. The portal does not offer a real-time, self-service case tracking interface beyond a basic acknowledgement receipt. Uploaded evidence undergoes no automated integrity verification, and complainants have no visibility into whether their evidence has been reviewed. The system does not provide investigators with a structured collaboration workspace, and there is no analytics layer accessible to administrators for identifying crime trends. The user experience is cumbersome on mobile devices, and the portal offers no anonymous reporting pathway for sensitive crimes."),
        ...blank(1),
        body("Traditional police station-based complaint mechanisms suffer even more acutely from these limitations, requiring physical presence, paper-based processes, and offering no digital evidence submission or tracking capability whatsoever."),
        h2("4.2 Proposed System Analysis"),
        body("The Bharat Cyber Nyay Portal addresses each of the identified gaps through a comprehensive set of features. The proposed system provides structured, multi-field complaint submission forms with client-server validation. SHA-256 file integrity hashing ensures all uploaded evidence is tamper-evident. A unique Report ID allows citizens to self-serve their case status at any time. Investigators receive a dedicated dashboard with full case context, evidence access, note-recording capability, and status update functionality. Administrators have access to a case assignment tool, investigator management interface, and a rich analytics dashboard. Anonymous reporting is supported for eligible crime types. A full case timeline serves as an audit trail for all case events."),
        h2("4.3 Feasibility Study"),
        h3("4.3.1 Technical Feasibility"),
        body("The project leverages a modern, well-documented, open-source technology stack — Next.js, Node.js, Express.js, PostgreSQL via Supabase, and Tailwind CSS — for which extensive community support and free deployment infrastructure exist. All chosen technologies are production-grade and widely used in commercial applications. The team possessed the necessary programming competency in JavaScript/TypeScript, React, Node.js, and database management. The project is technically feasible within the academic timeline and resource constraints."),
        h3("4.3.2 Operational Feasibility"),
        body("The system is designed for non-technical end users. The citizen-facing interface employs progressive disclosure, clear form labels, step-by-step guidance, and immediate validation feedback. The investigator and administrator dashboards provide contextual tooling without requiring technical expertise. Google Translate integration supports Hindi-speaking users. The operational workflows — report submission, evidence upload, case tracking, case assignment — are intuitive and aligned with existing mental models from other government portals. The system is operationally feasible for deployment in a real-world context."),
        h3("4.3.3 Economic Feasibility"),
        body("The entire technology stack is built on open-source software with no licensing costs. Deployment infrastructure uses free tiers from Vercel (frontend), Render (backend), and Supabase (database and storage). The domain and SSL certificate are the only recurring costs. This economic model makes the system prototype fully viable as a proof-of-concept and demonstrates how the architecture could be scaled on paid tiers for production deployment at a low cost-per-transaction."),
        h2("4.4 Advantages of the Proposed System"),
        simpleTable(
            ["Dimension", "Existing Systems", "Bharat Cyber Nyay Portal"],
            [
                ["Case Tracking", "Not available to citizens", "Real-time via Report ID"],
                ["Evidence Integrity", "Not verified", "SHA-256 hash per file"],
                ["Anonymous Reporting", "Not supported", "Supported for 3 crime types"],
                ["Investigator Workspace", "Not available", "Dedicated dashboard"],
                ["Analytics", "Not accessible", "Full dashboard for admins"],
                ["Mobile Responsiveness", "Limited", "Fully responsive (Tailwind CSS)"],
                ["Audit Trail", "None", "Full case timeline log"],
                ["Authentication", "N/A (portal-level)", "JWT + OTP + Google OAuth 2.0"],
            ],
            [2800, 3300, 2900]
        ),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 5 — REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════
function chapter5() {
    return [
        h1("CHAPTER 5: SOFTWARE AND HARDWARE REQUIREMENTS"),
        h2("5.1 Software Requirements"),
        h3("5.1.1 Frontend Technologies"),
        simpleTable(
            ["Component", "Technology/Version", "Purpose"],
            [
                ["Framework", "Next.js 16.2.6 (React 18.3.1)", "App Router, SSR, routing, CDN deployment"],
                ["Styling", "Tailwind CSS 3.4.14", "Utility-first responsive design system"],
                ["HTTP Client", "Axios 1.16.0", "REST API communication with interceptors"],
                ["Data Visualisation", "Recharts 2.15.4", "Analytics charts and graphs"],
                ["Icon Library", "React Icons 5.6.0", "UI iconography"],
                ["Package Manager", "npm", "Dependency management"],
                ["Build Tool", "Next.js built-in (SWC/Webpack)", "Production bundle generation"],
                ["Linter", "ESLint (Next.js preset)", "Code quality enforcement"],
            ],
            [2400, 2880, 3080]
        ),
        ...blank(1),
        h3("5.1.2 Backend Technologies"),
        simpleTable(
            ["Component", "Technology/Version", "Purpose"],
            [
                ["Runtime", "Node.js ≥ 18", "Server-side JavaScript execution"],
                ["Web Framework", "Express.js 4.22.2", "REST API routing and middleware pipeline"],
                ["Validation", "Zod 3.23.8", "Schema validation for all request bodies"],
                ["File Upload", "Multer 2.1.1", "Multipart form data and file handling"],
                ["Security Headers", "Helmet 8.0.0", "HTTP response security headers"],
                ["Rate Limiting", "express-rate-limit 7.4.1", "Abuse and DoS protection"],
                ["CSRF Protection", "csurf 1.11.0", "Cross-site request forgery prevention"],
                ["HPP Guard", "hpp 0.2.3", "HTTP parameter pollution prevention"],
                ["Authentication", "jsonwebtoken 9.0.2", "JWT signing and verification"],
                ["Password Hashing", "bcryptjs 2.4.3", "Secure credential storage"],
                ["Google Auth", "google-auth-library 10.7.0", "OAuth 2.0 token verification"],
                ["Email", "nodemailer 8.0.5", "OTP email delivery via SMTP"],
                ["DB Client", "@supabase/supabase-js 2.49.1", "PostgreSQL and storage access"],
                ["Process Manager", "PM2 (production)", "Application lifecycle management"],
            ],
            [2400, 2880, 3080]
        ),
        ...blank(1),
        h3("5.1.3 Database and Infrastructure"),
        simpleTable(
            ["Component", "Technology", "Purpose"],
            [
                ["Database", "PostgreSQL 15 (Supabase managed)", "Relational data persistence"],
                ["File Storage", "Supabase Storage (S3-compatible)", "Evidence file object storage"],
                ["Frontend Hosting", "Vercel (Global CDN)", "Next.js deployment and edge delivery"],
                ["Backend Hosting", "Render (Web Service)", "Node.js API hosting"],
                ["EC2 (Alternative)", "AWS EC2 + Nginx + PM2", "Production server deployment"],
                ["SSL/TLS", "Let's Encrypt via Certbot", "HTTPS certificate management"],
                ["Reverse Proxy", "Nginx", "API and frontend routing"],
                ["CI/CD", "GitHub Actions", "Automated deployment pipeline"],
                ["Version Control", "Git / GitHub", "Source code management"],
            ],
            [2400, 2880, 3080]
        ),
        h2("5.2 Hardware Requirements"),
        h3("5.2.1 Development Environment"),
        simpleTable(
            ["Component", "Minimum Specification", "Recommended"],
            [
                ["Processor", "Intel Core i5 / AMD Ryzen 5 (4 cores)", "Intel Core i7 / AMD Ryzen 7"],
                ["RAM", "8 GB DDR4", "16 GB DDR4"],
                ["Storage", "256 GB SSD", "512 GB SSD"],
                ["Display", "1366 × 768 resolution", "1920 × 1080 resolution"],
                ["Network", "Broadband (10 Mbps)", "Broadband (50 Mbps)"],
                ["Operating System", "Windows 10 / macOS 12 / Ubuntu 20.04", "Windows 11 / macOS 14 / Ubuntu 22.04"],
            ],
            [2400, 3000, 3000]
        ),
        ...blank(1),
        h3("5.2.2 Production Server (EC2)"),
        simpleTable(
            ["Component", "Specification"],
            [
                ["Instance Type", "AWS EC2 t3.small or equivalent"],
                ["vCPUs", "2"],
                ["RAM", "2 GB"],
                ["Storage", "20 GB SSD (EBS)"],
                ["Operating System", "Ubuntu 24.04 LTS"],
                ["Network", "Elastic IP, inbound ports 80/443/22"],
            ],
            [3600, 5760]
        ),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 6 — SYSTEM DESIGN
// ═══════════════════════════════════════════════════════════════════════════
function chapter6() {
    return [
        h1("CHAPTER 6: SYSTEM DESIGN"),
        h2("6.1 Overall Architecture"),
        body("The Bharat Cyber Nyay Portal follows a three-tier client-server architecture comprising a client tier, an application tier, and a data tier, each independently deployable and horizontally scalable."),
        ...blank(1),
        body("The Client Tier is a Next.js 14 Single-Page Application rendered at Vercel's global CDN edge nodes. All user interactions are handled within React components that communicate with the backend exclusively via HTTPS REST API calls managed through an Axios instance configured with request and response interceptors. The Application Tier is a Node.js/Express.js REST API server. Every incoming request passes through a security middleware pipeline before reaching the route handler and controller. The Data Tier comprises a PostgreSQL relational database hosted on Supabase for structured data and Supabase Storage (S3-compatible object store) for evidence file persistence."),
        ...blank(1),

        h3("Architecture Diagram Description (Three-Tier Model)"),
        body("The following description represents the system's deployment and communication architecture:"),
        bullet("Tier 1 (Client): Web Browser → Next.js React SPA served from Vercel CDN. The client communicates with the backend via HTTPS on port 443, routed through Nginx."),
        bullet("Tier 2 (Application): Nginx Reverse Proxy → Node.js/Express.js REST API (port 5000). The API applies the security middleware chain, processes business logic through controllers, and interacts with the data tier."),
        bullet("Tier 3 (Data): PostgreSQL (Supabase managed instance) for relational data; Supabase Storage bucket for evidence files. The backend communicates with Supabase via the official JavaScript client SDK over HTTPS."),
        bullet("Cross-cutting: GitHub Actions CI/CD pushes new code to Vercel (frontend) and EC2/Render (backend) on every push to the main branch."),

        h2("6.2 Data Flow Diagrams"),
        h3("6.2.1 DFD Level 0 — Context Diagram"),
        body("The Level 0 DFD represents the system as a single process interacting with four external entities:"),
        bullet("Citizen: Submits crime reports, uploads evidence files, and queries case status. Receives case acknowledgements and status updates."),
        bullet("Investigator: Receives assigned case notifications, reviews case details and evidence, submits investigation notes, and updates case status."),
        bullet("Administrator: Assigns cases to investigators, manages investigator accounts, views all reports, and accesses the analytics dashboard."),
        bullet("Email Service (SMTP/Google): Receives OTP dispatch requests from the system and delivers verification codes to citizen and investigator email addresses."),
        bullet("Cloud Storage (Supabase): Receives evidence file upload requests and serves signed download URLs back to the system."),

        h3("6.2.2 DFD Level 1 — Major Processes"),
        body("The Level 1 DFD decomposes the system into the following major processes with their associated data flows:"),
        bullet("Process 1.0 — User Authentication: Accepts credentials or Google OAuth tokens from citizens/investigators/administrators. Validates against the Users data store. Outputs JWT tokens stored in secure HttpOnly cookies. Also handles OTP generation, storage in the MemoryStore, email dispatch via SMTP, and OTP verification."),
        bullet("Process 2.0 — Report Management: Accepts validated report submission data from citizens. Writes to the Reports data store. Outputs a Report ID. Reads from the Reports store to serve case status queries. Applies role-based access control to filter results by user or investigator."),
        bullet("Process 3.0 — Evidence Management: Accepts multipart file uploads. Applies MIME type and magic-byte validation. Computes SHA-256 hash. Writes file to Supabase Storage. Writes metadata to the Evidence data store. Serves proxied file downloads via the backend to authorised users only."),
        bullet("Process 4.0 — Case Management: Accepts status update, investigator assignment, and case note requests from investigators and administrators. Writes to Reports, Case Notes, and Case Timeline data stores. Reads from these stores for the investigator dashboard and admin case assignment views."),
        bullet("Process 5.0 — Analytics: Reads aggregated data from the Reports data store using server-side PostgreSQL stored functions. Outputs JSON datasets consumed by the frontend Recharts visualisation components."),

        h2("6.3 Use Case Diagram"),
        h3("6.3.1 Citizen Use Cases"),
        body("The following use cases are available to authenticated citizens: Register Account, Verify Email via OTP, Login with Credentials, Login with Google OAuth, Submit Crime Report, Upload Evidence, Track Case by Report ID, View Own Reports (Profile Dashboard), and Reset Password via OTP."),
        body("Anonymous users (without login) may access a restricted subset: Submit Crime Report (Phishing/Fake Websites/Social Media Harassment only), Upload Evidence for Anonymous Reports, and Track Case by Report ID."),

        h3("6.3.2 Investigator Use Cases"),
        body("Investigators can access the following use cases: Login, View Assigned Cases Dashboard, View Case Details and Evidence, Add Investigation Notes, Update Case Status, View Case Timeline, and View Own Profile."),

        h3("6.3.3 Administrator Use Cases"),
        body("Administrators have the broadest access: Login, View All Reports with Filters, Assign Investigator to Case, Update Case Status, Delete Case, Add Case Notes, View Case Timeline, Manage Investigators (Create/Update/Delete), Manage Registered Users (View/Delete), and Access Analytics Dashboard."),

        h2("6.4 Entity Relationship (ER) Diagram Description"),
        body("The database schema defines five entities with the following key relationships:"),
        bullet("USERS (id [PK], name, email, phone, password_hash, role, created_at). One-to-many relationship with REPORTS (as reporter) and REPORTS (as assigned investigator). One-to-many with CASE_NOTES (as author)."),
        bullet("REPORTS (report_id [PK], user_id [FK→USERS], victim_name, email, phone_number, crime_type, description, incident_datetime, suspect_details, financial_loss_amount, location, status, assigned_investigator_id [FK→USERS], created_at, updated_at). One-to-many with EVIDENCE and CASE_NOTES and CASE_TIMELINE."),
        bullet("EVIDENCE (evidence_id [PK], report_id [FK→REPORTS], file_url, file_hash, mime_type, original_name, upload_time)."),
        bullet("CASE_NOTES (note_id [PK], report_id [FK→REPORTS], investigator_id [FK→USERS], note_text, created_at)."),
        bullet("CASE_TIMELINE (timeline_id [PK], report_id, action_type, actor_id [FK→USERS], actor_role, metadata [JSONB], ip_address, user_agent, created_at)."),
        body("All foreign key relationships use appropriate ON DELETE cascade or set-null rules. Seven composite indices are defined on frequently queried columns including status, crime_type, location, created_at, and assigned_investigator_id."),

        h2("6.5 Sequence Diagram — Report Submission Flow"),
        body("The following sequence describes the complete report submission process:"),
        numItem("Citizen fills ReportForm.jsx (client-side Zod validation)."),
        numItem("POST /api/reports with Bearer JWT. Nginx proxies to Node.js."),
        numItem("optionalAuthenticate middleware extracts user identity (or marks anonymous)."),
        numItem("Zod validate() middleware validates request body against reportSchema."),
        numItem("reportController.createReport checks anonymous eligibility for crime type."),
        numItem("Supabase INSERT into reports table; returns report record with report_id."),
        numItem("logCaseEvent() inserts CASE_CREATED event into case_timeline."),
        numItem("201 Created response with report object returned to client."),
        numItem("Citizen submits evidence via POST /api/evidence/:reportId (multipart)."),
        numItem("Multer processes file; magic-byte validation applied; SHA-256 hash computed."),
        numItem("File uploaded to Supabase Storage; metadata inserted into evidence table."),
        numItem("logCaseEvent() inserts EVIDENCE_UPLOADED event into case_timeline."),
        numItem("201 Created with evidence record (including proxy URL) returned to client."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 7 — MODULE DESCRIPTION
// ═══════════════════════════════════════════════════════════════════════════
function chapter7() {
    return [
        h1("CHAPTER 7: MODULE DESCRIPTION"),
        body("The system is decomposed into eight major functional modules, each encapsulating a distinct area of concern. The following subsections describe each module in detail."),

        h2("7.1 Authentication and User Management Module"),
        h3("Purpose and Overview"),
        body("This module manages all aspects of user identity, credential management, and session lifecycle. It covers citizen self-registration, email OTP verification, login, logout, Google OAuth 2.0 authentication, forgot-password flows, and profile retrieval."),
        h3("Key Components"),
        bullet("authController.js: Implements sendOtp(), verifyOtp(), registerFinal(), login(), logout(), me(), googleLogin(), forgotPasswordSendOtp(), forgotPasswordVerifyOtp(), and resetPassword() functions."),
        bullet("authRoutes.js: Defines POST /send-otp, /verify-otp, /register-final, /forgot-password/*, /login, /logout, /google, and GET /me routes, each protected by appropriate rate limiters."),
        bullet("authValidation.js: Contains Zod schemas (registerSchema, loginSchema, sendOtpSchema) that validate all auth request bodies, including an email domain blocklist that rejects known free-consumer and disposable email providers while permitting Gmail."),
        bullet("middleware/auth.js: JWT verification middleware that decodes the ccrp_token HttpOnly cookie (or Authorization header) and attaches the user object to req.user."),
        bullet("utils/store.js: MemoryStore class providing in-memory OTP and rate-limit state with TTL-based auto-expiry via setTimeout, avoiding a Redis dependency for the prototype."),
        bullet("utils/mailer.js: Nodemailer-based email dispatch for OTP codes, supporting both registration and password-reset variants."),
        h3("Security Controls"),
        body("Passwords are hashed using bcrypt at cost factor 12. JWTs are signed with a server-side secret and stored in HttpOnly SameSite=Lax cookies. Account lockout is triggered after 5 consecutive failed login attempts for a 15-minute window. Rate limiting is applied at both the Express global level (300 req/15 min) and per-route level (10 req/15 min for auth endpoints). Email enumeration is mitigated by returning identical success responses regardless of whether an email exists in the database during OTP dispatch. OTP codes expire after 5 minutes and are single-use."),

        h2("7.2 Report Submission Module"),
        h3("Purpose and Overview"),
        body("This module handles the creation, retrieval, and metadata management of crime reports — the central entity of the system. It supports both authenticated and anonymous report submission, subject to crime-type restrictions."),
        h3("Key Components"),
        bullet("reportController.js: Implements createReport(), getMyReports(), getReports(), and getReportById(). The createReport function enforces anonymous eligibility by checking the crimeType against ANONYMOUS_ALLOWED_CRIME_TYPES set."),
        bullet("reportRoutes.js: Defines POST / (optionalAuthenticate + Zod validation), GET /my and /me (citizen/investigator), GET / (admin/investigator), GET /:reportId (all roles with ownership checks)."),
        bullet("reportValidation.js: Zod schemas for report creation (reportSchema), status update (reportStatusSchema), investigator assignment (assignInvestigatorSchema), and case notes (caseNoteSchema)."),
        bullet("reportMetadata.js: Centralised configuration for enumerated payment apps and Indian states/UTs, served to the frontend via GET /api/reports/options."),
        bullet("anonymousReporter.js: Resolves or lazily creates a shared system-level anonymous user account (anonymous@ccrp.local) to satisfy the NOT NULL user_id FK constraint for anonymous reports."),
        h3("Frontend Component"),
        body("ReportForm.jsx provides the citizen-facing multi-field form with scam-type-specific conditional fields (e.g., UPI ID and transaction ID for UPI scams; phishing link for phishing reports), an Indian locale financial loss amount formatter, a state/city cascading dropdown, an AM/PM time picker, and a mandatory screenshot evidence upload. Client-side validation mirrors the backend Zod schema, providing immediate feedback before network transmission."),

        h2("7.3 Evidence Management Module"),
        h3("Purpose and Overview"),
        body("This module manages the complete lifecycle of evidence files: upload, validation, storage, integrity verification, and proxied download. It ensures that all evidence is stored securely in cloud object storage with a verifiable chain of custody."),
        h3("Key Components"),
        bullet("evidenceController.js: Implements uploadEvidence(), getEvidenceByReport(), and downloadEvidence(). The upload function applies MIME type whitelist filtering, file size limits (10 MB), and magic-byte signature verification for JPEG, PNG, WebP, PDF, and plain-text files — independently verifying that the declared MIME type matches the actual binary content."),
        bullet("evidenceRoutes.js: Defines POST /:reportId (optionalAuthenticate), GET /:reportId (authenticated, role-restricted), and GET /file/:evidenceId (authenticated, role-restricted proxy download)."),
        bullet("utils/hash.js: sha256Buffer() function using Node.js crypto module for deterministic file integrity fingerprinting."),
        h3("Security Architecture"),
        body("Evidence files are never written to the API server's disk. Multer is configured with memoryStorage(), keeping files exclusively in memory as Buffer objects. File buffers are immediately streamed to Supabase Storage with sanitised path names. The public Supabase Storage URL is never exposed to end users; instead, the backend generates a proxy URL pointing to GET /api/evidence/file/:evidenceId, which re-fetches the file from Supabase and streams it to the authorised client with appropriate Content-Type and Content-Disposition headers. This design prevents direct external access to the storage bucket."),

        h2("7.4 Case Management Module"),
        h3("Purpose and Overview"),
        body("This module encompasses all post-submission case lifecycle operations: status updates, investigator assignments, case note management, case deletion, and the case timeline audit log. It serves both investigator and administrator workflows."),
        h3("Key Components"),
        bullet("caseController.js: Implements getAssignedCases(), updateStatus(), assignInvestigator(), addCaseNote(), getCaseNotes(), getCaseTimeline(), and deleteCase()."),
        bullet("caseRoutes.js: Routes are protected by authenticate middleware and enforced with requireRole for role-specific operations (investigators cannot update unassigned cases; only admins can delete cases or access the full report list)."),
        bullet("caseTimelineService.js: logCaseEvent() function that records case lifecycle events (CASE_CREATED, INVESTIGATOR_ASSIGNED, STATUS_UPDATED, CASE_NOTE_ADDED, EVIDENCE_UPLOADED, CASE_DELETED) with actor identity, IP address, user agent, and JSONB metadata. getCaseTimelineEntries() retrieves the full ordered audit trail for a case. Timeline writes are intentionally non-blocking — failures are logged but do not abort the parent operation."),
        h3("Investigator Dashboard"),
        body("InvestigatorDashboard.jsx renders a filterable, expandable list of cases assigned to the logged-in investigator, with inline status selectors, note input fields, evidence download links, and a notes history panel. Case statistics (total, active, resolved, closed) are computed client-side from the fetched dataset."),

        h2("7.5 Administration Module"),
        h3("Purpose and Overview"),
        body("This module provides the administrator with comprehensive control over the platform, including full case management, investigator account provisioning, user management, and access to the analytics dashboard."),
        h3("Key Components"),
        bullet("adminController.js: Implements getUsers(), getInvestigators() (with live workload statistics), createInvestigator(), updateInvestigator(), deleteInvestigator(), assignInvestigatorByAdmin(), and deleteUser()."),
        bullet("adminRoutes.js: All routes are protected by authenticate + requireAdmin. Input is validated by Zod schemas (adminValidation.js)."),
        bullet("AdminCaseAssignment.jsx: The primary admin workflow component, providing a filterable report queue with inline status dropdowns, investigator assignment selectors, case note input, case timeline viewer with CSV and PDF export, and case deletion with a confirmation modal."),
        bullet("AdminAllCases.jsx: A comprehensive expandable case overview card layout for the admin home dashboard, providing full case details, evidence preview, and inline admin controls."),
        bullet("InvestigatorManagement.jsx: Investigator CRUD interface with real-time workload statistics (total assigned, active, resolved cases) and availability status indicators."),
        bullet("AdminUserManagement.jsx: User listing with role badges and deletion capability. Admin accounts are protected from deletion at the UI level."),

        h2("7.6 Analytics Module"),
        h3("Purpose and Overview"),
        body("This module aggregates and visualises platform-wide crime reporting data for administrator and investigator roles. It provides actionable insights into crime trends, geographic distribution, case status pipeline health, and aggregate financial impact."),
        h3("Key Components"),
        bullet("analyticsController.js: getDashboardAnalytics() invokes five PostgreSQL stored functions via Supabase RPC: get_crime_distribution(), get_monthly_trend(), get_status_breakdown(), get_financial_stats(), and get_reports_per_state(). The stored functions are SECURITY DEFINER, ensuring they execute with fixed database permissions and do not expose raw table access to the API layer."),
        bullet("AnalyticsCharts.jsx: Renders five Recharts visualisation panels — a horizontal bar chart for crime distribution, an area chart for monthly trends, a donut pie chart for status breakdown, a KPI card for total financial loss (formatted in Indian Rupee locale), and a bar chart for geographic hotspots. All charts include a custom tooltip component with formatted number display."),

        h2("7.7 Notification and Language Module"),
        h3("Purpose and Overview"),
        body("This module manages OTP email notifications and the bilingual language switching feature of the portal."),
        h3("Key Components"),
        bullet("utils/mailer.js: Nodemailer transporter configured for Gmail SMTP. sendOtpEmail() generates an HTML email template with the OTP code, supporting both registration and password-reset variants via a type parameter."),
        bullet("LanguageSwitcher.jsx: Implements Google Translate API integration via a lightweight widget injection approach. Persists language preference to localStorage and a googtrans cookie. Supports English and Hindi. The component gracefully degrades by triggering a full page reload if the in-place translation widget is unavailable."),

        h2("7.8 Security Infrastructure Module"),
        h3("Purpose and Overview"),
        body("This cross-cutting module encompasses all security controls that are not tied to a specific feature module but apply platform-wide to every request and response."),
        h3("Key Components"),
        bullet("middleware/requestCorrelation.js: Generates or propagates a UUID v4 correlation ID for every request, attaching it to req.correlationId and the X-Correlation-ID response header, enabling end-to-end request tracing across logs."),
        bullet("middleware/errorHandler.js: Centralised error handler that sanitises error messages before returning them to the client, stripping database connection strings, file paths, JWT secrets, and other sensitive implementation details. All 5xx errors are logged as CRITICAL; operational 4xx errors are logged as WARN."),
        bullet("middleware/validate.js: Generic Zod schema validation middleware that returns a structured 400 response with field-level error details if validation fails."),
        bullet("utils/logger.js: Structured JSON logger with redactSensitiveData() function that scrubs passwords, tokens, email addresses (with masking), phone numbers, and names from log entries before writing to stdout/stderr."),
        bullet("app.js: Assembles the complete Express middleware pipeline in the correct order: requestCorrelation → Helmet → CORS → cookieParser → CSRF → JSON body parser → HPP → global rate limiter → routes → error handlers."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 8 — DATABASE DESIGN
// ═══════════════════════════════════════════════════════════════════════════
function chapter8() {
    return [
        h1("CHAPTER 8: DATABASE DESIGN"),
        h2("8.1 Database Architecture"),
        body("The Bharat Cyber Nyay Portal uses a PostgreSQL 15 relational database hosted on Supabase's managed cloud platform. The database leverages the pgcrypto extension for UUID generation, BIGSERIAL primary keys for efficient sequential case ID generation, JSONB columns for flexible metadata storage in the case timeline, composite indices for query performance, and server-side aggregation functions for the analytics module. The backend interacts with the database exclusively through the @supabase/supabase-js client SDK using the service role key, granting admin-level database access required for cross-user operations performed by investigators and administrators."),
        h2("8.2 Table Structures"),
        h3("8.2.1 USERS Table"),
        simpleTable(
            ["Column", "Data Type", "Constraints", "Description"],
            [
                ["id", "BIGSERIAL", "PRIMARY KEY", "Auto-incrementing user identifier"],
                ["name", "VARCHAR(120)", "NOT NULL", "Full name of the user"],
                ["email", "VARCHAR(255)", "UNIQUE, NOT NULL", "Login email address"],
                ["phone", "VARCHAR(20)", "NULLABLE", "Contact phone number"],
                ["password_hash", "TEXT", "NOT NULL", "bcrypt hash of user password"],
                ["role", "VARCHAR(20)", "NOT NULL, CHECK (IN …)", "citizen | investigator | admin"],
                ["created_at", "TIMESTAMP", "NOT NULL, DEFAULT NOW()", "Account creation timestamp"],
            ],
            [2000, 1800, 2400, 3160]
        ),
        ...blank(1),
        h3("8.2.2 REPORTS Table"),
        simpleTable(
            ["Column", "Data Type", "Constraints", "Description"],
            [
                ["report_id", "BIGSERIAL", "PRIMARY KEY", "Sequential numeric report identifier"],
                ["user_id", "BIGINT", "FK → USERS(id), ON DELETE CASCADE", "Report submitter reference"],
                ["victim_name", "VARCHAR(120)", "NOT NULL", "Name of the victim"],
                ["email", "VARCHAR(255)", "NOT NULL", "Victim contact email"],
                ["phone_number", "VARCHAR(20)", "NOT NULL", "Victim contact phone"],
                ["crime_type", "VARCHAR(80)", "NOT NULL", "Enumerated crime category"],
                ["description", "TEXT", "NOT NULL", "Detailed incident description"],
                ["incident_datetime", "TIMESTAMP", "NOT NULL", "Date and time of incident"],
                ["suspect_details", "TEXT", "NULLABLE", "Scam-specific and suspect details"],
                ["financial_loss_amount", "NUMERIC(12,2)", "NOT NULL, DEFAULT 0", "Reported financial loss (INR)"],
                ["location", "VARCHAR(120)", "NOT NULL", "City, State geographic location"],
                ["status", "VARCHAR(30)", "NOT NULL, CHECK (IN …), DEFAULT 'Submitted'", "Lifecycle status"],
                ["assigned_investigator_id", "BIGINT", "FK → USERS(id), ON DELETE SET NULL", "Assigned investigator"],
                ["created_at", "TIMESTAMP", "NOT NULL, DEFAULT NOW()", "Submission timestamp"],
                ["updated_at", "TIMESTAMP", "NOT NULL, DEFAULT NOW()", "Last modification timestamp"],
            ],
            [2000, 1800, 2400, 3160]
        ),
        ...blank(1),
        h3("8.2.3 EVIDENCE Table"),
        simpleTable(
            ["Column", "Data Type", "Constraints", "Description"],
            [
                ["evidence_id", "BIGSERIAL", "PRIMARY KEY", "Auto-incrementing evidence identifier"],
                ["report_id", "BIGINT", "FK → REPORTS(report_id), ON DELETE CASCADE", "Parent report reference"],
                ["file_url", "TEXT", "NOT NULL", "Supabase Storage path of uploaded file"],
                ["file_hash", "VARCHAR(64)", "NOT NULL", "SHA-256 hex digest of file content"],
                ["mime_type", "VARCHAR(120)", "NOT NULL", "Verified MIME type of file"],
                ["original_name", "VARCHAR(255)", "NOT NULL", "Original file name from upload"],
                ["upload_time", "TIMESTAMP", "NOT NULL, DEFAULT NOW()", "Upload timestamp"],
            ],
            [2000, 1800, 2400, 3160]
        ),
        ...blank(1),
        h3("8.2.4 CASE_NOTES Table"),
        simpleTable(
            ["Column", "Data Type", "Constraints", "Description"],
            [
                ["note_id", "BIGSERIAL", "PRIMARY KEY", "Auto-incrementing note identifier"],
                ["report_id", "BIGINT", "FK → REPORTS(report_id), ON DELETE CASCADE", "Associated case report"],
                ["investigator_id", "BIGINT", "FK → USERS(id), ON DELETE CASCADE", "Note author (investigator/admin)"],
                ["note_text", "TEXT", "NOT NULL", "Investigation note content"],
                ["created_at", "TIMESTAMP", "NOT NULL, DEFAULT NOW()", "Note creation timestamp"],
            ],
            [2000, 1800, 2400, 3160]
        ),
        ...blank(1),
        h3("8.2.5 CASE_TIMELINE Table"),
        simpleTable(
            ["Column", "Data Type", "Constraints", "Description"],
            [
                ["timeline_id", "BIGSERIAL", "PRIMARY KEY", "Auto-incrementing timeline entry ID"],
                ["report_id", "BIGINT", "NOT NULL (no FK to allow post-deletion records)", "Associated case reference"],
                ["action_type", "VARCHAR(60)", "NOT NULL", "Event type (CASE_CREATED, STATUS_UPDATED, etc.)"],
                ["actor_id", "BIGINT", "FK → USERS(id), ON DELETE SET NULL", "User who triggered the event"],
                ["actor_role", "VARCHAR(30)", "NULLABLE", "Role of the actor at time of event"],
                ["metadata", "JSONB", "NOT NULL, DEFAULT '{}'", "Event-specific structured context"],
                ["ip_address", "VARCHAR(120)", "NULLABLE", "Client IP address"],
                ["user_agent", "TEXT", "NULLABLE", "Client user agent string"],
                ["created_at", "TIMESTAMP", "NOT NULL, DEFAULT NOW()", "Event timestamp"],
            ],
            [2000, 1800, 2400, 3160]
        ),
        h2("8.3 Database Indices"),
        simpleTable(
            ["Index Name", "Table", "Column(s)", "Purpose"],
            [
                ["idx_reports_status", "reports", "status", "Filter reports by lifecycle status"],
                ["idx_reports_crime_type", "reports", "crime_type", "Filter reports by crime category"],
                ["idx_reports_location", "reports", "location", "Geographic distribution queries"],
                ["idx_reports_created_at", "reports", "created_at", "Time-ordered listing and trend analysis"],
                ["idx_reports_assigned_investigator", "reports", "assigned_investigator_id", "Fetch cases by investigator"],
                ["idx_evidence_report_id", "evidence", "report_id", "Evidence lookup per case"],
                ["idx_case_notes_report_id", "case_notes", "report_id", "Notes lookup per case"],
                ["idx_case_timeline_report_id", "case_timeline", "report_id", "Timeline lookup per case"],
                ["idx_case_timeline_created_at", "case_timeline", "created_at", "Chronological timeline ordering"],
            ],
            [2400, 1800, 2000, 3160]
        ),
        h2("8.4 Stored Functions"),
        simpleTable(
            ["Function Name", "Returns", "Description"],
            [
                ["get_crime_distribution()", "(label text, value bigint)", "Count of reports grouped by crime_type"],
                ["get_monthly_trend()", "(month text, reports bigint)", "Monthly report volume aggregated by DATE_TRUNC"],
                ["get_status_breakdown()", "(label text, value bigint)", "Report count grouped by lifecycle status"],
                ["get_financial_stats()", "(total_loss numeric)", "SUM of financial_loss_amount across all reports"],
                ["get_reports_per_state()", "(state text, reports bigint)", "Report count grouped by location field"],
            ],
            [2600, 2400, 4360]
        ),
        body("All five functions are defined with SECURITY DEFINER to execute with fixed privileges, preventing privilege escalation via the analytics API endpoint."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 9 — IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════
function chapter9() {
    return [
        h1("CHAPTER 9: IMPLEMENTATION"),
        h2("9.1 Project Directory Structure"),
        body("The repository is organised into two top-level directories — backend/ and frontend/ — each independently deployable. This separation enforces a strict boundary between presentation logic and business logic, enabling independent scaling and deployment of each tier."),
        simpleTable(
            ["Path", "Type", "Description"],
            [
                ["backend/src/app.js", "Server", "Express app factory: middleware pipeline assembly"],
                ["backend/src/server.js", "Server", "HTTP server entry point: port binding and seeding"],
                ["backend/src/config/", "Config", "env.js, db.js, reportMetadata.js — centralised configuration"],
                ["backend/src/routes/", "Routes", "One router file per domain: auth, reports, cases, evidence, admin, analytics"],
                ["backend/src/controllers/", "Controllers", "Business logic: one file per domain area"],
                ["backend/src/middleware/", "Middleware", "auth.js, role.js, validate.js, errorHandler.js, requestCorrelation.js"],
                ["backend/src/models/", "Models", "userModel.js: direct Supabase CRUD for users"],
                ["backend/src/services/", "Services", "caseTimelineService.js: audit log writes and reads"],
                ["backend/src/validations/", "Validations", "Zod schemas for all domain objects"],
                ["backend/src/utils/", "Utilities", "jwt.js, hash.js, mailer.js, logger.js, store.js, errors.js"],
                ["backend/src/bootstrap/", "Bootstrap", "seedPredefinedUsers.js: idempotent admin/investigator seeding"],
                ["backend/src/db/schema.sql", "Database", "Full PostgreSQL DDL: tables, indices, stored functions"],
                ["frontend/src/app/", "Pages", "Next.js App Router pages organised by route"],
                ["frontend/src/components/", "Components", "Reusable React components: forms, dashboards, charts, modals"],
                ["frontend/src/context/", "State", "AuthContext.js: global authentication state provider"],
                ["frontend/src/lib/", "Libraries", "api.js (Axios instance + CSRF interceptors), auth.js (localStorage helpers)"],
                ["frontend/src/app/globals.css", "Styles", "Global CSS: design tokens, glass morphism, language switcher styles"],
                ["frontend/tailwind.config.js", "Config", "Custom colour palette: ink, ocean, surf, coral, sand"],
            ],
            [3200, 1400, 4760]
        ),
        h2("9.2 Backend Security Middleware Pipeline"),
        body("Every HTTP request to the API passes through the following ordered middleware chain before reaching any route handler or controller. The order is critical and non-negotiable:"),
        numItem("requestCorrelation — Generates or validates a UUID v4 correlation ID, attaching it to req.correlationId and the X-Correlation-ID response header."),
        numItem("helmet() — Applies 11 security-hardening HTTP response headers including Content-Security-Policy, Strict-Transport-Security (HSTS with 1-year max-age and preload), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, and Referrer-Policy: strict-origin-when-cross-origin."),
        numItem("cors() — Validates the request Origin against the FRONTEND_URLS environment variable whitelist. Requests from unlisted origins receive a CORS error rather than a 200 response."),
        numItem("cookieParser() — Parses the ccrp_token HttpOnly cookie for downstream JWT verification."),
        numItem("csrf (csurf) — Validates the X-CSRF-Token header against the server-generated token for all state-changing HTTP methods (POST, PUT, PATCH, DELETE)."),
        numItem("express.json({ limit: '5mb' }) — Parses JSON request bodies with an explicit size limit to prevent denial-of-service via oversized payloads."),
        numItem("hpp() — Prevents HTTP Parameter Pollution attacks by normalising duplicate query parameters."),
        numItem("rateLimit() — Enforces 300 requests per 15-minute window per IP address across all endpoints."),
        numItem("Route handlers — Request is dispatched to the appropriate router → controller function."),
        numItem("errorHandler — Catches all errors, sanitises messages, logs internally, and returns a structured JSON error response."),

        h2("9.3 Authentication Flow Implementation"),
        body("The three-step OTP registration flow is a notable implementation. It was deliberately separated into three discrete API calls to prevent session state issues and race conditions:"),
        numItem("POST /api/auth/send-otp: Validates the email domain against a blocklist, checks for existing registrations (returning a dummy success to prevent email enumeration), generates a 6-digit cryptographically random OTP, stores it in the MemoryStore with a 300-second TTL, and dispatches it via SMTP. A rate-limiting counter tracked in rateLimitStore prevents OTP flooding."),
        numItem("POST /api/auth/verify-otp: Retrieves the OTP from MemoryStore, compares the submitted code against the stored value, and marks the store entry as verified. Returns a 200 response on success."),
        numItem("POST /api/auth/register-final: Checks that the email's store entry is marked as verified, hashes the password with bcrypt, creates the user record, deletes the store entry, and returns the created user object."),
        body("On successful login, a JWT is signed with the user's id, email, and role, and stored in a Set-Cookie header as an HttpOnly, Secure (in production), SameSite=Lax cookie with a 7-day maxAge. The frontend lib/api.js Axios instance fetches a CSRF token on the first state-changing request and caches it, injecting it as an X-CSRF-Token header on all subsequent writes."),

        h2("9.4 Role-Based Access Control Implementation"),
        body("RBAC is enforced at two layers. At the middleware layer, requireRole(...roles) in middleware/role.js checks req.user.role against the allowed roles list for each route. If the user's role is not in the allowed set, a 403 Forbidden response is returned immediately. At the controller layer, additional ownership checks are applied: citizens may only read their own reports; investigators may only update cases assigned to them; evidence download permissions are evaluated per-role with explicit logic in evidenceController.js."),

        h2("9.5 Evidence Integrity Implementation"),
        body("The SHA-256 hash is computed synchronously using Node.js's built-in crypto module before the file is uploaded to Supabase Storage. The sha256Buffer() utility takes the raw Buffer from Multer's memory storage and returns a 64-character hex string. This hash is stored in the evidence.file_hash column. For chain-of-custody purposes, the hash can be independently verified at any time by re-downloading the file from Supabase Storage and computing its SHA-256 digest, then comparing against the stored value. The magic-byte validation layer independently checks the first 8–12 bytes of the file buffer against known binary signatures for each permitted MIME type, preventing polyglot file uploads that carry a valid MIME type declaration but contain malicious binary content."),

        h2("9.6 Frontend Architecture and State Management"),
        body("The frontend uses React Context (AuthContext.js) for global authentication state, avoiding prop drilling across the component tree. The context provides user, isAuthenticated, loading, login, and logout to all child components. The login function persists the user object to localStorage via auth.js and updates the context state. Logout calls the backend /auth/logout endpoint (which clears the server-side cookie), removes the localStorage entry, and redirects to the login page. ProtectedRoute.jsx wraps all authenticated pages and redirects unauthenticated users to /login with a return URL, or redirects unauthorised users to /unauthorized based on their role."),
        body("The API Axios instance in lib/api.js attaches the CSRF token via a request interceptor. A response interceptor handles 403 CSRF errors by resetting the cached token promise, enabling the next request to re-fetch a fresh token. The interceptor also extracts and exposes the X-Correlation-ID from error responses, making it available to error boundary components for display to the user as a support reference."),

        h2("9.7 Key Code Snippets"),
        h3("9.7.1 CSRF Token Fetch and Injection (lib/api.js)"),
        body("The Axios request interceptor lazily fetches and caches the CSRF token from GET /api/csrf-token, then injects it as the X-CSRF-Token header on all POST, PUT, PATCH, and DELETE requests. If the fetch fails, it fails silently to avoid breaking non-state-changing requests. If a 403 with a CSRF-related message is received in the response interceptor, the cached token promise is reset to trigger re-fetch on the next write."),
        h3("9.7.2 Zod Validation Middleware (middleware/validate.js)"),
        body("The validate() higher-order function accepts a Zod schema and an optional target property (defaulting to 'body'). It calls schema.safeParse() on the target, returning a structured 400 response with field-level path and message arrays if validation fails. On success, it replaces req[property] with the parsed and coerced output, ensuring downstream handlers receive type-safe data. The correlationId from req.correlationId is included in the error response for traceability."),
        h3("9.7.3 SHA-256 File Integrity (utils/hash.js)"),
        body("The sha256Buffer() function accepts a Node.js Buffer, creates a SHA-256 hash object using crypto.createHash('sha256'), updates it with the buffer content, and returns the hexadecimal digest string. This single-line utility is invoked immediately after Multer processes the incoming file, before any storage operation, ensuring the hash reflects the file as received by the server."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 10 — OUTPUT SCREENS
// ═══════════════════════════════════════════════════════════════════════════
function chapter10() {
    const screenTable = (fig, name, desc, purpose) => [
        new Paragraph({
            spacing: { before: 200, after: 60 },
            children: [new TextRun({ text: `Figure ${fig}: ${name}`, bold: true, size: 24, font: "Times New Roman", color: NAVY })]
        }),
        new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: [new TableRow({
                children: [new TableCell({
                    width: { size: 9360, type: WidthType.DXA },
                    borders: allBorders("CCCCCC"),
                    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                    margins: { top: 240, bottom: 240, left: 360, right: 360 },
                    children: [
                        new Paragraph({
                            spacing: { before: 0, after: 60, line: 280, lineRule: "auto" },
                            children: [new TextRun({ text: "[ SCREENSHOT PLACEHOLDER ]", size: 22, font: "Times New Roman", color: "999999", italics: true, bold: true })]
                        }),
                        new Paragraph({
                            spacing: { before: 0, after: 0, line: 280, lineRule: "auto" },
                            children: [new TextRun({ text: `Screen: ${name}`, size: 20, font: "Times New Roman", color: "666666" })]
                        }),
                    ]
                })]
            })],
        }),
        new Paragraph({
            spacing: { before: 60, after: 40, line: 300, lineRule: "auto" },
            children: [new TextRun({ text: `Description: `, bold: true, size: 22, font: "Times New Roman", color: BLACK }),
            new TextRun({ text: desc, size: 22, font: "Times New Roman", color: BLACK })]
        }),
        new Paragraph({
            spacing: { before: 0, after: 120, line: 300, lineRule: "auto" },
            children: [new TextRun({ text: `Purpose: `, bold: true, size: 22, font: "Times New Roman", color: BLACK }),
            new TextRun({ text: purpose, size: 22, font: "Times New Roman", color: BLACK })]
        }),
    ];

    return [
        h1("CHAPTER 10: OUTPUT SCREENS"),
        body("The following section presents placeholders for all major screens of the Bharat Cyber Nyay Portal. Actual screenshots should be captured from the running application at https://bharatcybernyayportal.online and inserted in place of the placeholders prior to final submission."),
        ...blank(1),

        ...screenTable("1", "Home Page / Landing Screen",
            "The public-facing homepage featuring a hero grid with three primary call-to-action buttons (File a Report, Report Anonymously, Track Case Status), a five-step workflow explainer, the national cyber helpline number (1930), and a disclaimer noting the project's academic nature.",
            "Serves as the entry point for all users, providing immediate access to the most critical citizen actions without requiring login."),

        ...screenTable("2", "User Registration Screen",
            "A two-column name input form with email field, a 'Send OTP' button, an OTP verification modal with 5-minute countdown timer, password fields with real-time strength indicator, and a confirm password field with match validation.",
            "Enables citizens to create accounts with verified email addresses using the three-step OTP registration flow."),

        ...screenTable("3", "OTP Verification Modal",
            "A centred modal overlay with a large digit-spaced OTP input field, expiry countdown timer, 'Verify OTP' button, resend cooldown timer, and 'Change Email' link.",
            "Provides the OTP verification step of the registration flow, preventing account creation with unverified email addresses."),

        ...screenTable("4", "Login Screen",
            "Email and password input fields with a show/hide password toggle, 'Login' button, Google Sign-In button, 'Forgot your password?' link, and 'Continue anonymously' link.",
            "Allows all user roles (citizen, investigator, administrator) to authenticate and access their respective dashboards."),

        ...screenTable("5", "Forgot Password Flow",
            "A multi-step inline overlay: Step 1 — email entry with 'Send OTP'; Step 2 — OTP input with expiry timer and resend button; Step 3 — new password with strength checker and confirm field; Step 4 — success confirmation.",
            "Enables users to securely reset forgotten passwords through an OTP-verified multi-step process."),

        ...screenTable("6", "Crime Report Submission Form",
            "A multi-column form covering victim details, scam type dropdown, dynamic scam-specific fields (UPI ID/transaction ID for UPI scams, phishing link for phishing, etc.), incident date/time pickers, financial loss input with Indian comma formatting, state/city cascading dropdowns, mandatory screenshot upload, and description textarea.",
            "The primary citizen-facing complaint submission interface. Collects all required information for a valid cyber crime report with built-in validation."),

        ...screenTable("7", "Case Tracking Screen",
            "A search input accepting a Report ID, 'Check Status' button, and a result panel displaying case status, crime type, location, assigned investigator, attached evidence links, and case notes.",
            "Allows citizens (with or without login) to check the current status of their filed complaint using the Report ID."),

        ...screenTable("8", "Citizen Profile Dashboard",
            "Profile information panel (name, email, role, join date), case statistics cards (cases filed, status breakdown), recent cases table, and a 'Reset Password' button that opens the inline reset modal.",
            "Provides citizens with a personal history of their filed complaints and self-service account management functionality."),

        ...screenTable("9", "Investigator Dashboard",
            "Statistics cards (total assigned, active, resolved, closed), a status filter dropdown, a refresh button, and a scrollable list of expandable case cards each showing victim details, incident information, evidence download links, suspect details, status update selector, note input field, and notes history panel.",
            "The primary workspace for investigators, providing full case context and all tools needed to progress an investigation."),

        ...screenTable("10", "Admin Home Dashboard",
            "Three action cards (Case Assignment, Investigators, Registered Users) with descriptions and links, followed by the Comprehensive Case Overview section showing all cases as expandable detail cards with evidence previews and inline admin controls.",
            "Central navigation hub for administrators, providing quick access to all administrative functions."),

        ...screenTable("11", "Admin Case Assignment Panel",
            "Summary statistics row (visible reports, unassigned cases, busy investigators, available investigators), report queue table with filters, inline status dropdowns, investigator assignment selectors, note input fields, timeline viewer button, and delete button per row.",
            "The primary case management workspace for administrators, enabling efficient review, assignment, status management, and note-taking across all active reports."),

        ...screenTable("12", "Case Timeline Modal",
            "A scrollable chronological list of case events (CASE_CREATED, INVESTIGATOR_ASSIGNED, STATUS_UPDATED, CASE_NOTE_ADDED, EVIDENCE_UPLOADED, CASE_DELETED) with actor name, role, IP address, and timestamp for each entry. Export CSV and Export PDF buttons at the top.",
            "Provides a complete chain-of-custody audit trail for administrators and investigators, supporting accountability and legal documentation requirements."),

        ...screenTable("13", "Analytics Dashboard",
            "Six visualisation panels: crime type distribution (horizontal bar chart), monthly filing trend (area chart), case status breakdown (donut pie chart), total financial loss (KPI card in INR), geographical hotspots (vertical bar chart), and crime category count KPI.",
            "Enables administrators to identify emerging patterns, geographic concentrations, and pipeline health metrics for data-driven decision making."),

        ...screenTable("14", "Investigator Management Screen",
            "Left panel: list of investigator cards each showing name, email, availability status badge, workload statistics (total/active/resolved), and Edit/Remove buttons with an inline edit form. Right panel: 'Add Investigator' form with name, email, and temporary password fields.",
            "Allows administrators to provision, manage, and monitor all investigator accounts and their workloads from a single interface."),

        ...screenTable("15", "Cyber Awareness Resources Page",
            "An emergency actions section with four numbered steps, six accordion-style category panels (Financial Fraud, Phishing, Social Media Safety, Password Security, Device Security, Reporting & Response) with expandable tip lists, and a common scam examples grid with five illustrated scenarios.",
            "Educates citizens on cyber safety best practices, reducing crime incidence and improving the quality of reports submitted."),

        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 11 — TESTING
// ═══════════════════════════════════════════════════════════════════════════
function chapter11() {
    const testTable = (rows) => simpleTable(
        ["TC ID", "Test Scenario", "Input / Action", "Expected Result", "Actual Result", "Status"],
        rows,
        [900, 2000, 1800, 1800, 1400, 900]
    );

    return [
        h1("CHAPTER 11: TESTING"),
        body("The testing strategy for the Bharat Cyber Nyay Portal encompassed functional testing, security testing, boundary testing, and integration testing, conducted iteratively throughout the development process. All API endpoints were tested using Postman, and frontend interactions were tested manually across Chrome, Firefox, and mobile browser viewports."),

        h2("11.1 Authentication Module Tests"),
        testTable([
            ["TC-AUTH-01", "Register with valid data", "Valid name, Gmail, strong password", "201 Created, user object returned", "201 Created, user object returned", "Pass"],
            ["TC-AUTH-02", "Register with duplicate email", "Already-registered email", "200 OK (dummy response, no enumeration)", "200 OK, no account existence disclosed", "Pass"],
            ["TC-AUTH-03", "Register with disposable email", "mailinator.com domain", "400, Spam mail detected error", "400 with validation error", "Pass"],
            ["TC-AUTH-04", "Send OTP — rate limit", "5th OTP request within window", "400, Unable to process request", "400 returned on 4th+ attempt", "Pass"],
            ["TC-AUTH-05", "Verify OTP — correct code", "Valid 6-digit OTP", "200, Email verified successfully", "200, verified flag set", "Pass"],
            ["TC-AUTH-06", "Verify OTP — expired", "OTP after 5-minute TTL", "400, Unable to process request", "400, store entry expired", "Pass"],
            ["TC-AUTH-07", "Login — correct credentials", "Valid email + password", "200, JWT set in HttpOnly cookie", "200, ccrp_token cookie set", "Pass"],
            ["TC-AUTH-08", "Login — wrong password", "Valid email, wrong password", "401, Invalid credentials", "401 returned", "Pass"],
            ["TC-AUTH-09", "Login — account lockout", "5 consecutive failures", "401 after 5th attempt (15 min lock)", "Account locked after 5 attempts", "Pass"],
            ["TC-AUTH-10", "Access protected route — no token", "No Authorization header or cookie", "401, Unauthorized", "401 returned", "Pass"],
            ["TC-AUTH-11", "Google OAuth — valid credential", "Valid Google ID token", "200, JWT set, user created if new", "200, user created/found", "Pass"],
            ["TC-AUTH-12", "Forgot password — full flow", "Email → OTP → new password", "200 at each step, password updated", "All steps successful", "Pass"],
        ]),

        h2("11.2 Report Submission Tests"),
        testTable([
            ["TC-RPT-01", "Submit valid report (authenticated)", "All required fields, valid JWT", "201, report object with report_id", "201, report_id returned", "Pass"],
            ["TC-RPT-02", "Submit with invalid crime type", "crimeType = 'RandomScam'", "400, Zod validation error", "400 with path and message", "Pass"],
            ["TC-RPT-03", "Submit anonymous — eligible type", "Phishing, no auth token", "201, report linked to anon user", "201, anonymous report created", "Pass"],
            ["TC-RPT-04", "Submit anonymous — ineligible type", "'UPI scams', no auth token", "403, Please log in", "403 returned", "Pass"],
            ["TC-RPT-05", "Submit with future incident date", "incidentDateTime in future", "400, Zod datetime error", "400 returned", "Pass"],
            ["TC-RPT-06", "Submit with missing description", "description = ''", "400, min length validation", "400 returned", "Pass"],
            ["TC-RPT-07", "Get report — correct owner", "citizen fetches own report_id", "200, report object", "200 returned", "Pass"],
            ["TC-RPT-08", "Get report — wrong owner", "citizen fetches another user's ID", "403, Forbidden", "403 returned", "Pass"],
        ]),

        h2("11.3 Evidence Upload Tests"),
        testTable([
            ["TC-EVD-01", "Upload valid JPEG", "image/jpeg, 2 MB", "201, evidence record with SHA-256 hash", "201, hash computed and stored", "Pass"],
            ["TC-EVD-02", "Upload valid PDF", "application/pdf, 5 MB", "201, evidence record created", "201 returned", "Pass"],
            ["TC-EVD-03", "Upload unsupported type", ".exe file", "400, Unsupported file type", "400 returned by Multer filter", "Pass"],
            ["TC-EVD-04", "Upload oversized file", "image/jpeg, 12 MB", "400, file size limit exceeded", "413 returned", "Pass"],
            ["TC-EVD-05", "MIME mismatch (polyglot)", "File claiming image/jpeg but PNG magic bytes", "400, Invalid file content", "400, magic-byte check failed", "Pass"],
            ["TC-EVD-06", "Upload for another user's report", "Citizen B → Report of Citizen A", "403, Forbidden", "403 returned", "Pass"],
            ["TC-EVD-07", "Evidence proxy download — authorised", "Investigator downloads assigned case evidence", "200, file streamed correctly", "200, file served", "Pass"],
            ["TC-EVD-08", "Evidence proxy download — unauthorised", "Citizen downloads another user's evidence", "403, Forbidden", "403 returned", "Pass"],
        ]),

        h2("11.4 Case Management Tests"),
        testTable([
            ["TC-CASE-01", "Investigator updates assigned case status", "PATCH /cases/:id/status", "200, status updated", "200, status changed", "Pass"],
            ["TC-CASE-02", "Investigator updates unassigned case", "PATCH /cases/:id/status on unassigned", "403, Forbidden", "403 returned", "Pass"],
            ["TC-CASE-03", "Admin assigns investigator", "PUT /admin/assign-investigator", "200, status changed to Under Review", "200, assignment recorded", "Pass"],
            ["TC-CASE-04", "Admin adds case note", "POST /cases/:id/notes", "201, note record created", "201 returned", "Pass"],
            ["TC-CASE-05", "Admin deletes case", "DELETE /cases/:id", "200, case and related records deleted", "200, cascade delete confirmed", "Pass"],
            ["TC-CASE-06", "View case timeline", "GET /cases/:id/timeline", "200, ordered timeline entries", "200, all events present", "Pass"],
            ["TC-CASE-07", "Citizen accesses admin route", "GET /admin/investigators with citizen token", "403, Forbidden", "403 returned", "Pass"],
            ["TC-CASE-08", "Investigator accesses admin delete", "DELETE /cases/:id with investigator token", "403, Forbidden", "403 returned", "Pass"],
        ]),

        h2("11.5 Security Tests"),
        testTable([
            ["TC-SEC-01", "SQL injection via report description", "'; DROP TABLE reports; --", "Stored as literal text, no execution", "Stored safely by Supabase parameterised queries", "Pass"],
            ["TC-SEC-02", "XSS via report field", "<script>alert(1)</script>", "Rendered as escaped text in React JSX", "React HTML-escapes by default, no execution", "Pass"],
            ["TC-SEC-03", "CSRF attack without token", "POST /api/reports without X-CSRF-Token header", "403, EBADCSRFTOKEN", "403 returned by csurf", "Pass"],
            ["TC-SEC-04", "JWT tamper (modified payload)", "Altered role field in JWT", "401, Invalid or expired token", "401 returned", "Pass"],
            ["TC-SEC-05", "Rate limit exhaustion", "301+ requests in 15 min from same IP", "429, Too Many Requests", "429 returned by express-rate-limit", "Pass"],
            ["TC-SEC-06", "CORS from unlisted origin", "Request from http://evil.com", "CORS error, request blocked", "CORS blocked by isAllowedOrigin check", "Pass"],
            ["TC-SEC-07", "HTTP security headers present", "Inspect response headers", "Helmet headers present in all responses", "All headers verified via curl", "Pass"],
            ["TC-SEC-08", "Direct Supabase Storage URL access", "Attempt direct access to file URL", "File served only via backend proxy", "Direct URL requires authenticated Supabase session", "Pass"],
        ]),

        h2("11.6 User Acceptance Testing Summary"),
        simpleTable(
            ["UAT Scenario", "User Type", "Outcome", "Observations"],
            [
                ["File a phishing report and upload screenshot", "Citizen (test)", "Completed successfully", "Form UX well-received; OTP flow clear"],
                ["Track own case using Report ID", "Citizen (test)", "Case status retrieved correctly", "Status page needs richer status descriptions"],
                ["Assign case and add investigation note", "Investigator (test)", "Completed successfully", "Inline note input responsive on mobile"],
                ["Export case timeline as CSV", "Administrator (test)", "CSV downloaded with all events", "PDF export via popup occasionally blocked by browser"],
                ["View analytics on mobile viewport", "Administrator (test)", "Charts displayed and functional", "Horizontal scrolling needed for wide bar charts"],
                ["Switch interface language to Hindi", "Citizen (test)", "Google Translate applied to all UI text", "Some custom CSS classes require delay to translate"],
            ],
            [2600, 1600, 1800, 3360]
        ),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 12 — CONCLUSION
// ═══════════════════════════════════════════════════════════════════════════
function chapter12() {
    return [
        h1("CHAPTER 12: CONCLUSION"),
        body("The Bharat Cyber Nyay Portal has been successfully designed, implemented, tested, and deployed as a comprehensive full-stack web application addressing the identified deficiencies in India's cyber crime reporting and case management infrastructure. The project demonstrates that a production-grade, security-conscious civic technology platform can be built within the constraints of an academic final-year project, using open-source technologies and cost-effective cloud infrastructure."),
        ...blank(1),
        body("All eight primary objectives established at the outset of the project have been met. Citizens can file structured, evidence-backed complaints through a mobile-responsive interface with immediate validation feedback. Evidence integrity is assured through SHA-256 hashing and magic-byte file validation. A three-tier RBAC model secures every API endpoint and frontend route. Case tracking via Report ID provides citizens with transparent, self-service visibility into their complaint's lifecycle. Anonymous reporting reduces barriers for victims of sensitive crimes. Investigators have a purpose-built dashboard with full case context, evidence access, note-recording, and status management. Administrators have comprehensive tooling for case oversight, investigator management, and data-driven analytics. The system is deployed on free-tier cloud infrastructure with automated CI/CD, demonstrating a viable production architecture."),
        ...blank(1),
        body("From a technical standpoint, the project successfully implements several advanced patterns: OTP-based multi-step email verification with memory-store TTL management; CSRF double-submit cookie protection; proxied file download to prevent direct storage bucket access; event-sourced case timeline with JSONB metadata; server-side aggregation via SECURITY DEFINER PostgreSQL stored functions; and a comprehensive structured logging system with sensitive data redaction."),
        ...blank(1),
        body("The project also highlights the practical challenges inherent in building civic technology: balancing security rigour with usability for non-technical citizens; managing state complexity across multi-step user flows; ensuring graceful degradation on mobile devices and slow connections; and designing role-based workflows that align with real-world investigative processes."),
        ...blank(1),
        body("While the Bharat Cyber Nyay Portal is presented as an academic prototype and does not integrate with official government systems, it serves as a compelling proof-of-concept for how modern web technologies can be applied to strengthen India's digital governance infrastructure."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 13 — FUTURE SCOPE
// ═══════════════════════════════════════════════════════════════════════════
function chapter13() {
    return [
        h1("CHAPTER 13: FUTURE SCOPE"),
        body("The Bharat Cyber Nyay Portal provides a functional and extensible foundation. The following enhancements are proposed for future development iterations:"),
        h2("13.1 AI-Powered Crime Classification and Fraud Detection"),
        body("A natural language processing model fine-tuned on cyber crime descriptions could automatically suggest the most appropriate crime type from the free-text incident description, reducing categorisation errors by non-expert citizens. A duplicate detection model could flag structurally similar reports filed against the same suspect, enabling investigators to identify coordinated crime campaigns. An anomaly detection system could flag unusually large financial loss amounts or high-frequency reports from the same IP address for enhanced scrutiny."),
        h2("13.2 Real-Time Notification System"),
        body("Integration of WebSocket (Socket.io) or Server-Sent Events would enable real-time case status update notifications pushed directly to the citizen's browser or mobile application. Investigators could receive push notifications for new case assignments. Administrators could see a live feed of incoming reports on the dashboard. This would eliminate the need for manual polling and significantly improve the responsiveness of the system."),
        h2("13.3 SMS and Push Notification Integration"),
        body("Integration with SMS gateway services such as Msg91 or Twilio would enable status update notifications via SMS to citizens who do not have consistent email access. For mobile application users, Firebase Cloud Messaging (FCM) push notifications could deliver case updates directly to the device lock screen, ensuring time-sensitive information — such as a case being resolved or financial recovery being initiated — reaches the victim promptly."),
        h2("13.4 Mobile Application"),
        body("A React Native cross-platform mobile application would significantly enhance accessibility for citizens who primarily access internet services through smartphones. Key mobile-specific features would include camera-based evidence capture, document scanning, gallery selection for bulk evidence upload, biometric authentication (fingerprint/face ID), offline draft reports with automatic sync on connectivity restoration, and push notification support."),
        h2("13.5 Aadhaar and DigiLocker Identity Verification"),
        body("Integration with the Aadhaar OTP verification API and the DigiLocker digital documents platform would enable strong identity verification for complainants filing high-severity complaints involving significant financial losses. This would reduce fraudulent or duplicate reports and, importantly, enable the generation of legally valid digital signatures on submitted complaints, supporting their admissibility in court proceedings."),
        h2("13.6 NCRP and CCTNS Integration"),
        body("In a production deployment scenario, integration with the National Cyber Crime Reporting Portal (NCRP) APIs and the Crime and Criminal Tracking Network and Systems (CCTNS) would allow verified reports to be automatically pre-populated into the FIR filing workflow at the relevant jurisdictional police station, returning an official complaint acknowledgement number from the government system. This would transform the portal from a prototype into a legally recognised complaint channel."),
        h2("13.7 Multi-Language Support"),
        body("The current Google Translate integration provides a functional but limited bilingual experience. Full internationalisation (i18n) using the next-intl library would enable native support for all 22 Indian scheduled languages, with human-translated UI strings rather than machine-translated page content. This is particularly important for reaching non-English-speaking citizens in rural areas who represent a disproportionately high proportion of cyber crime victims."),
        h2("13.8 Advanced Evidence Management"),
        body("Future evidence management enhancements could include: automatic metadata extraction from uploaded files (EXIF data from images, PDF metadata); video evidence support with server-side transcoding; integration with blockchain timestamping services for immutable proof of evidence submission time; and a digital forensics workspace enabling investigators to annotate evidence files directly within the application."),
        pb()
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  CHAPTER 14 — BIBLIOGRAPHY
// ═══════════════════════════════════════════════════════════════════════════
function chapter14() {
    const ref = (num, text) => new Paragraph({
        spacing: { before: 80, after: 80, line: 300, lineRule: "auto" },
        children: [
            new TextRun({ text: `[${num}]  `, bold: true, size: 22, font: "Times New Roman", color: BLACK }),
            new TextRun({ text, size: 22, font: "Times New Roman", color: BLACK })
        ]
    });
    return [
        h1("CHAPTER 14: BIBLIOGRAPHY"),
        h2("Government and Statistical Sources"),
        ref(1, "Ministry of Home Affairs, Government of India. (2023). Annual Report on Cyber Crime Statistics: National Cyber Crime Reporting Portal (NCRP). New Delhi: MHA."),
        ref(2, "Indian Cyber Crime Coordination Centre (I4C). (2023). Cyber Crime Annual Report 2023. New Delhi: Ministry of Home Affairs."),
        ref(3, "National Crime Records Bureau (NCRB). (2023). Crime in India 2022 Report. New Delhi: Ministry of Home Affairs."),
        ref(4, "CERT-In. (2024). Annual Report 2023. New Delhi: Ministry of Electronics and Information Technology. Retrieved from https://www.cert-in.org.in"),
        ...blank(1),
        h2("Technology Documentation"),
        ref(5, "Vercel, Inc. (2024). Next.js 14 Documentation — App Router. Retrieved from https://nextjs.org/docs"),
        ref(6, "OpenJS Foundation. (2024). Node.js v18 API Documentation. Retrieved from https://nodejs.org/docs/latest-v18.x/api/"),
        ref(7, "OpenJS Foundation. (2024). Express.js 4.x API Reference. Retrieved from https://expressjs.com/en/4x/api.html"),
        ref(8, "Supabase, Inc. (2024). Supabase JavaScript Client Library Documentation. Retrieved from https://supabase.com/docs/reference/javascript"),
        ref(9, "The PostgreSQL Global Development Group. (2024). PostgreSQL 15 Documentation. Retrieved from https://www.postgresql.org/docs/15/"),
        ref(10, "McDonnell, C. (2024). Zod — TypeScript-first Schema Validation. Retrieved from https://zod.dev"),
        ref(11, "Helmetjs Contributors. (2024). Helmet.js Security Headers Middleware Documentation. Retrieved from https://helmetjs.github.io"),
        ref(12, "Auth0, Inc. (2024). jsonwebtoken — npm Package Documentation. Retrieved from https://github.com/auth0/node-jsonwebtoken"),
        ref(13, "dcodeIO. (2024). bcryptjs — Optimised bcrypt in JavaScript. Retrieved from https://github.com/dcodeIO/bcrypt.js"),
        ref(14, "Recharts Team. (2024). Recharts Documentation — Composable Charting Library. Retrieved from https://recharts.org/en-US"),
        ref(15, "Wathan, A. et al. (2024). Tailwind CSS v3 — Utility-First CSS Framework. Retrieved from https://tailwindcss.com/docs"),
        ref(16, "Google Developers. (2024). Google Identity Services Documentation. Retrieved from https://developers.google.com/identity"),
        ...blank(1),
        h2("Security References"),
        ref(17, "OWASP Foundation. (2023). OWASP Top 10: Web Application Security Risks 2021. Retrieved from https://owasp.org/www-project-top-ten/"),
        ref(18, "IETF. (2015). RFC 7519 — JSON Web Token (JWT). Internet Engineering Task Force."),
        ref(19, "NIST. (2017). Digital Identity Guidelines: Special Publication 800-63B. Gaithersburg: National Institute of Standards and Technology."),
        ref(20, "Provos, N., & Mazières, D. (1999). A Future-Adaptable Password Scheme. Proceedings of the USENIX Annual Technical Conference."),
        ref(21, "van Kesteren, A. (2023). Fetch — Cross-Origin Resource Sharing. WHATWG. Retrieved from https://fetch.spec.whatwg.org/"),
        ...blank(1),
        h2("Legal and Regulatory References"),
        ref(22, "Government of India. (2000). The Information Technology Act, 2000 (Act No. 21 of 2000), as amended in 2008. New Delhi: Ministry of Law and Justice."),
        ref(23, "Government of India. (2011). The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011. New Delhi: MeitY."),
        ref(24, "Government of India. (2023). The Digital Personal Data Protection Act, 2023. New Delhi: Ministry of Law and Justice."),
        ref(25, "CERT-In, MeitY. (2022). Directions Relating to Information Security Practices under Section 70B of the Information Technology Act, 2000. New Delhi."),
        ...blank(1),
        h2("Academic References"),
        ref(26, "Sharma, A., & Gupta, R. (2022). Cyber Crime in India: Trends, Challenges and Countermeasures. International Journal of Computer Applications, 184(14), 1–8."),
        ref(27, "Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures (Doctoral dissertation). University of California, Irvine."),
        ref(28, "Tanenbaum, A. S., & Van Steen, M. (2017). Distributed Systems: Principles and Paradigms (3rd ed.). CreateSpace Independent Publishing Platform."),
        ...blank(2),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
            children: [new TextRun({ text: "— End of Report —", bold: true, size: 22, font: "Times New Roman", color: NAVY, italics: true })]
        })
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  DOCUMENT ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════════
const doc = new Document({
    numbering: {
        config: [
            { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ]
    },
    styles: {
        default: { document: { run: { font: "Times New Roman", size: 24, color: BLACK } } },
        paragraphStyles: [
            {
                id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 36, bold: true, font: "Times New Roman", color: NAVY },
                paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 }
            },
            {
                id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 28, bold: true, font: "Times New Roman", color: BLUE },
                paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
            },
            {
                id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 24, bold: true, font: "Times New Roman", color: NAVY },
                paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
            },
        ]
    },
    sections: [
        // ── Title + front matter (no page numbers) ──────────────────────────
        {
            properties: {
                page: {
                    size: { width: 12240, height: 15840 },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            children: [
                ...titlePageChildren(),
                ...certificateChildren(),
                ...declarationChildren(),
                ...acknowledgementChildren(),
                ...abstractChildren(),
                ...tocChildren(),
            ]
        },
        // ── Main content (numbered pages) ───────────────────────────────────
        {
            properties: {
                page: {
                    size: { width: 12240, height: 15840 },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ children: [PageNumber.CURRENT], size: 24, font: "Times New Roman", color: "000000" })
                        ]
                    })]
                })
            },
            children: [
                ...chapter1(),
                ...chapter2(),
                ...chapter3(),
                ...chapter4(),
                ...chapter5(),
                ...chapter6(),
                ...chapter7(),
                ...chapter8(),
                ...chapter9(),
                ...chapter10(),
                ...chapter11(),
                ...chapter12(),
                ...chapter13(),
                ...chapter14(),
            ]
        }
    ]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('report/FINAL_PROJECT_REPORT_V3.docx', buffer);
    console.log('DONE');
}).catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});