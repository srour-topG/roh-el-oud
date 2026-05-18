import axios from "axios";
import { useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";

export default function RefundModal({ sub, onClose, onSuccess }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRefund() {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${apiUrl}/subscribe/refund`, {
        id: sub.id,
      });
      onSuccess(res.data);
    } catch (e) {
      setError(e.response?.data?.Message || "حدث خطأ، حاول مرة أخرى");
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "1.75rem",
          width: "min(380px, 92vw)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
          textAlign: "center",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
          }}
        >
          <IoClose size={15} />
        </button>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#f5f3ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <FaMoneyBillWave size={26} color="#7c3aed" />
        </div>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#1a1f36",
          }}
        >
          تأكيد المرتجع
        </h3>
        <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#374151" }}>
          باقة: <strong>{sub.packageName}</strong>
        </p>
        <p style={{ margin: "0 0 1.5rem", fontSize: "13px", color: "#6b7280" }}>
          سيتم تسجيل مرتجع وإلغاء هذا الاشتراك. لا يمكن التراجع.
        </p>
        {error && (
          <p
            style={{
              margin: "-0.5rem 0 1rem",
              fontSize: "12px",
              color: "#ef4444",
            }}
          >
            {error}
          </p>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleRefund}
            disabled={loading}
            style={{
              height: "44px",
              background: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#6d28d9";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}
          >
            {loading ? (
              "جاري المعالجة..."
            ) : (
              <>
                <FaMoneyBillWave size={14} /> تأكيد
              </>
            )}
          </button>
          <button
            onClick={onClose}
            style={{
              height: "44px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
