import { useEffect, useState } from "react";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────
   HOOK: useCustomerDebt
   Usage: const { hasDebt, totalRemaining, loading } = useCustomerDebt(customerID);
───────────────────────────────────────────── */
export function useCustomerDebt(customerID) {
  const [hasDebt, setHasDebt] = useState(false);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerID) return;
    let cancelled = false;
    axios
      .get(`${apiUrl}/debts/check/${customerID}`)
      .then((r) => {
        if (!cancelled) {
          setHasDebt(r.data.hasDebt);
          setTotalRemaining(r.data.totalRemaining);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [customerID]);

  return { hasDebt, totalRemaining, loading };
}

/* ─────────────────────────────────────────────
   COMPONENT: DebtBadge
   size: "sm" | "md" | "lg"
   variant: "pill" | "tag" | "icon-only"
───────────────────────────────────────────── */
export default function DebtBadge({
  customerID,
  size = "sm",
  variant = "pill",
  className = "",
}) {
  const { hasDebt, totalRemaining, loading } = useCustomerDebt(customerID);

  if (loading || !hasDebt) return null;

  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  if (variant === "icon-only") {
    return (
      <span
        title={`مديون بـ ${fmtNum(totalRemaining)} ج.م`}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold ${className}`}
      >
        !
      </span>
    );
  }

  const sizeClasses = {
    sm: "text-[16px] px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-lg px-3 py-1.5 gap-2",
  };

  if (variant === "tag") {
    return (
      <span
        className={`inline-flex items-center rounded-md font-semibold bg-red-50 border border-red-200 text-red-700 ${sizeClasses[size]} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
        مديون • {fmtNum(totalRemaining)} ج.م
      </span>
    );
  }

  // Default: pill
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold bg-red-100 text-red-700 ${sizeClasses[size]} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      {fmtNum(totalRemaining)} ج.م
    </span>
  );
}

/* ─────────────────────────────────────────────
   COMPONENT: DebtAmountInput
   Drop-in inside your SubscribeModal or renewal form.
   Props: price (full price), value, onChange
───────────────────────────────────────────── */
export function DebtAmountInput({ price, value, onChange }) {
  const fmtNum = (n) =>
    Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  const paid = parseFloat(value) || 0;
  const remaining = Math.max(0, parseFloat(price || 0) - paid);
  const isDebt = remaining > 0;

  return (
    <div className="space-y-3">
      {/* Paid amount input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          المبلغ المدفوع{" "}
          <span className="text-gray-400 font-normal">
            (السعر الكامل: {fmtNum(price)} ج.م)
          </span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={0}
            max={price}
            step={1}
            placeholder={`${price}`}
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 pr-12"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            ج.م
          </span>
        </div>
      </div>

      {/* Debt preview */}
      {value !== "" && value !== String(price) && (
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border ${
            isDebt
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <span>{isDebt ? "سيُسجَّل دين قيمته:" : "مدفوع بالكامل ✓"}</span>
          {isDebt && <span className="font-bold">{fmtNum(remaining)} ج.م</span>}
        </div>
      )}
    </div>
  );
}
