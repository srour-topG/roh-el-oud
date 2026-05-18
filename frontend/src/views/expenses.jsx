import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  MdAttachMoney,
  MdAdd,
  MdDelete,
  MdChevronRight,
  MdChevronLeft,
} from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  format,
  addDays,
  subDays,
  subMonths,
  addMonths,
  formatDate,
} from "date-fns";
import { ar } from "date-fns/locale";
import DatePickerPopup from "../components/datePickerPopup";

const apiUrl = import.meta.env.VITE_API_URL;

// ── Helpers ─────────────────────────────────────────────────────────────
function getDateRange(date, period) {
  if (period === "day") {
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const d = format(utcDate, "yyyy-MM-dd");
    return { start: d, end: d };
  }
  if (period === "month") {
    const y = date.getFullYear(),
      m = date.getMonth();
    const start = format(new Date(y, m, 1), "yyyy-MM-dd");
    const end = format(new Date(y, m + 1, 0), "yyyy-MM-dd");
    return { start, end };
  }
  const y = date.getFullYear();
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

function displayLabel(date, period) {
  if (period === "day")
    return format(date, "EEEE، d MMMM yyyy", { locale: ar });
  if (period === "month") return format(date, "MMMM yyyy", { locale: ar });
  return format(date, "yyyy");
}

function isFutureDate(date, period) {
  const now = new Date();
  if (period === "day") {
    return date >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "month") {
    return (
      date.getFullYear() > now.getFullYear() ||
      (date.getFullYear() === now.getFullYear() &&
        date.getMonth() >= now.getMonth())
    );
  }
  return date.getFullYear() >= now.getFullYear();
}

function shiftDate(date, period, dir) {
  if (period === "day") return dir === -1 ? subDays(date, 1) : addDays(date, 1);
  if (period === "month")
    return dir === -1 ? subMonths(date, 1) : addMonths(date, 1);
  const y = new Date(date);
  y.setFullYear(y.getFullYear() + dir);
  return y;
}

// ── Toast ─────────────────────────────────────────────────────────────
function Toast({ message, ok }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: ok ? "#16a34a" : "#dc2626",
        color: "#fff",
        padding: "0.75rem 1.5rem",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "700",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      {message}
    </div>
  );
}

