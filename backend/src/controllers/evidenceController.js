const multer = require("multer");
const { supabaseAdmin } = require("../config/db");
const env = require("../config/env");
const { sha256Buffer } = require("../utils/hash");
const { getAnonymousReporterId } = require("../utils/anonymousReporter");
const { logCaseEvent } = require("../services/caseTimelineService");

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain"
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    return cb(null, true);
  }
});

async function resolveEvidenceUrl(fileUrl) {
  if (!fileUrl) return null;

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://") || fileUrl.startsWith("local://")) {
    return fileUrl;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(env.supabaseStorageBucket)
    .createSignedUrl(fileUrl, 10 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

async function uploadEvidence(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);

    if (!req.file) {
      return res.status(400).json({ message: "Evidence file is required" });
    }

    const { data: report } = await supabaseAdmin
      .from("reports")
      .select("report_id, user_id, assigned_investigator_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Access rules:
    // - Investigator can upload evidence for any report.
    // - Citizen can upload only for own report.
    // - Anonymous upload allowed only for anonymous-reporter owned reports.
    if (req.user?.role === "investigator") {
      if (String(report.assigned_investigator_id) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden: Not assigned to this report" });
      }
    } else if (req.user?.id) {
      if (String(req.user.id) !== String(report.user_id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      const anonymousUserId = await getAnonymousReporterId();
      if (String(report.user_id) !== String(anonymousUserId)) {
        return res.status(403).json({ message: "Please log in to upload evidence for this report." });
      }
    }

    const buffer = req.file.buffer;
    let isValidType = false;
    
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      if (req.file.mimetype === "image/jpeg") isValidType = true;
    } else if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
      if (req.file.mimetype === "image/png") isValidType = true;
    } else if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      if (req.file.mimetype === "image/webp") isValidType = true;
    } else if (buffer.length >= 5 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46 && buffer[4] === 0x2D) {
      if (req.file.mimetype === "application/pdf") isValidType = true;
    } else if (req.file.mimetype === "text/plain") {
      const maxCheck = Math.min(buffer.length, 512);
      let isText = true;
      for (let i = 0; i < maxCheck; i++) {
        if (buffer[i] === 0x00) {
          isText = false; break;
        }
      }
      if (isText) isValidType = true;
    }

    if (!isValidType) {
      return res.status(400).json({ message: "Invalid file content for the specified mime type." });
    }

    const fileHash = sha256Buffer(req.file.buffer);
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${reportId}/${Date.now()}-${sanitizedName}`;

    const { error: storageError } = await supabaseAdmin.storage
      .from(env.supabaseStorageBucket)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (storageError) return next(new Error(storageError.message));

    const { data: evidence, error } = await supabaseAdmin
      .from("evidence")
      .insert({
        report_id: reportId,
        file_url: storagePath,
        file_hash: fileHash,
        mime_type: req.file.mimetype,
        original_name: req.file.originalname
      })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    await logCaseEvent({
      reportId,
      actionType: "EVIDENCE_UPLOADED",
      actorId: req.user?.id || null,
      actorRole: req.user?.role || "anonymous",
      metadata: {
        evidence_id: evidence.evidence_id,
        original_name: evidence.original_name,
        mime_type: evidence.mime_type,
        file_hash: evidence.file_hash
      },
      req
    });

    const signedUrl = await resolveEvidenceUrl(evidence.file_url);
    return res.status(201).json({
      ...evidence,
      file_url: signedUrl
    });
  } catch (error) {
    return next(error);
  }
}

async function getEvidenceByReport(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);

    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .select("report_id, user_id, assigned_investigator_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (reportError) return next(new Error(reportError.message));
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.user?.role === "investigator") {
      if (String(req.user.id) !== String(report.assigned_investigator_id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else if (String(req.user?.id) !== String(report.user_id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data: evidenceList, error } = await supabaseAdmin
      .from("evidence")
      .select("evidence_id, report_id, file_url, file_hash, mime_type, original_name, upload_time")
      .eq("report_id", reportId)
      .order("upload_time", { ascending: false });

    if (error) return next(new Error(error.message));

    const enrichedEvidence = await Promise.all(
      (evidenceList || []).map(async (evidence) => ({
        ...evidence,
        file_url: await resolveEvidenceUrl(evidence.file_url)
      }))
    );

    return res.json(enrichedEvidence);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  upload,
  uploadEvidence,
  getEvidenceByReport
};
