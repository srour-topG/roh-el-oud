import { useState, useEffect } from "react";
import axios from "axios";
import { MdPayment, MdDeleteOutline } from "react-icons/md";
// import DebtBadge from "../components/DebtBadge";

const apiUrl = import.meta.env.VITE_API_URL;
const fmtNum = (n) =>
  Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

export function CustomerDebtPanel({ customerID }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRemaining, setTotal] = useState(0);
  const [payingId, setPayingId] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const fetchDebts = () => {
    setLoading(true);
    axios
      .get(`${apiUrl}/debts/customer/${customerID}`)
      .then((r) => {
        // console.log(r);
        setDebts(r.data.debts);
        setTotal(r.data.totalRemaining);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDebts();
  }, [customerID]);

  const handlePay = async (debt) => {
    const val = parseFloat(payAmount);
    if (!val || val <= 0 || val > parseFloat(debt.remainingAmount)) {
      setPayError("مبلغ غير صالح");
      return;
    }
    setPayLoading(true);
    try {
      await axios.post(`${apiUrl}/debts/${debt.id}/pay`, { amount: val });
      setPayingId(null);
      setPayAmount("");
      setPayError("");
      fetchDebts();
    } catch (e) {
      setPayError(e.response?.data?.Message || "حدث خطأ");
    } finally {
      setPayLoading(false);
    }
  };

  const STATUS_COLORS = {
    pending: "bg-red-50 border-red-200 text-red-700",
    partial: "bg-amber-50 border-amber-200 text-amber-700",
    paid: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  const STATUS_LABELS = { pending: "لم يدفع", partial: "جزئي", paid: "مسدد" };

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-5">
      {/* Summary banner */}
      {totalRemaining > 0 && (
        <div className="mb-5 flex items-center justify-between bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-red-700">
              إجمالي المديونية
            </p>
            <p className="text-xs text-red-500 mt-0.5">يجب تسوية هذه المبالغ</p>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {fmtNum(totalRemaining)} ج.م
          </p>
        </div>
      )}

      {debts.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <MdPayment size={40} className="mx-auto mb-2 text-gray-200" />
          <p className="text-sm">لا توجد مديونيات مسجلة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => (
            <div
              key={debt.id}
              className="border border-gray-100 rounded-2xl overflow-hidden"
            >
              {/* Debt row */}
              <div className="flex items-center gap-4 p-4 bg-white">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {debt.Subscription?.packageName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[debt.status]}`}
                    >
                      {STATUS_LABELS[debt.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>السعر: {fmtNum(debt.totalAmount)} ج.م</span>
                    <span>
                      مدفوع:{" "}
                      <span className="text-emerald-600 font-semibold">
                        {fmtNum(debt.paidAmount)}
                      </span>{" "}
                      ج.م
                    </span>
                    <span>
                      متبقي:{" "}
                      <span className="text-red-600 font-semibold">
                        {fmtNum(debt.remainingAmount)}
                      </span>{" "}
                      ج.م
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-24 hidden sm:block">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (parseFloat(debt.paidAmount) / parseFloat(debt.totalAmount)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-1">
                    {Math.round(
                      (parseFloat(debt.paidAmount) /
                        parseFloat(debt.totalAmount)) *
                        100,
                    )}
                    %
                  </p>
                </div>

                {/* Action */}
                {debt.status !== "paid" && (
                  <button
                    onClick={() => {
                      setPayingId(payingId === debt.id ? null : debt.id);
                      setPayAmount("");
                      setPayError("");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition flex-shrink-0"
                  >
                    <MdPayment size={14} />
                    دفع
                  </button>
                )}
              </div>

              {/* Inline pay form */}
              {payingId === debt.id && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={payAmount}
                        onChange={(e) => {
                          setPayAmount(e.target.value);
                          setPayError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handlePay(debt)}
                        min={1}
                        max={parseFloat(debt.remainingAmount)}
                        placeholder={`أقصى ${fmtNum(debt.remainingAmount)} ج.م`}
                        className="w-full text-gray-600 text-sm border border-gray-200 rounded-xl px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-white"
                        autoFocus
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        ج.م
                      </span>
                    </div>
                    <button
                      onClick={() => setPayAmount(String(debt.remainingAmount))}
                      className="text-xs px-2.5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 transition whitespace-nowrap"
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => handlePay(debt)}
                      disabled={payLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
                    >
                      {payLoading ? "..." : "تأكيد"}
                    </button>
                  </div>
                  {payError && (
                    <p className="text-xs text-red-500 mt-1.5">{payError}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
