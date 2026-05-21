import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MdOutlineMoneyOff,
  MdPayment,
  MdDeleteOutline,
  MdSearch,
  MdFilterList,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdWarningAmber,
} from "react-icons/md";
import { IoPersonCircleOutline } from "react-icons/io5";
import ImageWithAuth from "../components/ImageWithAuth"; // adjust path
import DeleteConfirmationModal from "../components/modals/deleteConfirmModal";

const apiUrl = import.meta.env.VITE_API_URL;

const fmtNum = (n) =>
  Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: "لم يدفع",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  partial: {
    label: "دفع جزئي",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  paid: {
    label: "مسدد",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-lg font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   PAY MODAL
───────────────────────────────────────────── */
function PayModal({ debt, onClose, onPaid }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remaining = parseFloat(debt.remainingAmount);
  const inputVal = parseFloat(amount) || 0;
  const isValid = inputVal > 0 && inputVal <= remaining;

  const handlePay = async () => {
    if (!isValid) {
      setError("أدخل مبلغاً صحيحاً لا يتجاوز المتبقي");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/debts/${debt.id}/pay`, { amount: inputVal });
      onPaid?.();
    } catch (e) {
      setError(e.response?.data?.Message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        dir="rtl"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">تسجيل دفعة</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Debt summary */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">العميل</span>
              <span className="font-medium text-gray-800">
                {debt.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">رقم الفاتورة</span>
              <span className="font-medium text-gray-800 flex gap-0.5">
                <span>{debt.invoiceNumber}</span>
                <span>#</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">إجمالي الدين</span>
              <span className="font-semibold text-red-600">
                {fmtNum(debt.remainingAmount)} ج.م
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              المبلغ المدفوع
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePay()}
                onWheel={(e) => e.target.blur()}
                min={1}
                max={remaining}
                step={1}
                placeholder={`أقصى ${fmtNum(remaining)} ج.م`}
                className="w-full text-gray-600 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 pr-12"
                autoFocus
                
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                ج.م
              </span>
            </div>
          </div>

          {/* Quick fill buttons */}
          <div className="flex gap-2">
            {[25, 50, 100].map((pct) => {
              const val = Math.round((remaining * pct) / 100);
              return (
                <button
                  key={pct}
                  onClick={() => setAmount(String(val))}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 transition"
                >
                  {pct}% ({fmtNum(val)})
                </button>
              );
            })}
            <button
              onClick={() => setAmount(String(remaining))}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 transition"
            >
              الكل
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
          <button
            onClick={handlePay}
            disabled={loading || !isValid}
            className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <MdPayment size={16} />
            تسجيل الدفعة
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────── */
function Pagination({ currentPage, totalPages, onChange }) {
  const pages = useMemo(() => {
    const maxV = 5;
    let s = Math.max(1, currentPage - Math.floor(maxV / 2));
    let e = Math.min(totalPages, s + maxV - 1);
    if (e - s + 1 < maxV) s = Math.max(1, e - maxV + 1);
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 p-4 border-t border-gray-100">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
      >
        <MdChevronRight size={18} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
            p === currentPage
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition"
      >
        <MdChevronLeft size={18} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function Debt() {
  const navigate = useNavigate();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [payingDebt, setPayingDebt] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchDebts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/debts`, {
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: debouncedSearch || undefined,
        },
      });
      // console.log("ressssssss : ", res);
      setDebts(res.data.debts);
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
      setStats(res.data.stats || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleDelete = async (id) => {
    if (!selectedDebtId) return;
    try {
      await axios.delete(`${apiUrl}/debts/${selectedDebtId}`);
      fetchDebts();
    } catch (e) {
      console.error(e);
    } finally {
      setSelectedDebtId(null);
    }
  };

  const STATUS_TABS = [
    { key: "all", label: "الكل" },
    { key: "pending", label: "لم يدفع" },
    { key: "partial", label: "جزئي" },
    { key: "paid", label: "مسدد" },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-6">
      <DeleteConfirmationModal
        openModal={deleteModalOpen}
        setOpenModal={setDeleteModalOpen}
        execFunc={handleDelete}
        Message="هل أنت متأكد من حذف هذا الدين؟"
      />
      {payingDebt && (
        <PayModal
          debt={payingDebt}
          onClose={() => setPayingDebt(null)}
          onPaid={() => {
            setPayingDebt(null);
            fetchDebts();
          }}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MdOutlineMoneyOff className="text-red-500" size={28} />
              سجل المديونيات
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              متابعة الديون والمدفوعات المعلقة
            </p>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "إجمالي الديون المتبقية",
              value: `${fmtNum(stats.totalDebt)} ج.م`,
              color: "text-red-600",
              bg: "bg-red-50",
              border: "border-red-100",
            },
            {
              label: "لم يدفع بعد",
              value: stats.pendingCount || 0,
              color: "text-red-700",
              bg: "bg-red-50",
              border: "border-red-100",
            },
            {
              label: "دفع جزئي",
              value: stats.partialCount || 0,
              color: "text-amber-700",
              bg: "bg-amber-50",
              border: "border-amber-100",
            },
            {
              label: "مسدد بالكامل",
              value: stats.paidCount || 0,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${card.bg} border ${card.border} rounded-2xl px-5 py-4`}
            >
              <p className="text-lg text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <MdSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="بحث بالاسم..."
              className="w-full pr-9 pl-4 py-2.5 text-lg border text-gray-600 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatus(tab.key);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-md font-medium transition ${
                  statusFilter === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(search || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setStatus("all");
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <MdClose size={14} />
              مسح
            </button>
          )}

          <span className="mr-auto text-sm text-gray-400">
            {totalItems} دين
          </span>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-500">
                  <th className="px-6 py-4 text-lg font-semibold text-center">
                    العميل
                  </th>
                  <th className="px-6 py-4 text-lg font-semibold text-center">
                    السعر الكامل
                  </th>
                  <th className="px-6 py-4 text-lg font-semibold text-center">
                    المدفوع
                  </th>
                  <th className="px-6 py-4 text-lg font-semibold text-center">
                    المتبقي
                  </th>
                  <th className="px-6 py-4 text-lg font-semibold text-center">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-lg font-semibold text-center">
                    التاريخ
                  </th>
                  <th className="px-6 py-4 text-lg font-semibold text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : debts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <MdWarningAmber
                        size={40}
                        className="mx-auto mb-2 text-gray-200"
                      />
                      لا توجد مديونيات مطابقة
                    </td>
                  </tr>
                ) : (
                  debts.map((debt) => (
                    <tr
                      key={debt.id}
                      className="hover:bg-gray-50 transition group"
                    >
                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <ImageWithAuth
                            customer={debt.Customer}
                            className="w-8 h-8 rounded-full object-cover border bg-gray-600 border-gray-200 flex-shrink-0"
                            fallbackIcon={IoPersonCircleOutline}
                          />
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">
                              {debt.customerName}
                            </p>
                            <p className="text-sm text-gray-400">
                              #{debt.invoiceNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-center text-gray-600 font-medium text-xl">
                        {fmtNum(debt.totalAmount)} ج.م
                      </td>

                      {/* Paid */}
                      <td className="px-6 py-4 text-center text-emerald-600 font-semibold text-xl">
                        {fmtNum(debt.paidAmount)} ج.م
                      </td>

                      {/* Remaining */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-bold text-xl ${
                            parseFloat(debt.remainingAmount) > 0
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {fmtNum(debt.remainingAmount)} ج.م
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={debt.status} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-center text-gray-500 text-lg">
                        {new Date(debt.createdAt).toLocaleDateString("ar-EG")}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {debt.status !== "paid" && (
                            <button
                              onClick={() => setPayingDebt(debt)}
                              title="تسجيل دفعة"
                              className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                            >
                              <MdPayment size={22} />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedDebtId(debt.id);
                              setDeleteModalOpen(true);
                            }}
                            title="حذف"
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition"
                          >
                            <MdDeleteOutline size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={(p) => setCurrentPage(p)}
          />
        </div>
      </div>
    </div>
  );
}
