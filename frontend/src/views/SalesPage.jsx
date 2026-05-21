import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

import {
  MdSearch,
  MdClose,
  MdReceiptLong,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdPayments,
  MdPerson,
  MdCalendarToday,
  MdTrendingUp,
  MdAttachMoney,
  MdWarningAmber,
  MdInventory2,
} from "react-icons/md";

import SaleDetailsModal from "../components/modals/SaleDetailsModal";

const apiUrl = import.meta.env.VITE_API_URL;

const LIMIT = 10;

const statusStyles = {
  PAID: {
    label: "مدفوعة",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },

  PARTIAL: {
    label: "جزئية",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },

  DEBT: {
    label: "دين",
    className: "bg-red-50 text-red-700 border border-red-200",
  },

  RETURNED: {
    label: "مرتجعة",
    className: "bg-purple-50 text-purple-700 border border-purple-200",
  },

  PARTIALLY_RETURNED: {
    label: "مرتجع جزئي",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(`${apiUrl}/sales`, {
        params: {
          page,
          limit: LIMIT,
          search,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        },
      });

      setSales(res.data.sales);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.total);
    } catch (e) {
      showToast("حدث خطأ أثناء تحميل المبيعات", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const openSale = async (id) => {
    try {
      const res = await axios.get(`${apiUrl}/sales/${id}`);

      setSelectedSale(res.data);
      setShowModal(true);
    } catch (e) {
      showToast("فشل تحميل الفاتورة", "error");
    }
  };

  const closeModal = () => {
    setSelectedSale(null);
    setShowModal(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const stats = useMemo(() => {
    let revenue = 0;
    let paid = 0;
    let debts = 0;
    let returned = 0;

    sales.forEach((sale) => {
      revenue += Number(sale.totalPrice || 0);
      paid += Number(sale.paidAmount || 0);
      debts += Number(sale.remainingAmount || 0);
      returned += Number(sale.returnedAmount || 0);
    });

    return {
      revenue,
      paid,
      debts,
      returned,
    };
  }, [sales]);

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* TOAST */}

      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999]
          px-5 py-3 rounded-2xl shadow-2xl text-white font-semibold
          animate-in fade-in slide-in-from-top-2 duration-300
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* HEADER */}

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              إدارة المبيعات
            </h1>

            <p className="text-slate-500 mt-1">
              متابعة الفواتير والمدفوعات والمرتجعات
            </p>
          </div>

          {/* SEARCH */}
        </div>

        {/* KPI CARDS */}

        <div className="flex  items-start justify-between gap-4">
          <div className="relative w-full lg:w-96">
            <MdSearch
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={22}
            />

            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث برقم الفاتورة..."
              className="
              w-full h-12 rounded-2xl border border-slate-200
              bg-white pr-12 pl-12 text-base
              outline-none transition-all
              focus:border-blue-400
              focus:ring-4 focus:ring-blue-100
              text-gray-600
            "
            />

            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="
                absolute left-4 top-1/2 -translate-y-1/2
                text-slate-400 hover:text-slate-700
              "
              >
                <MdClose size={18} />
              </button>
            )}
          </div>
          {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="إجمالي المبيعات"
            value={`${stats.revenue.toLocaleString("ar-EG")} ج.م`}
            icon={<MdTrendingUp size={24} />}
            color="emerald"
          />

          <StatCard
            title="المحصل"
            value={`${stats.paid.toLocaleString("ar-EG")} ج.م`}
            icon={<MdPayments size={24} />}
            color="blue"
          />

          <StatCard
            title="الديون"
            value={`${stats.debts.toLocaleString("ar-EG")} ج.م`}
            icon={<MdWarningAmber size={24} />}
            color="red"
          />

          <StatCard
            title="المرتجعات"
            value={`${stats.returned.toLocaleString("ar-EG")} ج.م`}
            icon={<MdInventory2 size={24} />}
            color="purple"
          />
        </div> */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { key: "ALL", label: "الكل" },
              { key: "PAID", label: "مدفوع" },
              { key: "PARTIAL", label: "جزئي" },
              { key: "DEBT", label: "دين" },
              { key: "RETURNED", label: "مرتجع كلي" },
              {
                key: "PARTIALLY_RETURNED",
                label: "مرتجع جزئي",
              },
            ].map((item) => {
              const active = statusFilter === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setPage(1);
                    setStatusFilter(item.key);
                  }}
                  className={`
          px-4 py-2 rounded-xl text-sm font-semibold transition-all
          ${
            active
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }
        `}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLE */}

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* TOP BAR */}

          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-slate-800">الفواتير</h2>

              <p className="text-sm text-slate-500 mt-1">{totalCount} فاتورة</p>
            </div>

            <div className="text-sm text-slate-400">
              الصفحة {page} من {totalPages}
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-slate-500 text-sm">
                  <th className="px-6 py-4 text-right font-bold">الفاتورة</th>
                  <th className="px-6 py-4 text-right font-bold">العميل</th>
                  <th className="px-6 py-4 text-right font-bold">الحالة</th>
                  <th className="px-6 py-4 text-right font-bold">المدفوع</th>
                  <th className="px-6 py-4 text-right font-bold">الإجمالي</th>
                  <th className="px-6 py-4 text-right font-bold">التاريخ</th>
                  <th className="px-6 py-4 text-right font-bold"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7}>
                        <div className="h-20 border-b border-slate-100 bg-slate-50/50" />
                      </td>
                    </tr>
                  ))
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="flex flex-col items-center">
                        <MdReceiptLong
                          size={52}
                          className="text-slate-200 mb-3"
                        />

                        <p className="font-bold text-slate-500">
                          لا توجد فواتير
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => {
                    const total = Number(sale.totalPrice || 0);
                    const paid = Number(sale.paidAmount || 0);
                    const status = statusStyles[sale.status];
                    const percent = total
                      ? Math.round((paid / total) * 100)
                      : 0;

                    return (
                      <tr
                        key={sale.id}
                        onClick={() => openSale(sale.id)}
                        className="
                        border-b border-slate-100
                        hover:bg-slate-50
                        transition-all
                        cursor-pointer
                      "
                      >
                        {/* INVOICE */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="
                              w-11 h-11 rounded-2xl
                              bg-blue-50 text-blue-600
                              flex items-center justify-center
                            "
                            >
                              <MdReceiptLong size={22} />
                            </div>

                            <div>
                              <p className="font-black text-slate-800">
                                #{sale.invoiceNumber}
                              </p>

                              {/* <p className="text-xs text-slate-400 mt-1">
                                ID: {sale.id}
                              </p> */}
                            </div>
                          </div>
                        </td>

                        {/* CUSTOMER */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div
                              className="
                              w-10 h-10 rounded-full
                              bg-slate-100
                              flex items-center justify-center
                              text-slate-500 font-bold
                            "
                            >
                              {sale.customerName ? (
                                sale.customerName.charAt(0)
                              ) : (
                                <MdPerson size={18} />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-700">
                                {sale.customerName || "عميل نقدي"}
                              </p>

                              <p className="text-xs text-slate-400">
                                {sale.customerPhone || "بدون رقم"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-5">
                          <span
                            className={`
                            px-3 py-1.5 rounded-full text-xs font-bold
                            ${status.className}
                          `}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* PAID */}

                        <td className="px-6 py-5 min-w-[180px]">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-bold text-emerald-600">
                                {paid.toLocaleString("ar-EG")} ج.م
                              </span>

                              <span className="text-slate-400">{percent}%</span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{
                                  width: `${percent}%`,
                                }}
                                className="
                                h-full rounded-full bg-emerald-500
                              "
                              />
                            </div>
                          </div>
                        </td>

                        {/* TOTAL */}

                        <td className="px-6 py-5">
                          <div>
                            <p className="font-black text-slate-800">
                              {total.toLocaleString("ar-EG")} ج.م
                            </p>

                            {sale.remainingAmount > 0 && (
                              <p className="text-xs text-red-500 mt-1">
                                متبقي{" "}
                                {Number(sale.remainingAmount).toLocaleString(
                                  "ar-EG",
                                )}{" "}
                                ج.م
                              </p>
                            )}
                          </div>
                        </td>

                        {/* DATE */}

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-500">
                            <MdCalendarToday size={16} />

                            <div>
                              <p className="text-sm font-medium">
                                {new Date(sale.createdAt).toLocaleDateString(
                                  "ar-EG",
                                )}
                              </p>

                              <p className="text-xs text-slate-400">
                                {new Date(sale.createdAt).toLocaleTimeString(
                                  "ar-EG",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* ACTION */}

                        <td className="px-6 py-5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              openSale(sale.id);
                            }}
                            className="
                            w-10 h-10 rounded-xl
                            bg-slate-100 hover:bg-blue-50
                            text-slate-500 hover:text-blue-600
                            flex items-center justify-center
                            transition-all
                          "
                          >
                            <MdKeyboardArrowLeft size={22} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          {totalPages > 1 && (
            <div
              className="
              flex items-center justify-between
              px-6 py-5 border-t border-slate-100
            "
            >
              <p className="text-sm text-slate-500">
                عرض {(page - 1) * LIMIT + 1} -{" "}
                {Math.min(page * LIMIT, totalCount)}
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="
                  w-10 h-10 rounded-xl border border-slate-200
                  flex items-center justify-center
                  disabled:opacity-40
                  hover:bg-slate-50
                  text-gray-600
                "
                >
                  <MdKeyboardArrowRight size={22} />
                </button>

                <div
                  className="
                  px-4 h-10 rounded-xl bg-blue-600
                  text-white flex items-center justify-center
                  text-sm font-bold
                "
                >
                  {page}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="
                  w-10 h-10 rounded-xl border border-slate-200
                  flex items-center justify-center
                  disabled:opacity-40
                  hover:bg-slate-50
                  text-gray-600
                "
                >
                  <MdKeyboardArrowLeft size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}

      <SaleDetailsModal
        open={showModal}
        sale={selectedSale}
        onClose={closeModal}
        onReturnSuccess={() => {
          fetchSales();

          closeModal();

          showToast("تم إنشاء المرتجع بنجاح");
        }}
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div
      className="
      bg-white rounded-3xl border border-slate-200
      p-5 shadow-sm
    "
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-2">{title}</p>

          <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        </div>

        <div
          className={`
          w-14 h-14 rounded-2xl
          flex items-center justify-center
          ${styles[color]}
        `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
