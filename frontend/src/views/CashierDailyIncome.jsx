import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { MdShoppingCart } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa6";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  addDays,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subYears,
  addYears,
  isSameDay,
} from "date-fns";
import { ar } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const apiUrl = import.meta.env.VITE_API_URL;

function PeriodChart({ data, dataKey, color = "#1e3a8a" }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
        لا توجد بيانات للعرض
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          tickFormatter={(value) => `${value.toLocaleString("ar-EG")} ج.م`}
        />
        <Tooltip
          formatter={(value) => [
            `${value.toLocaleString("ar-EG")} ج.م`,
            "الإيرادات",
          ]}
          contentStyle={{ fontFamily: "inherit", direction: "rtl" }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function CashierDailyIncome() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const { startDate, endDate, displayLabel, chartData, aggregatedData } =
    useMemo(() => {
      const date = currentDate;
      let start, end, label;
      let data = [];
      let aggregated = { revenue: 0, count: 0, items: 0, profit: 0 };

      const groupByPeriod = (movements, getKey) => {
        const groups = {};
        movements.forEach((m) => {
          const key = getKey(new Date(m.date));
          if (!groups[key])
            groups[key] = { revenue: 0, count: 0, items: 0, profit: 0 };
          const product = products.find((p) => p.id === m.productID);
          const cost = product ? product.buyPrice : 0;
          const lineTotal = m.quantity * m.unitPrice;
          const lineProfit = m.quantity * (m.unitPrice - cost);
          groups[key].revenue += lineTotal;
          groups[key].profit += lineProfit;
          groups[key].items += m.quantity;
          groups[key].count += 1;
          aggregated.revenue += lineTotal;
          aggregated.profit += lineProfit;
          aggregated.items += m.quantity;
          aggregated.count += 1;
        });
        return groups;
      };

      switch (period) {
        case "day":
          start = new Date(date);
          start.setHours(0, 0, 0, 0);
          end = new Date(date);
          end.setHours(23, 59, 59, 999);
          label = format(date, "EEEE, d MMMM yyyy", { locale: ar });

          const dayMovements = movements.filter((m) => {
            const d = new Date(m.date);
            return d >= start && d <= end;
          });

          const dayAggregated = { revenue: 0, count: 0, items: 0, profit: 0 };
          dayMovements.forEach((m) => {
            const product = products.find((p) => p.id === m.productID);
            const cost = product ? product.buyPrice : 0;
            const lineTotal = m.quantity * m.unitPrice;
            const lineProfit = m.quantity * (m.unitPrice - cost);
            dayAggregated.revenue += lineTotal;
            dayAggregated.profit += lineProfit;
            dayAggregated.items += m.quantity;
            dayAggregated.count += 1;
          });

          aggregated = dayAggregated;
          break;
        case "week":
          start = startOfWeek(date, { weekStartsOn: 6 }); // السبت
          end = endOfWeek(date, { weekStartsOn: 6 });
          label = `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
          const days = eachDayOfInterval({ start, end });
          const dayGroups = groupByPeriod(
            movements.filter((m) => {
              const d = new Date(m.date);
              return d >= start && d <= end;
            }),
            (d) => format(d, "yyyy-MM-dd"),
          );
          data = days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const group = dayGroups[key] || { revenue: 0 };
            return {
              label: format(day, "EEE", { locale: ar }),
              revenue: Math.round(group.revenue),
            };
          });
          break;
        case "month":
          start = startOfMonth(date);
          end = endOfMonth(date);
          label = format(date, "MMMM yyyy", { locale: ar });
          const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 6 });
          const weekGroups = groupByPeriod(
            movements.filter((m) => {
              const d = new Date(m.date);
              return d >= start && d <= end;
            }),
            (d) => {
              const weekStart = startOfWeek(d, { weekStartsOn: 6 });
              return format(weekStart, "yyyy-MM-dd");
            },
          );
          data = weeks.map((weekStart) => {
            const key = format(weekStart, "yyyy-MM-dd");
            const group = weekGroups[key] || { revenue: 0 };
            return {
              label: `أسبوع ${format(weekStart, "d MMM")}`,
              revenue: Math.round(group.revenue),
            };
          });
          break;
        case "year":
          start = startOfYear(date);
          end = endOfYear(date);
          label = format(date, "yyyy");
          const months = eachMonthOfInterval({ start, end });
          const monthGroups = groupByPeriod(
            movements.filter((m) => {
              const d = new Date(m.date);
              return d >= start && d <= end;
            }),
            (d) => format(d, "yyyy-MM"),
          );
          data = months.map((month) => {
            const key = format(month, "yyyy-MM");
            const group = monthGroups[key] || { revenue: 0 };
            return {
              label: format(month, "MMM", { locale: ar }),
              revenue: Math.round(group.revenue),
            };
          });
          break;
        default:
          start = startOfWeek(date, { weekStartsOn: 6 });
          end = endOfWeek(date, { weekStartsOn: 6 });
          label = `${format(start, "d MMM ")} - ${format(end, "d MMM yyyy")}`;
      }

      return {
        startDate: start,
        endDate: end,
        displayLabel: label,
        chartData: data,
        aggregatedData: aggregated,
      };
    }, [period, currentDate, movements, products]);

  const formattedStart = format(startDate, "yyyy-MM-dd");
  const formattedEnd = format(endDate, "yyyy-MM-dd");

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/products`, {
        params: { limit: 1000 },
      });
      setProducts(res.data.products || []);
    } catch (e) {
      console.error("فشل جلب المنتجات", e);
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/products/stock/movements`, {
        params: {
          type: "remove",
          startDate: formattedStart,
          endDate: formattedEnd,
          limit: 5000,
        },
      });
      const allMoves = res.data.movements || [];
      const sales = allMoves.filter((m) => m.notes === "بيع كاشير");
      setMovements(sales);
    } catch (e) {
      console.error("فشل جلب الحركات", e);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [formattedStart, formattedEnd]);

  const goToPrevious = () => {
    setCurrentDate((prev) => {
      switch (period) {
        case "day":
          return addDays(prev, -1);
        case "week":
          return subWeeks(prev, 1);
        case "month":
          return subMonths(prev, 1);
        case "year":
          return subYears(prev, 1);
        default:
          return prev;
      }
    });
  };

  const goToNext = () => {
    setCurrentDate((prev) => {
      const today = new Date();
      let next;
      switch (period) {
        case "day":
          next = addDays(prev, 1);
          break;
        case "week":
          next = addWeeks(prev, 1);
          break;
        case "month":
          next = addMonths(prev, 1);
          break;
        case "year":
          next = addYears(prev, 1);
          break;
        default:
          next = prev;
      }
      return next > today ? prev : next;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const dailyMovements = useMemo(() => {
    if (period !== "day") return [];
    return movements
      .filter((m) => {
        const d = new Date(m.date);
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [period, movements, startDate, endDate]);

  const totalRevenue = aggregatedData.revenue;
  const totalItems = aggregatedData.items;
  const totalProfit = aggregatedData.profit;
  const txCount = aggregatedData.count;

  const isToday = period === "day" && isSameDay(currentDate, new Date());

  return (
    <div
      dir="rtl"
      style={{
        background: "#f7f8fc",
        minHeight: "100vh",
        padding: "1.5rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: "22px",
                fontWeight: "800",
                color: "#1a1f36",
              }}
            >
              {period === "day"
                ? "مبيعات اليوم"
                : period === "week"
                  ? "مبيعات الأسبوع"
                  : period === "month"
                    ? "مبيعات الشهر"
                    : "مبيعات السنة"}
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              {displayLabel}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.25rem",
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                padding: "3px",
              }}
            >
              {[
                { value: "day", label: "يوم" },
                { value: "week", label: "أسبوع" },
                { value: "month", label: "شهر" },
                { value: "year", label: "سنة" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  style={{
                    height: "34px",
                    padding: "0 1rem",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    background:
                      period === opt.value ? "#1e3a8a" : "transparent",
                    color: period === opt.value ? "#fff" : "#6b7280",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={goToPrevious}
                className="flex items-center justify-center w-11 h-11 rounded-xl border border-gray-200 bg-white text-gray-700 text-lg font-semibold transition-all duration-150 hover:-translate-y-[1px] hover:shadow-sm hover:border-gray-300 active:scale-95"
              >
                ‹
              </button>

              <button
                onClick={goToNext}
                disabled={
                  period === "day" ? isToday : currentDate >= new Date()
                }
                className={`flex items-center justify-center w-11 h-11 rounded-xl border text-lg font-semibold transition-all duration-150
                ${
                  (period === "day" && isToday) || currentDate >= new Date()
                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-700 hover:-translate-y-[1px] hover:shadow-sm hover:border-gray-300 active:scale-95"
                }
                `}
              >
                ›
              </button>
            </div>

            <button
              onClick={goToToday}
              style={{
                height: "42px",
                padding: "0 1rem",
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              اليوم
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {[
            {
              label: "إجمالي الإيرادات",
              value: `${totalRevenue.toLocaleString("ar-EG")} ج.م`,
              color: "#1e3a8a",
              bg: "#eaeefc",
              dark: true,
            },
            {
              label: "صافي الربح",
              value: `${totalProfit.toLocaleString("ar-EG")} ج.م`,
              color: "#16a34a",
              bg: "#f0fdf4",
            },
            {
              label: "عدد المعاملات",
              value: String(txCount),
              color: "#7c3aed",
              bg: "#f5f3ff",
            },
            {
              label: "إجمالي القطع المباعة",
              value: String(totalItems),
              color: "#d97706",
              bg: "#fffbeb",
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: s.dark ? "#1e3a8a" : "#fff",
                border: s.dark ? "none" : "1px solid #eef0f5",
                borderRadius: "16px",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: s.dark ? "rgba(255,255,255,0.65)" : "#9ca3af",
                  marginBottom: "6px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  color: s.dark ? "#fff" : s.color,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {period !== "day" ? (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.5rem",
              border: "1px solid #eef0f5",
            }}
          >
            <h3
              style={{
                margin: "0 0 1rem",
                fontSize: "16px",
                fontWeight: "700",
                color: "#1a1f36",
              }}
            >
              {period === "week"
                ? "الإيرادات اليومية"
                : period === "month"
                  ? "الإيرادات الأسبوعية"
                  : "الإيرادات الشهرية"}
            </h3>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : (
              <PeriodChart data={chartData} dataKey="revenue" color="#16a34a" />
            )}
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #eef0f5",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid #f0f2f8",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#1a1f36",
                }}
              >
                تفاصيل المبيعات
              </span>
              <span style={{ fontSize: "13px", color: "#9ca3af" }}>
                {dailyMovements.length} معاملة
              </span>
            </div>
            {loading ? (
              <div style={{ padding: "4rem", textAlign: "center" }}>
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : dailyMovements.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center" }}>
                <FaBoxOpen
                  size={48}
                  style={{ color: "#d1d5db", marginBottom: "1rem" }}
                />
                <p style={{ color: "#9ca3af", fontSize: "15px", margin: 0 }}>
                  لا توجد مبيعات في هذا اليوم
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[
                        "الوقت",
                        "المنتج",
                        "الكمية",
                        "سعر الوحدة",
                        "الإجمالي",
                        "الربح",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "right",
                            padding: "11px 16px",
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#4b5563",
                            background: "#f1f3f9",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyMovements.map((m, i) => {
                      const product = products.find(
                        (p) => p.id === m.productID,
                      );
                      const lineTotal = m.quantity * m.unitPrice;
                      const lineProfit = product
                        ? m.quantity * (m.unitPrice - product.buyPrice)
                        : 0;
                      return (
                        <tr
                          key={i}
                          style={{ borderBottom: "1px solid #f5f5f5" }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {format(new Date(m.date), "hh:mm a")}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "#1a1f36",
                            }}
                          >
                            {m.Product?.name || "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: "700",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#eaeefc",
                                color: "#1e3a8a",
                              }}
                            >
                              ×{m.quantity}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "#6b7280",
                            }}
                          >
                            {Number(m.unitPrice).toLocaleString("ar-EG")} ج.م
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "14px",
                              fontWeight: "800",
                              color: "#16a34a",
                            }}
                          >
                            {lineTotal.toLocaleString("ar-EG")} ج.م
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              fontWeight: "700",
                              color: lineProfit >= 0 ? "#10b981" : "#ef4444",
                            }}
                          >
                            {lineProfit >= 0 ? "+" : ""}
                            {lineProfit.toLocaleString("ar-EG")} ج.م
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
