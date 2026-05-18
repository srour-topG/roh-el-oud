import { useState } from "react";
import axios from "axios";
import { format, addDays, differenceInDays } from "date-fns";
import { IoClose } from "react-icons/io5";
import { FaEdit, FaPlus, FaMinus } from "react-icons/fa";

export default function EditSubscriptionModal({ sub, onClose, onSuccess }) {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [endDate, setEndDate] = useState(sub.endDate?.split("T")[0] || "");
  const [sessionDelta, setSessionDelta] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date().toISOString().split("T")[0];
  const daysPreview = endDate
    ? differenceInDays(new Date(endDate), new Date())
    : 0;

  const newAvailable = sub.availableSessions + sessionDelta;

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {};
      if (endDate !== sub.endDate?.split("T")[0]) payload.endDate = endDate;
      if (sessionDelta !== 0) payload.sessionDelta = sessionDelta;

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const res = await axios.patch(
        `${apiUrl}/subscription/${sub.id}`,
        payload,
      );
      onSuccess(res.data);
    } catch (e) {
      setError(e.response?.data?.Message || "حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

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
          width: "min(420px, 92vw)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
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
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#eaeefc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <FaEdit size={22} color="#1e3a8a" />
        </div>

        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#1e3a8a",
            textAlign: "center",
          }}
        >
          تعديل الاشتراك
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          {sub.packageName} — المتاح حالياً {sub.availableSessions} جلسة
        </p>

        {/* End Date */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            تاريخ الانتهاء
          </label>
          <input
            type="date"
            value={endDate}
            min={minDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-gray-900"
            style={{
              width: "100%",
              height: "44px",
              padding: "0 0.875rem",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px",
              background: "#f9fafb",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
          {endDate && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "12px",
                color: daysPreview >= 0 ? "#15803d" : "#dc2626",
              }}
            >
              المدة المتبقية: {daysPreview} يوم
            </div>
          )}
        </div>

        {/* Session Adjustment */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "10px",
            }}
          >
            تعديل الجلسات المتبقية
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => setSessionDelta((d) => d - 1)}
              disabled={newAvailable <= 0}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                fontSize: "20px",
                cursor: newAvailable <= 0 ? "not-allowed" : "pointer",
                opacity: newAvailable <= 0 ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaMinus />
            </button>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {newAvailable}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                {sessionDelta !== 0 && (
                  <span
                    style={{ color: sessionDelta > 0 ? "#16a34a" : "#dc2626" }}
                  >
                    {sessionDelta > 0 ? `+${sessionDelta}` : sessionDelta}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSessionDelta((d) => d + 1)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaPlus />
            </button>
          </div>
        </div>

        {error && (
          <p
            style={{
              margin: "0 0 1rem",
              fontSize: "12px",
              color: "#ef4444",
              textAlign: "center",
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
            onClick={handleSave}
            disabled={loading}
            style={{
              height: "46px",
              background: "#1e3a8a",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
          <button
            onClick={onClose}
            style={{
              height: "46px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