// ── Add Expense Modal ────────────────────────────────────────────────
function AddExpenseModal({ onClose, onSuccess }) {
  const Schema = Yup.object().shape({
    type: Yup.string().required("الصنف مطلوب"),
    value: Yup.number()
      .typeError("أدخل رقماً صحيحاً")
      .required("المبلغ مطلوب")
      .positive("يجب أن يكون المبلغ موجباً"),
  });

  const IS = (err) => ({
    width: "100%",
    height: "46px",
    padding: "0 0.875rem",
    border: `1.5px solid ${err ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: "10px",
    fontSize: "14px",
    background: "#f9fafb",
    color: "#374151",
    outline: "none",
    textAlign: "right",
    direction: "rtl",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  });

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
          width: "min(440px, 94vw)",
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
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdAttachMoney size={22} color="#dc2626" />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "17px",
                fontWeight: "700",
                color: "#1a1f36",
              }}
            >
              إضافة نفقة
            </h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
              تسجيل مصروف جديد
            </p>
          </div>
        </div>

        <Formik
          initialValues={{ type: "", value: "" }}
          validationSchema={Schema}
          onSubmit={async (values, { resetForm }) => {
            try {
              const res = await axios.post(`${apiUrl}/expenses`, values);
              onSuccess(res.data?.Message || "تمت الإضافة بنجاح", true);
              resetForm();
            } catch (e) {
              onSuccess(e.response?.data?.Message || "حدث خطأ ما", false);
            }
          }}
        >
          {({ errors, touched, handleChange, handleBlur, values }) => (
            <Form>
              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  الصنف / الوصف *
                </label>
                <input
                  name="type"
                  value={values.type}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="مثال: فاتورة كهرباء، إيجار، رواتب..."
                  style={IS(!!(errors.type && touched.type))}
                  onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                />
                {touched.type && errors.type && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "11px",
                      color: "#ef4444",
                    }}
                  >
                    {errors.type}
                  </p>
                )}
              </div>

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
                  المبلغ (ج.م) *
                </label>
                <input
                  name="value"
                  type="number"
                  value={values.value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0.00"
                  style={{
                    ...IS(!!(errors.value && touched.value)),
                    fontSize: "18px",
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                />
                {touched.value && errors.value && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "11px",
                      color: "#ef4444",
                    }}
                  >
                    {errors.value}
                  </p>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                }}
              >
                <button
                  type="submit"
                  style={{
                    height: "46px",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#b91c1c")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#dc2626")
                  }
                >
                  <MdAdd size={18} /> إضافة
                </button>
                <button
                  type="button"
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
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ─────────────────────────────────────────────
function DeleteModal({ expense, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await axios.delete(`${apiUrl}/expenses/${expense.id}`);
      onSuccess(res.data?.Message || "تم الحذف بنجاح", true);
    } catch (e) {
      onSuccess(e.response?.data?.Message || "حدث خطأ", false);
    } finally {
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
          padding: "2rem",
          width: "min(360px, 92vw)",
          textAlign: "center",
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
          }}
        >
          <IoClose size={15} />
        </button>

        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <HiOutlineExclamationCircle
            style={{ fontSize: "30px", color: "#dc2626" }}
          />
        </div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#1a1f36",
          }}
        >
          حذف النفقة
        </h3>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "13px",
            color: "#374151",
            fontWeight: "600",
          }}
        >
          {expense.type}
        </p>
        <p style={{ margin: "0 0 1.5rem", fontSize: "13px", color: "#6b7280" }}>
          بقيمة{" "}
          <strong style={{ color: "#dc2626" }}>
            {expense.value.toLocaleString("ar-EG")} ج.م
          </strong>
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              height: "44px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            {loading ? "جاري..." : "حذف"}
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
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerView, setPickerView] = useState("day");
  const [withdrawalsTotal, setWithdrawalsTotal] = useState(0);

  const isFuture = isFutureDate(selectedDate, period);
  const { start, end } = useMemo(
    () => getDateRange(selectedDate, period),
    [selectedDate, period],
  );

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Regular user expenses
      const expRes = await axios.get(`${apiUrl}/expenses`, {
        params: { startDate: start, endDate: end },
      });
      const regularExpenses = (expRes.data.expenses || []).map((exp) => ({
        id: `exp-${exp.id}`,
        type: exp.type,
        value: parseFloat(exp.value),
        createdAt: exp.createdAt,
        isStock: false,
        category: "expense",
      }));

      // 2. Stock additions (purchases) – positive expenses
      let stockAdditions = [];
      try {
        const addRes = await axios.get(`${apiUrl}/products/stock/movements`, {
          params: {
            type: "add",
            startDate: start,
            endDate: end,
            limit: 2000,
          },
        });
        stockAdditions = (addRes.data.movements || []).map((mov) => ({
          id: `stockadd-${mov.id}`,
          type: `شراء منتج: ${mov.Product?.name || `ID ${mov.productID}`}`,
          value: mov.quantity * mov.unitPrice,
          createdAt: mov.date,
          isStock: true,
          category: "expense",
        }));
      } catch (e) {
        console.warn("فشل جلب حركات إضافة المخزون", e);
      }

      // 3. Stock removals that are NOT sales (withdrawals)
      let stockWithdrawals = [];
      let withdrawalsSum = 0;
      try {
        const remRes = await axios.get(`${apiUrl}/products/stock/movements`, {
          params: {
            type: "remove",
            startDate: start,
            endDate: end,
            limit: 2000,
          },
        });
        stockWithdrawals = (remRes.data.movements || [])
          .filter((mov) => mov.notes !== "بيع كاشير")
          .map((mov) => {
            const val = mov.quantity * mov.unitPrice;
            withdrawalsSum += val;
            return {
              id: `stockrem-${mov.id}`,
              type: `سحب: ${mov.notes || "بدون ملاحظة"} – ${mov.Product?.name || `ID ${mov.productID}`}`,
              value: -val, // negative: subtracts from total
              createdAt: mov.date,
              isStock: true,
              category: "withdrawal",
            };
          });
      } catch (e) {
        console.warn("فشل جلب حركات السحب من المخزون", e);
      }
      setWithdrawalsTotal(withdrawalsSum);

      const allExpenses = [
        ...regularExpenses,
        ...stockAdditions,
        ...stockWithdrawals,
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setExpenses(allExpenses);
    } catch (err) {
      console.error("❌ فشل جلب المصروفات:", err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  function notify(message, ok) {
    setShowAdd(false);
    setDeleteTarget(null);
    setToast({ message, ok });
    if (ok) fetchExpenses();
    setTimeout(() => setToast(null), 3000);
  }

  // Computed values
  const total = expenses.reduce((s, e) => s + (Number(e.value) || 0), 0);
  const daysDiff = Math.max(
    1,
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000),
  );
  const avgPerDay = total > 0 ? total / daysDiff : null;

  // Group by category (including withdrawals as separate lines)
  const byType = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      map[e.type] = (map[e.type] || 0) + Number(e.value);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [expenses]);

  const PERIOD_TABS = [
    { key: "day", label: "يومي" },
    { key: "month", label: "شهري" },
    { key: "year", label: "سنوي" },
  ];

  const handlePeriodChange = (p) => {
    setPeriod(p);
    setSelectedDate(new Date());
  };

  const handlePrev = () => {
    setSelectedDate((d) => shiftDate(d, period, -1));
  };

  const handleNext = () => {
    if (isFuture) return;
    setSelectedDate((d) => shiftDate(d, period, 1));
  };

  return (
    <div
      dir="rtl"
      style={{
        background: "#f7f8fc",
        minHeight: "100vh",
        padding: "1.5rem 1rem",
      }}
    >
      {toast && <Toast message={toast.message} ok={toast.ok} />}
      {showAdd && (
        <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={notify} />
      )}
      {deleteTarget && (
        <DeleteModal
          expense={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={notify}
        />
      )}

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: "22px",
                fontWeight: "800",
                color: "#1a1f36",
              }}
            >
              النفقات
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              تتبع وإدارة المصروفات والسحوبات
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              height: "42px",
              padding: "0 1.25rem",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(220,38,38,0.25)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b91c1c")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#dc2626")}
          >
            <MdAdd size={18} /> إضافة نفقة
          </button>
        </div>

        {/* Date Navigator */}
        <div
          className="flex-col-reverse"
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            border: "1px solid #eef0f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            {start} → {end}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              {PERIOD_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handlePeriodChange(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    period === t.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5 shadow-sm">
              <button
                onClick={handlePrev}
                className="w-9 h-9 rounded-xl hover:bg-white hover:shadow flex items-center justify-center text-gray-500 transition"
              >
                <MdChevronRight size={18} />
              </button>
              <button
                onClick={() => {
                  setOpenPicker(true);
                  setPickerView(period);
                }}
                className="px-3 py-1.5 rounded-xl bg-white shadow text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                {displayLabel(selectedDate, period)}
              </button>
              <button
                onClick={handleNext}
                disabled={isFuture}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 transition ${
                  isFuture
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-white hover:shadow"
                }`}
              >
                <MdChevronLeft size={18} />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="ml-2 px-3 py-1.5 text-xs rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                اليوم
              </button>
              <DatePickerPopup
                open={openPicker}
                onClose={() => setOpenPicker(false)}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                period={period}
                pickerView={pickerView}
                setPickerView={setPickerView}
              />
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Net Total */}
          <div
            style={{
              background: "#dc2626",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "6px",
                }}
              >
                صافي النفقات
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#fff",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {total.toLocaleString("ar-EG")} ج.م
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                {start} → {end}
              </div>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdAttachMoney size={22} color="#fff" />
            </div>
          </div>

          {/* Withdrawals Total (positive) */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef0f5",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  marginBottom: "6px",
                }}
              >
                السحوبات (غير المبيعات)
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#f97316",
                  lineHeight: 1,
                }}
              >
                {withdrawalsTotal.toLocaleString("ar-EG")} ج.م
              </div>
              <div
                style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}
              >
                تخصم من إجمالي النفقات
              </div>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#fff7ed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdAttachMoney size={20} color="#f97316" />
            </div>
          </div>

          {/* Count of transactions */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef0f5",
              borderRadius: "16px",
              padding: "1.25rem",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  marginBottom: "6px",
                }}
              >
                عدد المعاملات
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#1a1f36",
                  lineHeight: 1,
                }}
              >
                {expenses.length}
              </div>
              <div
                style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}
              >
                (نفقة + سحب)
              </div>
            </div>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdAttachMoney size={20} color="#dc2626" />
            </div>
          </div>

          {/* Average per day */}
          {avgPerDay !== null && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #eef0f5",
                borderRadius: "16px",
                padding: "1.25rem",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginBottom: "6px",
                  }}
                >
                  متوسط يومي
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    color: "#d97706",
                    lineHeight: 1,
                  }}
                >
                  {Math.round(avgPerDay).toLocaleString("ar-EG")} ج.م
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  خلال {daysDiff} يوم
                </div>
              </div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#fffbeb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MdAttachMoney size={20} color="#d97706" />
              </div>
            </div>
          )}
        </div>

        {/* Table + Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {/* Expenses table */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #eef0f5",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #f0f2f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#1a1f36",
                }}
              >
                قائمة النفقات
              </span>
              <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                {expenses.length} معاملة
              </span>
            </div>

            {loading ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  color: "#9ca3af",
                }}
              >
                <div style={{ fontSize: "14px" }}>جاري التحميل...</div>
              </div>
            ) : expenses.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center" }}>
                <MdAttachMoney
                  size={48}
                  style={{ color: "#d1d5db", marginBottom: "0.75rem" }}
                />
                <p
                  style={{
                    color: "#9ca3af",
                    fontSize: "14px",
                    margin: "0 0 1rem",
                  }}
                >
                  لا توجد نفقات في هذه الفترة
                </p>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    height: "38px",
                    padding: "0 1rem",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  إضافة نفقة
                </button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["الصنف", "المبلغ", "التاريخ", ""].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            textAlign: i === 3 ? "center" : "right",
                            padding: "11px 16px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#4b5563",
                            background: "#f1f3f9",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((row) => (
                      <tr
                        key={row.id}
                        style={{ borderBottom: "1px solid #f5f5f5" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafbff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              padding: "3px 10px",
                              borderRadius: "8px",
                              background: row.value < 0 ? "#fff7ed" : "#fef2f2",
                              color: row.value < 0 ? "#f97316" : "#dc2626",
                            }}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "14px",
                            fontWeight: "800",
                            color: row.value < 0 ? "#f97316" : "#dc2626",
                          }}
                        >
                          {Number(row.value).toLocaleString("ar-EG")} ج.م
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          {formatDate(
                            new Date(row.createdAt),
                            "yyyy/MM/dd HH:mm",
                            { locale: ar },
                          )}
                        </td>
                        <td
                          style={{ padding: "12px 16px", textAlign: "center" }}
                        >
                          {!row.isStock && (
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  id: row.id.replace("exp-", ""),
                                  type: row.type,
                                  value: Math.abs(row.value),
                                })
                              }
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                background: "#f9fafb",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#374151",
                                transition: "all 0.15s",
                                margin: "0 auto",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#fef2f2";
                                e.currentTarget.style.borderColor = "#fecaca";
                                e.currentTarget.style.color = "#dc2626";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#f9fafb";
                                e.currentTarget.style.borderColor = "#e5e7eb";
                                e.currentTarget.style.color = "#374151";
                              }}
                            >
                              <MdDelete size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      style={{
                        borderTop: "2px solid #e5e7eb",
                        background: "#f8f9fc",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#374151",
                        }}
                      >
                        الإجمالي ({expenses.length} معاملة)
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "15px",
                          fontWeight: "900",
                          color: "#dc2626",
                        }}
                      >
                        {total.toLocaleString("ar-EG")} ج.م
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Breakdown by category */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #eef0f5",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #f0f2f8",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1a1f36",
                }}
              >
                توزيع حسب الصنف
              </span>
            </div>

            {byType.length === 0 ? (
              <div
                style={{
                  padding: "1.5rem",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                لا توجد بيانات
              </div>
            ) : (
              <div style={{ padding: "0.75rem" }}>
                {byType.map(([type, value], i) => {
                  const pct =
                    total !== 0 ? Math.round((value / total) * 100) : 0;
                  const COLORS = [
                    "#dc2626",
                    "#f97316",
                    "#d97706",
                    "#7c3aed",
                    "#1e3a8a",
                  ];
                  return (
                    <div
                      key={type}
                      style={{
                        marginBottom: "1rem",
                        padding: "0.75rem",
                        borderRadius: "10px",
                        background: "#f8f9fc",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#374151",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "60%",
                          }}
                        >
                          {type}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color: COLORS[i % COLORS.length],
                            flexShrink: 0,
                          }}
                        >
                          {Math.abs(pct)}%
                        </span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          background: "#e5e7eb",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.abs(pct)}%`,
                            borderRadius: "3px",
                            background: COLORS[i % COLORS.length],
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "11px",
                          color: "#6b7280",
                          textAlign: "left",
                        }}
                      >
                        {Math.abs(value).toLocaleString("ar-EG")} ج.م
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
