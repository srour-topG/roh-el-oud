import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdMonetizationOn,
  MdAdd,
  MdDeleteOutline,
  MdFilterAlt,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdShoppingCart,
  MdAttachMoney,
} from "react-icons/md";
import { FaCashRegister, FaBoxOpen, FaUsers } from "react-icons/fa";
import { format, subMonths, subDays, addDays, addMonths } from "date-fns";
import { ar } from "date-fns/locale";
import DailyTransactionsPanel from "../components/DailyTransactionsPanel";
import DatePickerPopup from "../components/datePickerPopup";

const apiUrl = import.meta.env.VITE_API_URL;

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PERIOD_TABS = [
  { key: "day", label: "يومي" },
  { key: "month", label: "شهري" },
  { key: "year", label: "سنوي" },
];

const EXPENSE_TYPES = [
  "صيانة",
  "رواتب",
  "إيجار",
  "مستلزمات",
  "كهرباء",
  "مياه",
  "أخرى",
];

const TYPE_COLORS = {
  رواتب: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  إيجار: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  صيانة: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  مستلزمات: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  كهرباء: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-500" },
  مياه: { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-500" },
  أخرى: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

/* ─────────────────────────────────────────────
   HELPER: format number in Arabic locale
───────────────────────────────────────────── */
const fmtNum = (n) =>
  Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

const pct = (part, total) =>
  total ? Math.min(100, Math.round((part / total) * 100)) : 0;

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

/** Animated progress bar */
function ProgressBar({ value, color = "bg-blue-500", animate = true }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={`${color} h-full rounded-full`}
        style={{
          width: `${width}%`,
          transition: animate ? "width 0.6s cubic-bezier(.4,0,.2,1)" : "none",
        }}
      />
    </div>
  );
}

/** KPI card */
function KpiCard({ title, value, sub, icon, accent, trend, trendUp }) {
  return (
    <div
      className={`relative overflow-hidden bg-white rounded-2xl p-5 border border-gray-100 shadow-sm`}
    >
      <div
        className={`absolute top-0 right-0 w-1 h-full rounded-r-2xl ${accent}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium text-gray-600 mb-1 tracking-wide uppercase">
            {title}
          </p>
          <p
            className={`text-2xl font-bold truncate ${accent.replace("bg-", "text-")} `}
          >
            {fmtNum(value)}
            <span className="text-sm font-medium text-gray-400 mr-1">ج.م</span>
          </p>
          {sub && <p className="text-sm text-gray-400 mt-2">{sub}</p>}
        </div>
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${accent.replace("bg-", "bg-").replace("500", "100")}`}
        >
          <span className={accent.replace("bg-", "text-")}>{icon}</span>
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1">
          <span
            className={`text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-500"}`}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-gray-400">عن الفترة السابقة</span>
        </div>
      )}
    </div>
  );
}

