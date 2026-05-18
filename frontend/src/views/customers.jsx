import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Make sure to install this: npm install xlsx
import {
  IoPeople,
  IoMale,
  IoFemale,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoSearch,
  IoPersonCircleOutline,
  IoDownloadOutline,
  IoPrintOutline,
  IoFilterOutline,
  IoChevronDown,
} from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ImageWithAuth from "../components/ImageWithAuth";
import { useAuth } from "../context/AuthContext";
import { maskMobile } from "../utils/maskFemale";
import DebtBadge, { useCustomerDebt } from "../components/debtBadge";
import CustomerRow from "../components/customerRow";

// ---------- Print Styles ----------
// These styles hide the UI elements when printing, showing only the table
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #printable-area, #printable-area * {
      visibility: visible;
    }
    #printable-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    th, td {
      border: 1px solid #ddd !important;
      padding: 8px !important;
      text-align: right !important;
    }
    th {
      background-color: #f3f4f6 !important;
      -webkit-print-color-adjust: exact;
    }
  }
`;

// ---------- Stats Card Component ----------
const StatsCard = ({ title, value, icon: Icon, color, periodLabel }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      {periodLabel && <p className="text-xs text-gray-400">{periodLabel}</p>}
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={24} />
    </div>
  </div>
);

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

// ---------- Main Component ----------
function Customers() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { role } = useAuth();

  // Data & UI State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats State
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCount: 0,
    inactiveCount: 0,
    newInPeriod: 0,
  });
  const [viewMode, setViewMode] = useState("customers");

  const today = new Date().toISOString().split("T")[0];

  const getCustomerStatus = (customer) => {
    const activeSub = customer.Subscriptions?.find(
      (sub) => sub.status === "active",
    );
    if (!activeSub)
      return {
        type: "inactive",
        label: "غير نشط",
        color: "#6b7280",
        bg: "#f3f4f6",
      };

    const sessionsLeft = activeSub.availableSessions;
    const endDate = activeSub.endDate;

    if (sessionsLeft === 0 || endDate < today)
      return { type: "ended", label: "منتهي", color: "#dc2626", bg: "#fef2f2" };
    if (sessionsLeft <= 2)
      return {
        type: "soon",
        label: `تبقى ${sessionsLeft} جلسة`,
        color: "#d97706",
        bg: "#fffbeb",
      };

    return { type: "active", label: "نشط", color: "#16a34a", bg: "#f0fdf4" };
  };

  // Derived state
  const hasActiveFilters = useMemo(
    () => searchTerm !== "" || genderFilter !== "all" || statusFilter !== "all",
    [searchTerm, genderFilter, statusFilter],
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setGenderFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  }, []);

  // Fetch Data (customers or visitors)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === "customers") {
        const params = {
          page: currentPage,
          customerName: searchTerm,
          customerCode: isNaN(parseInt(searchTerm))
            ? null
            : parseInt(searchTerm),
          gender: genderFilter,
          status: statusFilter,
        };
        const res = await axios.get(`${apiUrl}/customers`, { params });
        setData(res.data.customers);
        setTotalPages(res.data.totalPages);
        setTotalItems(res.data.totalItems);
        setStats({
          totalCustomers: res.data.totalCustomers,
          activeCount: res.data.activeCount,
          inactiveCount: res.data.inactiveCount,
          newInPeriod: res.data.newInPeriod,
        });
      } else {
        // Visitors mode
        const params = {
          page: currentPage,
          gender: genderFilter,
          search: searchTerm || undefined,
        };
        const res = await axios.get(`${apiUrl}/guests`, { params });
        setData(res.data.guests);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.totalCount);
        setStats({
          totalCustomers: 0,
          activeCount: 0,
          inactiveCount: 0,
          newInPeriod: res.data.pagination.totalCount,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, currentPage, searchTerm, genderFilter, statusFilter, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const hasActiveSubscription = useCallback((customer) => {
    return customer.Subscriptions?.some((sub) => sub.status === "active");
  }, []);

  // Export to Excel (depends on viewMode)
  const exportToExcel = () => {
    let worksheetData;
    if (viewMode === "customers") {
      worksheetData = data.map((row) => ({
        الكود: row.id,
        الاسم: row.name,
        الهاتف: maskMobile(row.mobile, role, row.gender),
        الجنس: row.gender,
        الحالة: hasActiveSubscription(row) ? "نشط" : "غير نشط",
        "تاريخ الانضمام": new Date(row.createdAt).toLocaleDateString("ar-EG"),
      }));
    } else {
      worksheetData = data.map((row) => ({
        الكود: row.id,
        الاسم: row.name,
        الهاتف: maskMobile(row.mobile, role, row.gender),
        الجنس: row.gender,
        "سعر الحصة": `${row.sessionPrice} ج.م`,
        "تاريخ الحضور": new Date(row.attendedAt).toLocaleDateString("ar-EG"),
      }));
    }
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    const sheetName = viewMode === "customers" ? "العملاء" : "الزوار";
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${sheetName}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper to switch view mode
  const switchViewMode = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    // Reset status filter when switching to visitors (not applicable)
    if (mode === "visitors") {
      setStatusFilter("all");
    }
  };

  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 no-print">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">العملاء</h1>
              {/* Toggle Buttons */}
              <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => switchViewMode("customers")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === "customers"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  العملاء
                </button>
                <button
                  onClick={() => switchViewMode("visitors")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                    viewMode === "visitors"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  الزوار
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <IoDownloadOutline size={18} />
                تحميل Excel
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
              >
                <IoPrintOutline size={18} />
                طباعة
              </button>
            </div>
          </div>

          {/* Stats Cards - only for customers mode */}
          {viewMode === "customers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 no-print">
              <StatsCard
                title="إجمالي الأعضاء"
                value={stats.totalCustomers}
                icon={IoPeople}
                color="bg-blue-100 text-blue-600"
              />
              <StatsCard
                title="نشط"
                value={stats.activeCount}
                icon={IoCheckmarkCircle}
                color="bg-green-100 text-green-600"
              />
              <StatsCard
                title="غير نشط"
                value={stats.inactiveCount}
                icon={IoCloseCircle}
                color="bg-red-100 text-red-600"
              />
              <StatsCard
                title="جدد خلال الفترة"
                value={stats.newInPeriod}
                icon={IoPeople}
                color="bg-purple-100 text-purple-600"
                periodLabel={periodLabel}
              />
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 no-print flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <IoSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-2.5 pr-10 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-full focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-shadow focus:shadow-md"
                placeholder={
                  viewMode === "customers"
                    ? "بحث بالاسم أو الكود..."
                    : "بحث بالاسم..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter - only for customers */}
              {viewMode === "customers" && (
                <div className="relative w-40">
                  <select
                    className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-8"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">كل الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-500">
                    <IoChevronDown size={14} />
                  </div>
                </div>
              )}

              {/* Gender Filter */}
              <div className="relative w-40">
                <select
                  className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-8"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option value="all">كل الأجناس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-500">
                  <IoChevronDown size={14} />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm font-medium px-2"
                >
                  <IoFilterOutline />
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div
            id="printable-area"
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                {/* Table header - conditional based on viewMode */}
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  {viewMode === "customers" ? (
                    <tr>
                      <th className="px-6 py-4 font-semibold text-center">
                        الكود
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الاسم
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الهاتف
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الجنس
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الحالة
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        تاريخ الانضمام
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 font-semibold text-center">#</th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الاسم
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الهاتف
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        الجنس
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        سعر الحصة
                      </th>
                      <th className="px-6 py-4 font-semibold text-center">
                        تاريخ الحضور
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={viewMode === "customers" ? 6 : 6}
                        className="text-center py-8 text-gray-500"
                      >
                        جاري التحميل...
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan={viewMode === "customers" ? 6 : 6}
                        className="text-center py-12 text-gray-500"
                      >
                        لا توجد بيانات مطابقة
                      </td>
                    </tr>
                  ) : viewMode === "customers" ? (
                    // Customers rows
                    data.map((row) => {
                      return (
                        <CustomerRow
                          key={row.id}
                          row={row}
                          getCustomerStatus={getCustomerStatus}
                          navigate={navigate}
                          role={role}
                        />
                      );
                    })
                  ) : (
                    // Visitors rows
                    data.map((row) => (
                      <tr
                        key={row.id}
                        className="bg-white hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 font-medium text-center text-gray-900">
                          {row.id}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-800">
                          {row.name}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {row.mobile
                            ? maskMobile(row.mobile, role, row.gender)
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {row.gender === "ذكر" ? (
                              <>
                                <IoMale color="#3b82f6" />
                                <span className="text-xs text-gray-600">
                                  ذكر
                                </span>
                              </>
                            ) : (
                              <>
                                <IoFemale color="#ec4899" />
                                <span className="text-xs text-gray-600">
                                  أنثى
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-blue-600">
                          {row.sessionPrice} ج.م
                        </td>
                        <td className="px-6 py-4 text-center text-gray-500 text-sm">
                          {new Date(row.attendedAt).toLocaleDateString("ar-EG")}
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
    </>
  );
}

export default Customers;
