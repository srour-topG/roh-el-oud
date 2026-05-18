import { useState } from "react";
import axios from "axios";
import { differenceInDays, addDays, format } from "date-fns";
import { IoClose } from "react-icons/io5";
import { FaRotateRight } from "react-icons/fa6";
import { DebtAmountInput } from "../debtBadge";

export default function RenewModal({ sub, price, onClose, onSuccess }) {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [paidAmount, setPaidAmount] = useState(String(price));
  const totalPrice = parseFloat(price || 0);
  const DEFAULT_RENEWAL_DAYS = 30;
  const defaultEndDate = format(
    addDays(new Date(), DEFAULT_RENEWAL_DAYS),
    "yyyy-MM-dd",
  );
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const minDate = new Date().toISOString().split("T")[0];

  const daysPreview = endDate
    ? differenceInDays(new Date(endDate), new Date())
    : DEFAULT_RENEWAL_DAYS;

  const totalSessions = sub.usedSessions + sub.availableSessions;

  async function handleRenew() {
    if (!endDate) {
      setError("يرجى تحديد تاريخ الانتهاء");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${apiUrl}/subscribe/renew`, {
        subscriptionID: sub.id,
        customerID: sub.customerID,
        packageName: sub.packageName,
        availableSessions: totalSessions,
        endDate,
        price: totalPrice,
        paidAmount: paidAmount,
      });
      onSuccess(res.data);
    } catch (e) {
      setError(e.response?.data?.Message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (!sub) return null;

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

        {/* Header Icon */}
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <FaRotateRight size={22} color="#1e3a8a" />
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
          تجديد الاشتراك
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          باقة: <strong>{sub.packageName}</strong> — سيتم استعادة{" "}
          {totalSessions} جلسة
        </p>

        {/* Summary Box */}
        <div
          style={{
            background: "#f8f9fc",
            border: "1px solid #eef0f8",
            borderRadius: "12px",
            padding: "0.875rem 1rem",
            marginBottom: "1.25rem",
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            textAlign: "center",
            gap: "0.5rem",
          }}
        >
          {[
            ["الباقة", sub.packageName],
            ["الجلسات المستعادة", `${totalSessions} جلسة`],
          ].map(([label, val]) => (
            <div key={label}>
              <div
                style={{
                  fontSize: "10px",
                  color: "#9ca3af",
                  marginBottom: "3px",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {val}
              </div>
            </div>
          ))}
        </div>
        <DebtAmountInput
          price={totalPrice}
          value={paidAmount}
          onChange={setPaidAmount}
        />
        {/* End Date Picker */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <label
              style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}
            >
              تاريخ انتهاء الاشتراك الجديد
            </label>
            <button
              onClick={() => setEndDate(defaultEndDate)}
              style={{
                fontSize: "11px",
                color: "#1e3a8a",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "underline",
              }}
            >
              إعادة للافتراضي ({DEFAULT_RENEWAL_DAYS} يوم)
            </button>
          </div>
          <input
            type="date"
            value={endDate}
            min={minDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setError("");
            }}
            style={{
              width: "100%",
              height: "44px",
              padding: "0 0.875rem",
              border: `1px solid ${error ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: "10px",
              fontSize: "14px",
              background: "#f9fafb",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
              cursor: "pointer",
              color: "#1f2937",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
            onBlur={(e) =>
              (e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb")
            }
          />
          {error && (
            <p
              style={{ margin: "4px 0 0", fontSize: "12px", color: "#ef4444" }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Duration Preview */}
        {endDate && (
          <div
            style={{
              background:
                daysPreview >= DEFAULT_RENEWAL_DAYS ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${daysPreview >= DEFAULT_RENEWAL_DAYS ? "#bbf7d0" : "#fde68a"}`,
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "1.25rem",
              fontSize: "13px",
              color:
                daysPreview >= DEFAULT_RENEWAL_DAYS ? "#15803d" : "#92400e",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {daysPreview < DEFAULT_RENEWAL_DAYS ? "⚠️" : "✓"} مدة الاشتراك:{" "}
            <strong>{daysPreview} يوم</strong>
            {daysPreview !== DEFAULT_RENEWAL_DAYS && (
              <span style={{ opacity: 0.7, fontSize: "11px" }}>
                (الافتراضي: {DEFAULT_RENEWAL_DAYS} يوم)
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleRenew}
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#1e40af";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1e3a8a")}
          >
            {loading ? "جاري التجديد..." : "تأكيد التجديد"}
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
