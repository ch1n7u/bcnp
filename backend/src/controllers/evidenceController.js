const multer = require("multer");
const { supabaseAdmin } = require("../config/db");
const env = require("../config/env");
const { sha256Buffer } = require("../utils/hash");
const { getAnonymousReporterId } = require("../utils/anonymousReporter");

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
      .select("report_id, user_id")
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
      // allowed
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
      .select("report_id, user_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (reportError) return next(new Error(reportError.message));
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.user?.role !== "investigator" && String(req.user?.id) !== String(report.user_id)) {
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
