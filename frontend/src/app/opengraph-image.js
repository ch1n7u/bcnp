import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A6173 0%, #064451 100%)",
          color: "#FFFFFF",
          fontFamily: "Arial, sans-serif",
          gap: 24,
          padding: "48px"
        }}
      >
        <svg
          width={180}
          height={180}
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M48 6L14 20V42C14 61.5 27 79.8 48 90C69 79.8 82 61.5 82 42V20L48 6Z" fill="#0A6173" />
          <path d="M48 14L22 25.5V42.2C22 56.4 30.9 69.1 48 77.8C65.1 69.1 74 56.4 74 42.2V25.5L48 14Z" fill="#0C7A90" />
          <circle cx="48" cy="48" r="24" fill="#FFFFFF" />
          <path
            d="M40 44V39.8C40 35.5 43.4 32 47.7 32H48.3C52.6 32 56 35.5 56 39.8V44"
            stroke="#0A6173"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <rect x="36" y="43" width="24" height="20" rx="6" fill="#E95341" />
          <circle cx="48" cy="53" r="3" fill="#FFFFFF" />
          <path d="M48 56V59" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, textAlign: "center" }}>
          Bharat Cyber Nyay Portal
        </div>
        <div style={{ fontSize: 30, lineHeight: 1.4, textAlign: "center", maxWidth: 980 }}>
          Report cybercrime securely, track progress, and get timely assistance.
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
