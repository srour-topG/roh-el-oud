import React, { useEffect, useState } from "react";
import axios from "axios";
import { LoadingSpinner } from "../pinner";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

function CustomerAttendance({ apiUrl, customerID, subscriptions }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubId, setSelectedSubId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`${apiUrl}/attendance/${customerID}`);
        setData(res.data.attendanceResult || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = data.filter((row) => {
    if (
      selectedSubId !== "all" &&
      String(row.subscriptionID) !== String(selectedSubId)
    )
      return false;
    if (startDate && row.date < `${startDate}T00:00:00`) return false;
    if (endDate && row.date > `${endDate}T23:59:59`) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  );

  return (
    <div className="p-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end mb-5">
        {/* Subscription select */}
        <div className="flex flex-col gap-1 min-w-[180px]">
          <label className="text-xs text-gray-500 font-medium">الاشتراك</label>
          <select
            value={selectedSubId}
            onChange={(e) => {
              setSelectedSubId(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 cursor-pointer focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition"
          >
            <option value="all">كل الاشتراكات</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.packageName} — {s.startDate?.split("T")[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Date range - improved layout */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">من تاريخ</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">إلى تاريخ</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            min={startDate || undefined}
            className="h-9 px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] outline-none transition cursor-pointer"
          />
        </div>

        {/* Clear filters button */}
        {(startDate || endDate || selectedSubId !== "all") && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setSelectedSubId("all");
              setCurrentPage(1);
            }}
            className="h-9 px-4 border border-gray-200 rounded-lg text-xs text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 transition"
          >
            مسح الفلاتر
          </button>
        )}

        {/* Total visits count */}
        <span className="mr-auto text-sm text-gray-500">
          {filtered.length} زيارة
        </span>
      </div>

      {/* Table and pagination (unchanged) */}
      {loading ? (
        <div className="text-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">
                    تاريخ الحضور
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">
                    وقت الدخول
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">
                    الباقة
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">
                    جلسات مستخدمة
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-gray-500">
                    جلسات متبقية
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-400">
                      لا توجد سجلات
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-50 hover:bg-gray-50 transition"
                    >
                      <td className="p-3 text-sm text-gray-700">
                        {row.date?.split("T")[0]}
                      </td>
                      <td className="p-3 text-sm text-gray-500">
                        {row.date?.split("T")[1]?.slice(0, 5) || "—"}
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-md">
                          {row.Subscription?.packageName}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        {row.usedSessions ?? row.Subscription?.usedSessions}
                      </td>
                      <td
                        className="p-3 text-sm font-bold"
                        style={{
                          color:
                            (row.availableSessions ?? 0) === 0
                              ? "#dc2626"
                              : "#16a34a",
                        }}
                      >
                        {row.availableSessions ??
                          row.Subscription?.availableSessions}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">
                عرض {(currentPage - 1) * perPage + 1}–
                {Math.min(currentPage * perPage, filtered.length)} من{" "}
                {filtered.length}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition p-0 leading-none"
                >
                  <FaChevronRight size={12} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        p === currentPage
                          ? "bg-[#1e3a8a] text-white shadow"
                          : "border border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition p-0 leading-none"
                >
                  <FaChevronLeft size={12} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CustomerAttendance;
