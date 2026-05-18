import { useState } from "react";
import axios from "axios";
import { differenceInDays, addDays, format } from "date-fns";
import { IoClose } from "react-icons/io5";
import { GoPackage } from "react-icons/go";
import { DebtAmountInput } from "../debtBadge";

export default function SubscribeModal({
  pkg,
  customerID,
  onClose,
  onSuccess,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;

  const totalPrice = parseFloat(pkg?.price || 0);
  const [paidAmount, setPaidAmount] = useState(String(totalPrice));

  const defaultEndDate = format(
    addDays(new Date(), pkg.duration),
    "yyyy-MM-dd",
  );
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const minDate = new Date().toISOString().split("T")[0];

  const daysPreview = endDate
    ? differenceInDays(new Date(endDate), new Date())
    : pkg.duration;

  async function handleSubscribe() {
    if (!endDate) {
      setError("يرجى تحديد تاريخ الانتهاء");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${apiUrl}/subscribe`, {
        packID: pkg.id,
        customerID,
        endDate,
        paidAmount: paidAmount,
      });
      console.log("res", res.data);
      onSuccess(res.data);
    } catch (e) {
      setError(e.response?.data?.Message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  if (!pkg) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
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

        {/* Header */}
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
          <GoPackage size={22} color="#1e3a8a" />
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
          تأكيد الاشتراك
        </h3>
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          {pkg.type} — {pkg.count} جلسة — {pkg.price} جنيه
        </p>

        {/* Package summary */}
        <div
          style={{
            background: "#f8f9fc",
            border: "1px solid #eef0f8",
            borderRadius: "12px",
            padding: "0.875rem 1rem",
            marginBottom: "1.25rem",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            textAlign: "center",
            gap: "0.5rem",
          }}
        >
          {[
            ["النوع", pkg.type],
            ["الجلسات", `${pkg.count} جلسة`],
            ["السعر", `${pkg.price} ج`],
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
        {/* End date picker */}
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
              تاريخ انتهاء الاشتراك
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
              إعادة للافتراضي ({pkg.duration} يوم)
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

        {/* Duration preview */}
        {endDate && (
          <div
            style={{
              background: daysPreview >= pkg.duration ? "#f0fdf4" : "#fffbeb",
              border: `1px solid ${daysPreview >= pkg.duration ? "#bbf7d0" : "#fde68a"}`,
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "1.25rem",
              fontSize: "13px",
              color: daysPreview >= pkg.duration ? "#15803d" : "#92400e",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {daysPreview < pkg.duration ? "⚠️" : "✓"} مدة الاشتراك:{" "}
            <strong>{daysPreview} يوم</strong>
            {daysPreview !== pkg.duration && (
              <span style={{ opacity: 0.7, fontSize: "11px" }}>
                (الافتراضي: {pkg.duration} يوم)
              </span>
            )}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleSubscribe}
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
            {loading ? "جاري الاشتراك..." : "تأكيد الاشتراك"}
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
