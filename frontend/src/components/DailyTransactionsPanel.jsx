import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MdRefresh,
  MdReceipt,
  MdMoneyOff,
  MdAttachMoney,
  MdShoppingCart,
  MdPeople,
  MdSubscriptions,
} from "react-icons/md";
import { FaBoxOpen, FaHandHoldingUsd } from "react-icons/fa";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const apiUrl = import.meta.env.VITE_API_URL;

const fmtNum = (n) =>
  Number(n || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

// أيقونات حسب نوع المعاملة
const getIcon = (category, subType) => {
  if (category === "expense") return <MdMoneyOff className="text-red-500" />;
  if (category === "withdrawal")
    return <MdMoneyOff className="text-orange-500" />;
  switch (subType) {
    case "subscription":
      return <MdSubscriptions className="text-blue-500" />;
    case "product":
      return <FaBoxOpen className="text-emerald-500" />;
    case "guest":
      return <MdPeople className="text-violet-500" />;
    case "stockPurchase":
      return <FaHandHoldingUsd className="text-orange-500" />;
    case "return":
      return <MdRefresh className="text-yellow-500" />;
    default:
      return <MdAttachMoney className="text-green-500" />;
  }
};

const getTypeLabel = (category, subType) => {
  if (category === "expense") return "مصروف";
  if (category === "withdrawal") return "سحب";
  if (category === "return") return "مرتجع";
  switch (subType) {
    case "subscription":
      return "اشتراك";
    case "product":
      return "مبيعات منتج";
    case "guest":
      return "زائر";
    case "stockPurchase":
      return "شراء مخزون";
    case "debt_payment":
      return "دين";
    default:
      return "إيراد";
  }
};

export default function DailyTransactionsPanel({
  startDate,
  endDate,
  onRefreshSummary,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const fetchAllTransactions = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      // 1. المصروفات العادية (التي أضافها المستخدم)
      let expenses = [];
      try {
        const expensesRes = await axios.get(`${apiUrl}/expenses`, {
          params: { startDate, endDate },
        });
        expenses = (expensesRes.data.expenses || []).map((exp) => ({
          id: `exp-${exp.id}`,
          date: exp.createdAt,
          type: "expense",
          subType: exp.type,
          description: exp.type,
          amount: parseFloat(exp.value),
          reference: exp.id,
        }));
      } catch (e) {
        console.error("❌ فشل جلب المصروفات:", e);
      }

      // 2. المبيعات (الإيرادات والمرتجعات)
      let productSales = [];
      try {
        const overviewRes = await axios.get(
          `${apiUrl}/sales/finance-overview`,
          {
            params: { startDate, endDate, limit: 2000 },
          },
        );

        const transactions = overviewRes.data.transactions || [];

        productSales = transactions
          .map((trx) => {
            const amount = Math.abs(parseFloat(trx.amount));
            const isSale = trx.type === "SALE";
            const isDebtPayment = trx.type === "DEBT_PAYMENT";
            const isReturn = trx.type === "RETURN";

            if (isSale || isDebtPayment) {
              return {
                id: `${trx.type.toLowerCase()}-${trx.id}`,
                date: trx.createdAt,
                type: "income",
                subType: isDebtPayment ? "debt_payment" : "product",
                description: trx.notes || `فاتورة ${trx.invoiceNumber}`,
                amount: amount,
                reference: trx.sourceId,
              };
            }

            if (isReturn) {
              return {
                id: `return-${trx.id}`,
                date: trx.createdAt,
                type: "return",
                subType: "return",
                description: trx.notes || `مرتجع فاتورة ${trx.invoiceNumber}`,
                amount: amount,
                reference: trx.sourceId,
              };
            }

            return null; 
          })
          .filter(Boolean);

        // console.log("📊 Transactions loaded:", productSales);
      } catch (e) {
        console.error("❌ فشل جلب المعاملات المالية:", e);
      }

      // 3. إضافات المخزون (شراء منتجات) -> مصروف موجب
      let stockAdditions = [];
      try {
        const additionsRes = await axios.get(
          `${apiUrl}/products/stock/movements`,
          {
            params: {
              type: "add",
              startDate,
              endDate,
              limit: 2000,
            },
          },
        );
        stockAdditions = (additionsRes.data.movements || []).map((mov) => ({
          id: `stockadd-${mov.id}`,
          date: mov.date,
          type: "expense",
          subType: "stockPurchase",
          description: `شراء منتج: ${mov.Product?.name || `ID ${mov.productID}`}`,
          amount: mov.quantity * mov.unitPrice,
          quantity: mov.quantity,
          unitPrice: mov.unitPrice,
          reference: mov.id,
        }));
      } catch (e) {
        console.warn("فشل جلب حركات إضافة المخزون", e);
      }

      // 4. سحب المخزون (غير المبيعات) -> مصروف سالب (يُطرح من الإجمالي)
      let stockWithdrawals = [];
      try {
        const withdrawalsRes = await axios.get(
          `${apiUrl}/products/stock/movements`,
          {
            params: {
              type: "remove",
              startDate,
              endDate,
              limit: 2000,
            },
          },
        );
        stockWithdrawals = (withdrawalsRes.data.movements || [])
          .filter((mov) => mov.notes !== "بيع كاشير")
          .map((mov) => {
            const value = mov.quantity * mov.unitPrice;
            return {
              id: `stockwith-${mov.id}`,
              date: mov.date,
              type: "withdrawal", // نوع خاص للسحب
              subType: "stockWithdrawal",
              description: `سحب: ${mov.notes || "بدون ملاحظة"} – ${mov.Product?.name || `ID ${mov.productID}`}`,
              amount: -value, // سالب ليُطرح من إجمالي المصروفات
              quantity: mov.quantity,
              unitPrice: mov.unitPrice,
              reference: mov.id,
            };
          });
      } catch (e) {
        console.warn("فشل جلب حركات السحب من المخزون", e);
      }

      // دمج جميع المعاملات
      const all = [
        ...expenses,
        ...productSales,
        ...stockAdditions,
        ...stockWithdrawals,
      ];
      all.sort((a, b) => new Date(b.date) - new Date(a.date));

      // حساب الإيرادات (صافي: دخل - مرتجعات)
      const incomeTotal =
        all
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0) -
        all
          .filter((t) => t.type === "return")
          .reduce((sum, t) => sum + t.amount, 0);

      // حساب المصروفات (يشمل السحوبات السالبة فتقلل الإجمالي)
      const expenseTotal = all
        .filter((t) => t.type === "expense" || t.type === "withdrawal")
        .reduce((sum, t) => sum + t.amount, 0);

      setTransactions(all);
      setTotalIncome(incomeTotal);
      setTotalExpense(expenseTotal);
    } catch (err) {
      console.error("خطأ في جلب المعاملات", err);
      setTransactions([]);
      setTotalIncome(0);
      setTotalExpense(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchAllTransactions();
  }, [fetchAllTransactions]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50 flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-800">
          كشف المعاملات المالية
        </h3>
        <button
          onClick={() => {
            fetchAllTransactions();
            onRefreshSummary?.();
          }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MdRefresh size={16} />
        </button>
      </div>

      {/* ملخص الوارد والمدفوع */}
      <div className="grid grid-cols-2 gap-3 px-5 pt-3 pb-2">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xl text-emerald-600 font-medium">إجمالي الوارد</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {fmtNum(totalIncome)} ج.م
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xl text-red-600 font-medium">إجمالي المدفوع</p>
          <p className="text-xl font-bold text-red-700 mt-1">
            {fmtNum(totalExpense)} ج.م
          </p>
        </div>
      </div>

      {/* قائمة المعاملات */}
      <div className="flex-1 overflow-y-auto px-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-100 h-16 rounded-xl"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MdReceipt size={48} className="text-gray-300 mb-3" />
            <p className="text-lg text-gray-400">
              لا توجد معاملات في هذه الفترة
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 flex-shrink-0">
                      {getIcon(t.type, t.subType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                            t.type === "income"
                              ? "bg-green-100 text-green-700"
                              : t.type === "expense"
                                ? "bg-red-100 text-red-700"
                                : t.type === "withdrawal"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {getTypeLabel(t.type, t.subType)}
                        </span>
                        <span className="text-sm text-gray-400">
                          {format(new Date(t.date), "hh:mm a", { locale: ar })}
                        </span>
                      </div>
                      <p className="text-base text-gray-700 mt-1 truncate">
                        {t.description}
                      </p>
                      {t.quantity && (
                        <p className="text-sm text-gray-400 mt-0.5">
                          الكمية: {t.quantity} × {fmtNum(t.unitPrice)} ج.م
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-bold flex-shrink-0 ${
                      t.type === "income"
                        ? "text-emerald-600"
                        : t.type === "expense"
                          ? "text-red-500"
                          : t.type === "withdrawal"
                            ? "text-orange-600"
                            : "text-yellow-600"
                    }`}
                  >
                    {t.type === "income"
                      ? "+"
                      : t.type === "expense"
                        ? "-"
                        : t.type === "withdrawal"
                          ? "⊖"
                          : "↺"}{" "}
                    {fmtNum(Math.abs(t.amount))} ج.م
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
