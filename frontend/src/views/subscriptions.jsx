import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  IoSearch,
  IoFilterOutline,
  IoChevronDown,
  IoCardOutline,
  IoCheckmarkCircle,
  IoArchiveOutline,
  IoReturnDownBack,
  IoTimeOutline,
} from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { format } from "date-fns";

// ---------- Custom Date Input ----------
const CustomDateInput = ({ value, onClick, placeholder }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full px-3 py-2 text-sm text-right border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    {value || placeholder}
  </button>
);

// ---------- Stats Card ----------
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={22} />
    </div>
  </div>
);

// ---------- Pagination ----------
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
    <div className="flex items-center justify-center gap-1 p-4 border-t border-gray-100">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
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
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <FaChevronLeft size={12} />
      </button>
    </div>
  );
};

// ---------- Main Component ----------
function Subscriptions() {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    archived: 0,
    returned: 0,
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      };
      const res = await axios.get(`${apiUrl}/subscriptions`, { params });
      console.log("ressss : ", res.data);
      setSubscriptions(res.data.subscriptions);
      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
      setStats({
        total: res.data.totalCount,
        active: res.data.activeCount,
        inactive: res.data.inactiveCount,
        archived: res.data.archivedCount,
        returned: res.data.returnedCount,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, currentPage, debouncedSearch, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handlePageChange = (page) => setCurrentPage(page);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== "all" || startDate || endDate;

  const getStatusBadge = (status) => {
    const map = {
      active: {
        label: "نشط",
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
      },
      inactive: {
        label: "غير نشط",
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-200",
        dot: "bg-orange-500",
      },
      archived: {
        label: "مؤرشف",
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200",
      },
      deleted: {
        label: "مرتجع",
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-200",
      },
      returned: {
        label: "مرتجع",
        bg: "bg-purple-100",
        text: "text-purple-800",
        border: "border-purple-200",
      },
    };
    const s = map[status] || {
      label: status,
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}
      >
        <span
          className={`w-2 h-2 me-1 rounded-full ${status === "active" ? "bg-green-500" : status === "archived" ? "bg-gray-500" : status === "inactive" ? "bg-orange-500" : "bg-purple-500"}`}
        ></span>
        {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">الاشتراكات</h1>
          <p className="text-gray-500 text-sm mt-1">
            متابعة وإدارة جميع الاشتراكات
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
          <StatsCard
            title="إجمالي الاشتراكات"
            value={stats.total}
            icon={IoCardOutline}
            color="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="نشطة"
            value={stats.active}
            icon={IoCheckmarkCircle}
            color="bg-green-100 text-green-600"
          />
          <StatsCard
            title="غير نشطة"
            value={stats.inactive}
            icon={IoTimeOutline}
            color="bg-orange-100 text-orange-600"
          />
          <StatsCard
            title="مؤرشفة"
            value={stats.archived}
            icon={IoArchiveOutline}
            color="bg-gray-100 text-gray-600"
          />
          <StatsCard
            title="مرتجعة"
            value={stats.returned}
            icon={IoReturnDownBack}
            color="bg-purple-100 text-purple-600"
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                بحث
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <IoSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full p-2.5 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="اسم العميل أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-44">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-8"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">كل الحالات</option>
                  <option value="active">نشطة</option>
                  <option value="inactive">غير نشطة</option>
                  <option value="archived">مؤرشفة</option>
                  <option value="deleted">مرتجعة</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-500">
                  <IoChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="w-44">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                من تاريخ
              </label>
              <DatePicker
                selected={startDate}
                onChange={setStartDate}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="اختر التاريخ"
                dateFormat="yyyy-MM-dd"
                isClearable
                customInput={<CustomDateInput placeholder="من تاريخ" />}
              />
            </div>
            <div className="w-44">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                إلى تاريخ
              </label>
              <DatePicker
                selected={endDate}
                onChange={setEndDate}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="اختر التاريخ"
                dateFormat="yyyy-MM-dd"
                isClearable
                customInput={<CustomDateInput placeholder="إلى تاريخ" />}
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="h-[42px] px-4 rounded-lg text-sm font-medium border border-gray-200 bg-white text-red-500 hover:bg-red-50 transition flex items-center gap-1"
              >
                <IoFilterOutline />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-center">الكود</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    العميل
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    الباقة
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    مستخدم
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">متبقي</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    تاريخ البداية
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    تاريخ النهاية
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      لا توجد اشتراكات مطابقة
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-center text-gray-900">
                        #{sub.customerID}
                      </td>
                      <td className="px-6 py-4 text-start font-medium text-gray-800">
                        {sub.Customer?.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {sub.packageName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {sub.usedSessions}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            sub.availableSessions === 0
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {sub.availableSessions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {sub.startDate}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {sub.endDate}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getStatusBadge(sub.status)}
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
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Subscriptions;
