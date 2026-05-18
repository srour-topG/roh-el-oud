import { Select } from "flowbite-react";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
} from "date-fns";
import { ar } from "date-fns/locale";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

// ---------- Pagination Component ----------
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 p-4 border-t border-gray-100 no-print">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition p-0 leading-none"
      >
        <FaChevronRight size={12} />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition p-0 leading-none"
      >
        <FaChevronLeft size={12} />
      </button>
    </div>
  );
};

function Finance() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [financeData, setFinanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Month/Year selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month"); // "month" or "year"

  // Pagination states for each table
  const [subCurrentPage, setSubCurrentPage] = useState(1);
  const [returnCurrentPage, setReturnCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Compute start and end dates based on viewMode and selectedDate
  const startDate =
    viewMode === "month"
      ? format(startOfMonth(selectedDate), "yyyy-MM-dd")
      : format(new Date(selectedDate.getFullYear(), 0, 1), "yyyy-MM-dd");

  const endDate =
    viewMode === "month"
      ? format(endOfMonth(selectedDate), "yyyy-MM-dd")
      : format(new Date(selectedDate.getFullYear(), 11, 31), "yyyy-MM-dd");

  useEffect(() => {
    async function fetchFinance() {
      setLoading(true);
      try {
        const res = await axios.get(
          `${apiUrl}/finance?startDate=${startDate}&endDate=${endDate}`,
        );
        setFinanceData(res.data.result);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchFinance();
  }, [startDate, endDate]);

  // Filter data by type
  const subscriptions = financeData.filter((o) => o.type === "subscription");
  const returns = financeData.filter((o) => o.type === "return");

  // Calculate totals
  const sumIncome = subscriptions.reduce((sum, obj) => sum + obj.value, 0);
  const sumReturn = returns.reduce((sum, obj) => sum + obj.value, 0);
  const netProfit = sumIncome - sumReturn;

  // Pagination logic
  const totalSubPages = Math.ceil(subscriptions.length / itemsPerPage);
  const totalReturnPages = Math.ceil(returns.length / itemsPerPage);

  const paginatedSubs = subscriptions.slice(
    (subCurrentPage - 1) * itemsPerPage,
    subCurrentPage * itemsPerPage,
  );
  const paginatedReturns = returns.slice(
    (returnCurrentPage - 1) * itemsPerPage,
    returnCurrentPage * itemsPerPage,
  );

  // Generate month options for select
  const monthOptions = eachMonthOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date(),
  })
    .map((date) => ({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy", { locale: ar }),
    }))
    .reverse();

  // Year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">المالية</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            نوع العرض
          </label>
          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="w-32"
          >
            <option value="month">شهري</option>
            <option value="year">سنوي</option>
          </Select>
        </div>

        {viewMode === "month" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الشهر
            </label>
            <Select
              value={format(selectedDate, "yyyy-MM")}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-");
                setSelectedDate(
                  new Date(parseInt(year), parseInt(month) - 1, 1),
                );
              }}
              className="w-48"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              السنة
            </label>
            <Select
              value={String(selectedDate.getFullYear())}
              onChange={(e) =>
                setSelectedDate(new Date(parseInt(e.target.value), 0, 1))
              }
              className="w-32"
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <p className="text-gray-500 text-sm">إجمالي الاشتراكات</p>
          <p className="text-2xl font-bold text-blue-600">
            {sumIncome.toLocaleString("ar-EG")} ج.م
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <p className="text-gray-500 text-sm">إجمالي المرتجع</p>
          <p className="text-2xl font-bold text-red-600">
            {sumReturn.toLocaleString("ar-EG")} ج.م
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border border-gray-100">
          <p className="text-gray-500 text-sm">صافي الربح</p>
          <p className="text-2xl font-bold text-green-600">
            {netProfit.toLocaleString("ar-EG")} ج.م
          </p>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">الاشتراكات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-center">الكود</th>
                <th className="px-6 py-4 font-semibold text-start">الاسم</th>
                <th className="px-6 py-4 font-semibold text-center">الباقة</th>
                <th className="px-6 py-4 font-semibold text-center">المدفوع</th>
                <th className="px-6 py-4 font-semibold text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : paginatedSubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    لا توجد بيانات مطابقة
                  </td>
                </tr>
              ) : (
                paginatedSubs.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white hover:bg-gray-50 transition no-print-row"
                  >
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {" "}
                      # {row.Subscription.Customer?.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-start text-gray-900">
                      {row.Subscription.Customer?.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {row.Subscription.packageName}
                    </td>
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {row.value.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {row.date.split("T")[0]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalSubPages > 1 && (
          <div className="flex justify-center p-4">
            <Pagination
              currentPage={subCurrentPage}
              totalPages={totalSubPages}
              onPageChange={setSubCurrentPage}
              showIcons
            />
          </div>
        )}
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-700">المرتجعات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-center">الكود</th>
                <th className="px-6 py-4 font-semibold text-center">الاسم</th>
                <th className="px-6 py-4 font-semibold text-center">الباقة</th>
                <th className="px-6 py-4 font-semibold text-center">المدفوع</th>
                <th className="px-6 py-4 font-semibold text-center">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    لا توجد بيانات مطابقة
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white hover:bg-gray-50 transition no-print-row"
                  >
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {" "}
                      # {row.Subscription.Customer?.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-start text-gray-900">
                      {row.Subscription.Customer?.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {row.Subscription.packageName}
                    </td>
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {row.value.toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="px-6 py-4 font-medium text-center text-gray-900">
                      {row.date.split("T")[0]}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalReturnPages > 1 && (
          <div className="flex justify-center p-4">
            <Pagination
              currentPage={returnCurrentPage}
              totalPages={totalReturnPages}
              onPageChange={setReturnCurrentPage}
              showIcons
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Finance;
