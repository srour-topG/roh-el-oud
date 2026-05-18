import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import { MdPersonAdd, MdCheckCircle, MdAttachMoney } from "react-icons/md";

const apiUrl = import.meta.env.VITE_API_URL;

// Egyptian mobile number regex
const EGYPT_MOBILE_REGEX = /^(01)[0-9]{9}$/;

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .required("الاسم مطلوب")
    .min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  mobile: Yup.string()
    .nullable()
    .optional()
    .matches(EGYPT_MOBILE_REGEX, "رقم الجوال غير صالح (مثال: 01234567890)"),
  gender: Yup.string()
    .required("الجنس مطلوب")
    .oneOf(["ذكر", "أنثى"], "يرجى اختيار الجنس"),
  sessionPrice: Yup.number()
    .required("سعر الحصة مطلوب")
    .positive("يجب أن يكون السعر أكبر من 0")
    .default(30),
});

export default function FastAttendGuestModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formik = useFormik({
    initialValues: {
      name: "",
      mobile: "",
      gender: "ذكر",
      sessionPrice: 30,
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      setError("");
      try {
        await axios.post(`${apiUrl}/fast-attend`, {
          name: values.name.trim(),
          mobile: values.mobile || null,
          gender: values.gender,
          sessionPrice: values.sessionPrice,
        });
        resetForm();
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        setError(err.response?.data?.Message || "حدث خطأ");
      } finally {
        setLoading(false);
      }
    },
  });

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(200, 210, 230, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem 2rem 1.75rem",
          width: "min(440px, 92vw)",
          position: "relative",
          boxShadow: "0 20px 60px rgba(30,58,138,0.12)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        >
          <IoClose size={18} />
        </button>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "800",
              color: "#1e3a8a",
              marginBottom: "6px",
            }}
          >
            حضور سريع (زائر)
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
            أدخل اسم الزائر لتسجيل جلسة بدون اشتراك
          </p>
        </div>

        <form onSubmit={formik.handleSubmit}>
          {/* Name field */}
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
              textAlign: "right",
            }}
          >
            الاسم <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <span
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <MdPersonAdd size={20} />
            </span>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              placeholder="أدخل اسم الزائر"
              autoFocus
              style={{
                width: "100%",
                height: "48px",
                padding: "0 1rem 0 3rem",
                fontSize: "15px",
                fontWeight: "600",
                textAlign: "right",
                direction: "rtl",
                border: `1.5px solid ${
                  formik.touched.name && formik.errors.name
                    ? "#ef4444"
                    : "#e5e7eb"
                }`,
                borderRadius: "12px",
                background: "#f9fafb",
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              onBlur={(e) => {
                formik.handleBlur(e);
                e.target.style.borderColor =
                  formik.touched.name && formik.errors.name
                    ? "#ef4444"
                    : "#e5e7eb";
              }}
            />
          </div>
          {formik.touched.name && formik.errors.name && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                color: "#ef4444",
                textAlign: "right",
              }}
            >
              {formik.errors.name}
            </p>
          )}

          {/* Mobile field (optional) with validation */}
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
              textAlign: "right",
              marginTop: "12px",
            }}
          >
            رقم الجوال (اختياري)
          </label>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <input
              type="tel"
              name="mobile"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              placeholder="مثال: 01234567890"
              style={{
                width: "100%",
                height: "48px",
                padding: "0 1rem",
                fontSize: "15px",
                textAlign: "right",
                direction: "rtl",
                border: `1.5px solid ${
                  formik.touched.mobile && formik.errors.mobile
                    ? "#ef4444"
                    : "#e5e7eb"
                }`,
                borderRadius: "12px",
                background: "#f9fafb",
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              onBlur={(e) => {
                formik.handleBlur(e);
                e.target.style.borderColor =
                  formik.touched.mobile && formik.errors.mobile
                    ? "#ef4444"
                    : "#e5e7eb";
              }}
            />
          </div>
          {formik.touched.mobile && formik.errors.mobile && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                color: "#ef4444",
                textAlign: "right",
              }}
            >
              {formik.errors.mobile}
            </p>
          )}

          {/* Gender field – now styled like other inputs */}
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
              textAlign: "right",
              marginTop: "12px",
            }}
          >
            الجنس
          </label>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <select
              name="gender"
              value={formik.values.gender}
              onChange={formik.handleChange}
              style={{
                width: "100%",
                height: "48px",
                padding: "0 1rem",
                fontSize: "15px",
                textAlign: "right",
                direction: "rtl",
                border: `1.5px solid #e5e7eb`,
                borderRadius: "12px",
                background: "#f9fafb",
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "inherit",
                cursor: "pointer",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              onBlur={(e) => {
                formik.handleBlur(e);
                e.target.style.borderColor = "#e5e7eb";
              }}
            >
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
          {formik.touched.gender && formik.errors.gender && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                color: "#ef4444",
                textAlign: "right",
              }}
            >
              {formik.errors.gender}
            </p>
          )}

          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "8px",
              textAlign: "right",
              marginTop: "12px",
            }}
          >
            سعر الحصة (ج.م)
          </label>
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <span
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <MdAttachMoney size={20} />
            </span>
            <input
              type="number"
              name="sessionPrice"
              value={formik.values.sessionPrice}
              onChange={formik.handleChange}
              placeholder="السعر بالجنيه"
              step="1"
              min="1"
              style={{
                width: "100%",
                height: "48px",
                padding: "0 1rem 0 3rem",
                fontSize: "15px",
                fontWeight: "500",
                textAlign: "right",
                direction: "rtl",
                border: `1.5px solid ${
                  formik.touched.sessionPrice && formik.errors.sessionPrice
                    ? "#ef4444"
                    : "#e5e7eb"
                }`,
                borderRadius: "12px",
                background: "#f9fafb",
                color: "#111827",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              onBlur={(e) => {
                formik.handleBlur(e);
                e.target.style.borderColor =
                  formik.touched.sessionPrice && formik.errors.sessionPrice
                    ? "#ef4444"
                    : "#e5e7eb";
              }}
            />
          </div>
          {formik.touched.sessionPrice && formik.errors.sessionPrice && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                color: "#ef4444",
                textAlign: "right",
              }}
            >
              {formik.errors.sessionPrice}
            </p>
          )}

          {/* Error message from server */}
          {error && (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: "12px",
                color: "#ef4444",
                textAlign: "right",
              }}
            >
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              background: "#1e3a8a",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: error ? "0" : "1rem",
              transition: "background 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) =>
              !loading && (e.currentTarget.style.background = "#1e40af")
            }
            onMouseLeave={(e) =>
              !loading && (e.currentTarget.style.background = "#1e3a8a")
            }
          >
            <MdCheckCircle size={20} />
            {loading ? "جاري التسجيل..." : "تسجيل الحضور"}
          </button>

          {/* Cancel link */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              marginTop: "0.875rem",
              background: "none",
              border: "none",
              fontSize: "13px",
              color: "#9ca3af",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >
            إلغاء العملية
          </button>
        </form>
      </div>
    </div>
  );
}