function ProfitBreakdown({ summary }) {
  if (!summary) return null;

  const { totalRevenue, cogs, totalExpenses, netProfit, profitMargin } =
    summary;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-xl font-bold text-gray-800 mb-5">تحليل الأرباح</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600 text-lg">إجمالي المبيعات</span>
          <span className="font-bold text-lg text-emerald-600">
            {fmtNum(totalRevenue)} ج.م
          </span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600 text-lg">تكلفة البضائع المباعة</span>
          <span className="font-bold text-red-500 text-lg">{fmtNum(cogs)} ج.م</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600 text-lg">المصروفات التشغيلية</span>
          <span className="font-bold text-orange-500 text-lg">
            {fmtNum(totalExpenses)} ج.م
          </span>
        </div>
        <div className="flex justify-between items-center pt-3 mt-1 border-t-2 border-gray-200">
          <span className="text-lg font-bold text-gray-800 ">صافي الربح</span>
          <div className="text-right">
            <span className="text-xl font-extrabold text-blue-600">
              {fmtNum(netProfit)} ج.م
            </span>
            <span className="text-xs text-gray-400 mr-2">
              (هامش {profitMargin}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Revenue source row */
function SourceRow({ label, value, total, color, barColor }) {
  const p = pct(value, total);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${barColor}`} />
          <span className="text-sm text-gray-600">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{p}%</span>
          <span className={`text-sm font-semibold ${color}`}>
            {fmtNum(value)} ج.م
          </span>
        </div>
      </div>
      <ProgressBar value={p} color={barColor} />
    </div>
  );
}

/** Type badge */
function TypeBadge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS["أخرى"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {type}
    </span>
  );
}

/** Skeleton loader */
function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
  );
}

/* ─────────────────────────────────────────────
   INCOME PANEL
───────────────────────────────────────────── */
function IncomePanel({ summary }) {
  if (!summary) return null;

  const { breakdown, totalRevenue } = summary;

  const sources = [
    {
      label: "الاشتراكات",
      value: breakdown.subscriptions,
      color: "text-blue-600",
      barColor: "bg-blue-500",
    },
    {
      label: "مبيعات المنتجات",
      value: breakdown.products,
      color: "text-emerald-600",
      barColor: "bg-emerald-500",
    },
    {
      label: "الزوار",
      value: breakdown.guests,
      color: "text-violet-600",
      barColor: "bg-violet-500",
    },
  ];

  const grossProfit = totalRevenue - breakdown.productCost;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-base font-bold text-gray-800 mb-5">
        توزيع الإيرادات
      </h3>

      <div className="space-y-5">
        {sources.map((s) => (
          <SourceRow
            key={s.label}
            label={s.label}
            value={s.value}
            total={totalRevenue}
            color={s.color}
            barColor={s.barColor}
          />
        ))}
      </div>

      {/* Cost breakdown */}
      <div className="mt-6 pt-5 border-t border-dashed border-gray-200 space-y-3">
        <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">
          التكاليف
        </p>
        <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-xl">
          <span className="text-sm text-red-700">تكلفة المنتجات المباعة</span>
          <span className="text-sm font-bold text-red-600">
            {fmtNum(breakdown.productCost)} ج.م
          </span>
        </div>
        <div className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-xl">
          <span className="text-sm text-orange-700">مصروفات أخرى</span>
          <span className="text-sm font-bold text-orange-600">
            {fmtNum(breakdown.otherExpenses)} ج.م
          </span>
        </div>
      </div>

      {/* Gross profit */}
      <div className="mt-4 flex items-center justify-between py-3 px-4 bg-gradient-to-l from-emerald-50 to-transparent border border-emerald-100 rounded-xl">
        <span className="text-sm font-semibold text-emerald-700">
          إجمالي الربح
        </span>
        <span className="text-base font-bold text-emerald-600">
          {fmtNum(grossProfit)} ج.م
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PERIOD HELPERS
───────────────────────────────────────────── */
function shiftDate(date, period, dir) {
  if (period === "day") return dir === -1 ? subDays(date, 1) : addDays(date, 1);
  if (period === "month")
    return dir === -1 ? subMonths(date, 1) : addMonths(date, 1);
  const y = new Date(date);
  y.setFullYear(y.getFullYear() + dir);
  return y;
}

function getDateParam(date, period) {
  if (period === "day") {
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    return format(utcDate, "yyyy-MM-dd");
  }
  if (period === "month") return format(date, "yyyy-MM");
  return format(date, "yyyy");
}

function getDateRange(date, period) {
  if (period === "day") {
    // إنشاء تاريخ UTC من اليوم المختار (ساعاته 00:00:00)
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const d = format(utcDate, "yyyy-MM-dd");
    return { start: d, end: d };
  }
  if (period === "month") {
    const y = date.getFullYear(),
      m = date.getMonth();
    // لاحظ: no need for UTC because month range uses start/end of month as strings
    const start = format(new Date(y, m, 1), "yyyy-MM-dd");
    const end = format(new Date(y, m + 1, 0), "yyyy-MM-dd");
    return { start, end };
  }
  const y = date.getFullYear();
  return { start: `${y}-01-01`, end: `${y}-12-31` };
}

function formatLocalDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

  // year
  return date.getFullYear() >= now.getFullYear();
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────── */
export default function FinanceDashboard() {
  const navigate = useNavigate();
  const [openPicker, setOpenPicker] = useState(false);
  const [pickerView, setPickerView] = useState("day");
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryKey, setSummaryKey] = useState(0);
  const isFuture = isFutureDate(selectedDate, period);

  const handleNext = () => {
    if (isFuture) return;
    setSelectedDate((d) => shiftDate(d, period, 1));
  };

  const { start, end } = getDateRange(selectedDate, period);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/finance/summary`, {
        params: { period, date: getDateParam(selectedDate, period) },
      });
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, summaryKey]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    setSelectedDate(new Date());
  };

  const netMargin = summary ? pct(summary.netProfit, summary.totalRevenue) : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 ">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة المالية</h1>
            <p className="text-lg text-gray-400 mt-0.5">
              {displayLabel(selectedDate, period)}
            </p>
          </div>

          {/* Period switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              {PERIOD_TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => handlePeriodChange(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-lg font-medium transition-all ${
                    period === t.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Date nav */}
            <div className="relative flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5 shadow-sm">
              {/* Previous */}
              <button
                onClick={() => setSelectedDate((d) => shiftDate(d, period, -1))}
                className="w-9 h-9 rounded-xl hover:bg-white hover:shadow flex items-center justify-center text-gray-500 transition"
              >
                <MdChevronRight size={18} />
              </button>

              {/* Date Display */}
              <button
                onClick={() => {
                  setOpenPicker(true);
                  setPickerView(period);
                }}
                className="px-3 py-1.5 rounded-xl bg-white shadow text-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                {displayLabel(selectedDate, period)}
              </button>

              {/* Next */}
              <button
                onClick={handleNext}
                disabled={isFuture}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 transition
                ${isFuture ? "opacity-40 cursor-not-allowed" : "hover:bg-white hover:shadow"}`}
              >
                <MdChevronLeft size={18} />
              </button>

              {/* Today */}
              <button
                onClick={() => setSelectedDate(new Date())}
                className="ml-2 px-3 py-1.5 text-sm rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                اليوم
              </button>

              {/* POPUP */}
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
      </div>

      {/* ── Content ── */}
      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {/* KPI row */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-100 rounded-2xl h-28"
              />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              title="إجمالي المبيعات"
              value={summary.totalRevenue}
              icon={<MdShoppingCart size={22} />}
              accent="bg-emerald-500"
              sub={`${formatLocalDate(new Date(summary.startDate))} → ${formatLocalDate(new Date(summary.endDate))}`}
            />
            <KpiCard
              title="تكلفة البضائع"
              value={summary.cogs}
              icon={<FaBoxOpen size={22} />}
              accent="bg-red-500"
            />
            <KpiCard
              title="المصروفات"
              value={summary.totalExpenses}
              icon={<MdTrendingDown size={22} />}
              accent="bg-orange-500"
            />
            <KpiCard
              title="صافي الربح"
              value={summary.netProfit}
              icon={<MdAttachMoney size={22} />}
              accent="bg-blue-500"
              sub={`هامش ${summary.profitMargin}%`}
            />
          </div>
        ) : null}

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Profit breakdown panel */}
          <div className="xl:col-span-2">
            {loading ? (
              <div className="animate-pulse bg-gray-100 rounded-2xl h-72" />
            ) : (
              <ProfitBreakdown summary={summary} />
            )}
          </div>

          {/* Daily transactions (expenses + daily sales) */}
          <div className="xl:col-span-3 min-h-96 flex flex-col">
            <DailyTransactionsPanel
              startDate={start}
              endDate={end}
              onRefreshSummary={() => setSummaryKey((k) => k + 1)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
