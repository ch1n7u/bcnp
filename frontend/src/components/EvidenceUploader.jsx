"use client";

import { useState } from "react";
import api from "../lib/api";

export default function EvidenceUploader({ reportId }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const upload = async () => {
    if (!file || !reportId) return;

    const formData = new FormData();
    formData.append("evidence", file);

    try {
      const { data } = await api.post(`/evidence/${reportId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage(`Uploaded: ${data.original_name}`);
      setFile(null);
    } catch (error) {
      setMessage(error?.response?.data?.message || "Upload failed.");
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-dashed border-ocean/40 p-4">
      <h3 className="font-display text-xl font-semibold">Upload Evidence</h3>
      <p className="text-sm text-slate-600">Upload images, PDFs, screenshots, chat logs, or email headers.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={upload} className="rounded-lg bg-ocean px-4 py-2 text-white">
          Upload
        </button>
      </div>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
