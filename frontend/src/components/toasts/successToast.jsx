import { HiCheck, HiExclamation } from "react-icons/hi";
import { useEffect, useState } from "react";

function SuccessToast({ response }) {
  const [visible, setVisible] = useState(true);
  const isSuccess = response?.statusCode == "200";

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [response]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.875rem 1.25rem",
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
        minWidth: "280px",
        maxWidth: "92vw",
        animation: "toastIn 0.25s ease",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: isSuccess ? "#f0fdf4" : "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isSuccess ? (
          <HiCheck style={{ color: "#16a34a", fontSize: "18px" }} />
        ) : (
          <HiExclamation style={{ color: "#dc2626", fontSize: "18px" }} />
        )}
      </div>

      {/* Message */}
      <span
        style={{
          fontSize: "14px",
          fontWeight: "600",
          color: isSuccess ? "#15803d" : "#dc2626",
          direction: "rtl",
        }}
      >
        {response?.Message}
      </span>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: "3px",
          borderRadius: "0 0 14px 14px",
          background: isSuccess ? "#22c55e" : "#ef4444",
          animation: "toastProgress 3.5s linear forwards",
          width: "100%",
        }}
      />

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default SuccessToast;
