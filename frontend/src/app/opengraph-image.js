import { ImageResponse } from "next/og";

export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

export default function OpengraphImage() {
  const logoUrl = "https://bharatcybernyayportal.online/logo.svg?v=2";

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
        <img src={logoUrl} width="180" height="180" alt="Bharat Cyber Nyay Portal" />
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
