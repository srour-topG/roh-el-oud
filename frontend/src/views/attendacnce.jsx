import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Spinner,
  Datepicker,
} from "flowbite-react";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaFilter,
  FaMale,
  FaFemale,
  FaTimes,
} from "react-icons/fa";
import { HiOutlineDocumentText } from "react-icons/hi";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat,
  MdPersonAdd,
} from "react-icons/md";
import axios from "axios";
import { format } from "date-fns";
import { formatDateTimeLocal } from "../utils/formatDate";
import { useAttendance } from "../context/AttendanceContext";
import { IoFlash } from "react-icons/io5";
import FastAttendGuestModal from "../components/modals/FastAttendModal";
import DebtBadge from "../components/debtBadge";

function Attendance() {
  const { setOpenModal, refreshKey } = useAttendance(); // use context to open modal

  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState(null);
  const [openFastModal, setOpenFastModal] = useState(false);

  // Stats
  const [todayCount, setTodayCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters - independent
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [gender, setGender] = useState("all");

  // Track which filters are active
  const [activeDateFilter, setActiveDateFilter] = useState(false);
  const [activeGenderFilter, setActiveGenderFilter] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchStats = async (sDate = null, eDate = null) => {
    setStatsLoading(true);
    try {
      const params = {};
      if (sDate) params.startDate = sDate;
      if (eDate) params.endDate = eDate;

      const res = await axios.get(`${apiUrl}/attendance/today-stats`, {
        params,
      });

      setTodayCount(res.data.todayCount);
      setYesterdayCount(res.data.yesterdayCount);
      setChangePercent(res.data.changePercent);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAttendance = async (
    page = 1,
    dateFilter = false,
    genderFilter = false,
    explicitGender = null,
    search = null,
  ) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };

      if (dateFilter && (startDate || endDate)) {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      if (genderFilter) {
        const genderValue = explicitGender !== null ? explicitGender : gender;
        if (genderValue !== "all") {
          params.gender = genderValue;
        }
      }

      if (search && search.trim() !== "") {
        params.search = search.trim();
      }

      const res = await axios.get(`${apiUrl}/attendance`, { params });
      setAttendance(res.data.attendanceResult);
      setCurrentPage(res.data.pagination.currentPage);
      setTotalPages(res.data.pagination.totalPages);
      setTotalCount(res.data.pagination.totalCount);

      if (res.data.activeFilters) {
        setActiveDateFilter(res.data.activeFilters.date);
        setActiveGenderFilter(!!res.data.activeFilters.gender);
        setActiveSearch(!!res.data.activeFilters.search);
      }
    } catch (e) {
      console.error(e);
      setResponse({ statusCode: "500", Message: "فشل تحميل البيانات" });
      setToast(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(null, null);
    fetchAttendance(1, false, false);
  }, [openFastModal, refreshKey]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(false), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchAttendance(
        newPage,
        activeDateFilter,
        activeGenderFilter,
        gender,
        activeSearch ? searchTerm : null,
      );
    }
  };

  const applyDateFilter = () => {
    if (!startDate && !endDate) return;
    setActiveDateFilter(true);
    setCurrentPage(1);
    fetchStats(startDate, endDate);
    fetchAttendance(1, true, activeGenderFilter);
  };

  const applyGenderFilter = (selectedGender) => {
    const newActiveGenderFilter = selectedGender !== "all";
    setGender(selectedGender);
    setActiveGenderFilter(newActiveGenderFilter);
    setCurrentPage(1);
    fetchAttendance(1, activeDateFilter, newActiveGenderFilter, selectedGender);
  };

  const clearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setActiveDateFilter(false);
    setCurrentPage(1);
    fetchStats(null, null);
    fetchAttendance(1, false, activeGenderFilter);
  };

  const clearGenderFilter = () => {
    setGender("all");
    setActiveGenderFilter(false);
    setCurrentPage(1);
    fetchAttendance(1, activeDateFilter, false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearch(false);
    setCurrentPage(1);
    fetchAttendance(1, activeDateFilter, activeGenderFilter, gender, null);
  };

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setGender("all");
    setSearchTerm("");
    setActiveDateFilter(false);
    setActiveGenderFilter(false);
    setActiveSearch(false);
    setCurrentPage(1);
    fetchStats(null, null);
    fetchAttendance(1, false, false, null, null);
  };

  const trendColor =
    changePercent > 0 ? "#16a34a" : changePercent < 0 ? "#dc2626" : "#6b7280";
  const TrendIcon =
    changePercent > 0
      ? MdTrendingUp
      : changePercent < 0
        ? MdTrendingDown
        : MdTrendingFlat;

  const hasAnyFilter = activeDateFilter || activeGenderFilter || activeSearch;

  return (
    <div className="min-h-screen bg-gray-50 p-6 rounded-2xl" dir="rtl">
      {/* Modals and Toasts are now handled by MainLayout */}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">
              سجل الحضور
            </h1>
            <p className="text-gray-500 text-sm">
              متابعة دقيقة لتدفق الأعضاء والأنشطة اليومية
            </p>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setOpenModal(true)}
              className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-lg"
            >
              <FaCheck />
              تسجيل حضور جديد
            </button>
            <button
              onClick={() => setOpenFastModal(true)}
              className="bg-[#962222] hover:bg-[#af3b1e] text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-lg"
            >
              <IoFlash />
              تسجيل حضور سريع
            </button>
            <FastAttendGuestModal
              open={openFastModal}
              onClose={() => setOpenFastModal(false)}
              // onSuccess={() => {
              //   // optional: refresh stats, show toast, etc.
              // }}
            />
          </div>
        </div>

        {/* Stats + Filter row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Filter card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-700">
                <FaFilter className="text-gray-400" size={13} />
                <span className="font-semibold text-sm">تصفية النتائج</span>
              </div>
              {hasAnyFilter && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium transition"
                >
                  <FaTimes size={10} />
                  إلغاء جميع الفلاتر
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">
                  من تاريخ
                </label>
                <div className="flex items-center gap-2">
                  <Datepicker
                    key={`start-${startDate || "empty"}`}
                    value={startDate ? new Date(startDate) : null}
                    onChange={(date) => {
                      if (date) setStartDate(format(date, "yyyy-MM-dd"));
                      else setStartDate("");
                    }}
                    placeholder="اختر التاريخ"
                    className="w-40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">
                  إلى تاريخ
                </label>
                <Datepicker
                  key={`end-${endDate || "empty"}`}
                  value={endDate ? new Date(endDate) : null}
                  onChange={(date) => {
                    if (date) setEndDate(format(date, "yyyy-MM-dd"));
                    else setEndDate("");
                  }}
                  minDate={startDate ? new Date(startDate) : undefined}
                  placeholder="اختر التاريخ"
                  className="w-40"
                />
              </div>

              <button
                onClick={applyDateFilter}
                disabled={!startDate && !endDate}
                className="h-[38px] px-5 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: startDate || endDate ? "#dbeafe" : "#f3f4f6",
                  color: startDate || endDate ? "#1e40af" : "#9ca3af",
                }}
              >
                تطبيق فلتر التاريخ
              </button>

              {activeDateFilter && (
                <button
                  onClick={clearDateFilter}
                  className="h-[38px] px-4 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition flex items-center gap-1"
                >
                  <FaTimes size={12} />
                  إلغاء فلتر التاريخ
                </button>
              )}

              <div className="w-px h-10 bg-gray-200 mx-2" />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">
                  الجنس
                </label>
                <div className="flex gap-1.5">
                  {[
                    { value: "all", label: "الكل" },
                    { value: "male", label: "ذكر", icon: <FaMale size={12} /> },
                    {
                      value: "female",
                      label: "أنثى",
                      icon: <FaFemale size={12} />,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => applyGenderFilter(opt.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2 ${
                        gender === opt.value
                          ? "bg-blue-800 border-blue-800 text-white shadow-md"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-500 font-medium">
                  بحث بالاسم
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="اسم أو كود (العضو \ الزائر)"
                    className="w-48 h-[38px] px-3 rounded-lg border border-gray-200 text-sm text-right text-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (searchTerm.trim()) {
                        setActiveSearch(true);
                        setCurrentPage(1);
                        fetchAttendance(
                          1,
                          activeDateFilter,
                          activeGenderFilter,
                          gender,
                          searchTerm,
                        );
                      } else {
                        // if empty, clear search
                        clearSearch();
                      }
                    }}
                    className="h-[38px] px-4 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    بحث
                  </button>
                  {activeSearch && (
                    <button
                      onClick={clearSearch}
                      className="h-[38px] px-4 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <FaTimes size={12} />
                      إلغاء البحث
                    </button>
                  )}
                </div>
              </div>
            </div>

            {hasAnyFilter && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {activeDateFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    <FaFilter size={10} />
                    فلتر التاريخ: {startDate || "..."}{" "}
                    {endDate ? `إلى ${endDate}` : ""}
                    <button
                      onClick={clearDateFilter}
                      className="hover:text-blue-800"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {activeGenderFilter && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium">
                    <FaFilter size={10} />
                    فلتر الجنس: {gender === "male" ? "ذكر" : "أنثى"}
                    <button
                      onClick={clearGenderFilter}
                      className="hover:text-purple-800"
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats Card */}
          <div
            className="rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "-20px",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.07)",
              }}
            />

            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-blue-200 text-sm mb-1">
                  {activeDateFilter
                    ? startDate === endDate || !endDate
                      ? `حضور يوم ${startDate}`
                      : `الحضور للفترة المحددة`
                    : "إجمالي حضور اليوم"}
                </p>

                {statsLoading ? (
                  <div
                    style={{
                      height: "48px",
                      width: "80px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.15)",
                      animation: "pulse 1.2s infinite",
                    }}
                  />
                ) : (
                  <p className="text-5xl font-bold leading-none mb-1">
                    {todayCount}
                  </p>
                )}

                <p className="text-blue-200 text-xs mt-2">
                  {activeDateFilter ? "زيارة" : "عضو نشط الآن"}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <FaUsers className="text-2xl" />
              </div>
            </div>

            <div
              className="mt-4 pt-4 relative z-10"
              style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendIcon
                    size={16}
                    style={{
                      color: changePercent >= 0 ? "#86efac" : "#fca5a5",
                    }}
                  />
                  <p
                    className="text-xs"
                    style={{
                      color: changePercent >= 0 ? "#86efac" : "#fca5a5",
                    }}
                  >
                    {changePercent > 0 ? "+" : ""}
                    {changePercent}%{" "}
                    {activeDateFilter
                      ? startDate === endDate || !endDate
                        ? "عن اليوم السابق"
                        : "عن الفترة السابقة"
                      : "عن أمس"}
                  </p>
                </div>
                <p className="text-blue-200 text-xs">
                  {activeDateFilter
                    ? startDate === endDate || !endDate
                      ? "اليوم السابق: "
                      : "السابق: "
                    : "أمس: "}
                  <span className="font-semibold text-white">
                    {yesterdayCount}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-slate-700">
              <HiOutlineDocumentText
                className="text-xl"
                style={{ color: "#1e3a8a" }}
              />
              <span className="font-semibold">الزيارات الأخيرة</span>
            </div>
            {hasAnyFilter && (
              <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                فلتر مفعّل
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-center">الكود</th>
                  <th className="px-6 py-4 font-semibold text-center">الإسم</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    موعد الحضور
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    الباقة
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    مستخدم
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">متبقي</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    تاريخ الاشتراك
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    تاريخ الانتهاء
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
                ) : attendance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      لا توجد سجلات حضور
                    </td>
                  </tr>
                ) : (
                  attendance.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition hover:cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-center text-gray-900">
                        {row.customerID ? `#${row.customerID}` : "زائر"}
                      </td>
                      <td className="px-6 py-4 text-start text-gray-800">
                        {row.name}
                        <DebtBadge
                          customerID={row.customerID}
                          size="md"
                          variant="icon-only"
                          className="mx-2"
                        />
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {formatDateTimeLocal(row.date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {row.packageName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {row.usedSessions !== null ? row.usedSessions : "—"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {row.availableSessions !== null ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              row.availableSessions === 0
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {row.availableSessions}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {row.subscriptionStartDate
                          ? row.subscriptionStartDate.split("T")[0]
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {row.subscriptionEndDate
                          ? row.subscriptionEndDate.split("T")[0]
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <p className="text-sm text-gray-500">
              عرض {(currentPage - 1) * 10 + 1}–
              {Math.min(currentPage * 10, totalCount)} من أصل {totalCount} زيارة
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition p-0 leading-none"
              >
                <FaChevronRight size={12} />
              </button>
              {Array.from(
                { length: Math.min(totalPages, 7) },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition p-0"
                  style={{
                    background: currentPage === page ? "#1e3a8a" : "#fff",
                    color: currentPage === page ? "#fff" : "#4b5563",
                    border: currentPage === page ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition p-0 leading-none"
              >
                <FaChevronLeft size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Attendance;
