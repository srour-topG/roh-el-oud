import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdMonetizationOn,
  MdInventory,
} from "react-icons/md";
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
} from "date-fns";
import { LoadingSpinner } from "../pinner";

const apiUrl = import.meta.env.VITE_API_URL;

function getPeriodStart(period, now) {
  if (period === "day") return startOfDay(now);
  if (period === "week") return startOfWeek(now, { weekStartsOn: 6 }); // السبت بداية الأسبوع
  if (period === "month") return startOfMonth(now);
  return startOfYear(now);
}

function getChartData(period, movements) {
  const now = new Date();
  const start = getPeriodStart(period, now);
  const filtered = movements.filter((m) => new Date(m.date) >= start);
  const buckets = {};

  const getKey = (d) => {
    if (period === "day") return format(d, "HH:00");
    if (period === "week")
      return [
        "سبت",
        "أحد",
        "إثنين",
        "ثلاثاء",
        "أربعاء",
        "خميس",
        "جمعة",
      ].reverse()[d.getDay()];
    if (period === "month") return String(d.getDate());
    return format(d, "MMM");
  };

  filtered.forEach((m) => {
    const key = getKey(new Date(m.date));
    if (!buckets[key]) buckets[key] = { revenue: 0, expenses: 0 };
    const amount = m.quantity * m.unitPrice;
    if (m.type === "remove" && m.notes === "بيع كاشير") {
      buckets[key].revenue += amount;
    } else if (m.type === "add") {
      buckets[key].expenses += amount;
    }
  });

  return Object.entries(buckets).map(([label, v]) => ({
    label,
    revenue: Math.round(v.revenue),
    expenses: Math.round(v.expenses),
    profit: Math.round(v.revenue - v.expenses),
  }));
}

function getPeriodSummary(period, movements) {
  const now = new Date();
  const start = getPeriodStart(period, now);
  const filtered = movements.filter((m) => new Date(m.date) >= start);
  const sales = filtered.filter(
    (m) => m.type === "remove" && m.notes === "بيع كاشير",
  );
  const adds = filtered.filter((m) => m.type === "add");

  const revenue = sales.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const expenses = adds.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    txCount: sales.length,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, bg, dark }) {
  return (
    <div
      style={{
        background: dark ? "#1e3a8a" : "#fff",
        border: dark ? "none" : "1px solid #eef0f5",
        borderRadius: "16px",
        padding: "1.25rem",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "0.75rem",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "11px",
            color: dark ? "rgba(255,255,255,0.65)" : "#9ca3af",
            marginBottom: "6px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: "22px",
            fontWeight: "800",
            color: dark ? "#fff" : color || "#1a1f36",
            lineHeight: 1,
            marginBottom: "4px",
          }}
        >
          {value}
        </div>
        {sub && (
          <div
            style={{
              fontSize: "11px",
              color: dark ? "rgba(255,255,255,0.5)" : "#9ca3af",
            }}
          >
            {sub}
          </div>
        )}
      </div>
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: dark ? "rgba(255,255,255,0.12)" : bg || "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: dark ? "#fff" : color || "#374151",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  const COLORS = [
    "#1e3a8a",
    "#3b82f6",
    "#60a5fa",
    "#93c5fd",
    "#bfdbfe",
    "#dbeafe",
  ];
  const size = 130;
  const r = 48;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {data.map((d, i) => {
          const a = (d.count / total) * 2 * Math.PI;
          const x1 = cx + r * Math.cos(angle);
          const y1 = cy + r * Math.sin(angle);
          angle += a;
          const x2 = cx + r * Math.cos(angle);
          const y2 = cy + r * Math.sin(angle);
          const large = a > Math.PI ? 1 : 0;
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={COLORS[i % COLORS.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={28} fill="#fff" />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#1e3a8a"
        >
          {data.length}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                background: COLORS[i % COLORS.length],
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#374151" }}>{d.name}</span>
            <span
              style={{
                color: "#9ca3af",
                marginRight: "auto",
                fontWeight: "600",
              }}
            >
              {Math.round((d.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────
function ProductAnalytics() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  // جلب البيانات عند التحميل
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // جلب جميع المنتجات (يمكن زيادة limit حسب الحاجة)
        const productsRes = await axios.get(`${apiUrl}/products`, {
          params: { limit: 1000 },
        });
        // نفترض أن الحقل active غير موجود، نعتبر كل المنتجات نشطة
        const allProducts = productsRes.data.products || [];
        setProducts(allProducts);

        // جلب جميع الحركات - سنقوم بجلب صفحات متعددة إذا لزم الأمر
        let allMovements = [];
        let page = 1;
        let totalPages = 1;
        const limit = 1000; // حد أقصى لكل صفحة
        while (page <= totalPages) {
          const movRes = await axios.get(`${apiUrl}/products/stock/movements`, {
            params: { page, limit },
          });
          const data = movRes.data;
          allMovements = allMovements.concat(data.movements);
          totalPages = data.totalPages;
          page++;
        }
        // إضافة productName لكل حركة لتسهيل العرض (العلاقة موجودة لكن نضمنها)
        const movementsWithName = allMovements.map((m) => ({
          ...m,
          productName: m.Product?.name || "منتج غير معروف",
        }));
        setMovements(movementsWithName);
      } catch (error) {
        console.error("فشل جلب البيانات:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const fmt = (n) => `${Number(n || 0).toLocaleString("ar-EG")} ج.م`;

  // الحسابات المعتمدة على البيانات
  const chartData = useMemo(
    () => getChartData(period, movements),
    [period, movements],
  );
  const summary = useMemo(
    () => getPeriodSummary(period, movements),
    [period, movements],
  );

  // إجماليات كل الوقت
  const allRevenue = useMemo(
    () =>
      movements
        .filter((m) => m.type === "remove" && m.notes === "بيع كاشير")
        .reduce((s, m) => s + m.quantity * m.unitPrice, 0),
    [movements],
  );
  const allExpenses = useMemo(() => {
    return movements
      .filter((m) => m.type === "add")
      .reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  }, [movements]);

  const allProfit = allRevenue - allExpenses;

  const activeProducts = products;
  const totalBuyValue = activeProducts.reduce(
    (s, p) => s + p.buyPrice * p.quantity,
    0,
  );

  const lowStock = activeProducts.filter(
    (p) => p.quantity > 0 && p.quantity <= p.minQuantity,
  );
  const expired = activeProducts.filter(
    (p) => p.expireDate && new Date(p.expireDate) < now,
  );

  // أكثر المنتجات مبيعاً
  const salesMap = {};
  movements
    .filter((m) => m.type === "remove" && m.notes === "بيع كاشير")
    .forEach((m) => {
      if (!salesMap[m.productID])
        salesMap[m.productID] = { name: m.productName, qty: 0, revenue: 0 };
      salesMap[m.productID].qty += m.quantity;
      salesMap[m.productID].revenue += m.quantity * m.unitPrice;
    });
  const topSellers = Object.values(salesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // توزيع الفئات
  const catMap = {};
  activeProducts.forEach((p) => {
    catMap[p.category || "أخرى"] = (catMap[p.category || "أخرى"] || 0) + 1;
  });
  const categoryData = Object.entries(catMap).map(([name, count]) => ({
    name,
    count,
  }));

  // التحليل الشهري (نستخدم الحركات لتكوين جدول شهري)
  const monthlyMap = {};
  movements.forEach((m) => {
    const key = format(new Date(m.date), "yyyy-MM");
    if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, expenses: 0 };
    const amt = m.quantity * m.unitPrice;
    if (m.type === "remove" && m.notes === "بيع كاشير") {
      monthlyMap[key].revenue += amt;
    } else if (m.type === "add") {
      monthlyMap[key].expenses += amt;
    }
  });
  const monthlyBreakdown = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .reverse()
    .map(([month, v]) => ({
      month,
      revenue: v.revenue,
      expenses: v.expenses,
      profit: v.revenue - v.expenses,
    }));

  const periodLabels = {
    day: "اليوم",
    week: "هذا الأسبوع",
    month: "هذا الشهر",
    year: "هذه السنة",
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        background: "#f7f8fc",
        minHeight: "100vh",
        padding: "1.5rem 1rem",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: "800",
              color: "#1a1f36",
            }}
          >
            تحليل المنتجات والإيرادات
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
            نظرة شاملة على الأداء المالي والمخزون
          </p>
        </div>

        {/* All-time KPI cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <StatCard
            dark
            label="إجمالي الإيرادات (كل الوقت)"
            value={fmt(allRevenue)}
            sub="من حركات البيع"
            icon={<MdTrendingUp size={20} />}
          />
          <StatCard
            label="إجمالي المصروفات (كل الوقت)"
            value={fmt(allExpenses)}
            sub="من حركات الشراء"
            color="#dc2626"
            bg="#fef2f2"
            icon={<MdTrendingDown size={20} />}
          />
          <StatCard
            label="صافي الربح الإجمالي"
            value={fmt(allProfit)}
            sub={allProfit >= 0 ? "ربح إجمالي" : "خسارة إجمالية"}
            color={allProfit >= 0 ? "#16a34a" : "#dc2626"}
            bg={allProfit >= 0 ? "#f0fdf4" : "#fef2f2"}
            icon={<MdMonetizationOn size={20} />}
          />
          <StatCard
            label="قيمة المخزون الحالي"
            value={fmt(totalBuyValue)}
            sub="بسعر الشراء"
            color="#7c3aed"
            bg="#f5f3ff"
            icon={<MdInventory size={20} />}
          />
        </div>

        {/* Filterable chart + period summary */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "1.25rem",
            border: "1px solid #eef0f5",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <h3
                style={{
                  margin: "0 0 2px",
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#1a1f36",
                }}
              >
                الإيرادات والمصروفات والأرباح
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
                {periodLabels[period]}
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["day", "week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    height: "34px",
                    padding: "0 0.875rem",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "1px solid",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    background: period === p ? "#1e3a8a" : "#f9fafb",
                    borderColor: period === p ? "#1e3a8a" : "#e5e7eb",
                    color: period === p ? "#fff" : "#374151",
                  }}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Period summary mini-cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {[
              {
                label: "الإيرادات",
                value: fmt(summary.revenue),
                color: "#16a34a",
                bg: "#f0fdf4",
              },
              {
                label: "المصروفات",
                value: fmt(summary.expenses),
                color: "#dc2626",
                bg: "#fef2f2",
              },
              {
                label: "صافي الربح",
                value: fmt(summary.profit),
                color: summary.profit >= 0 ? "#16a34a" : "#dc2626",
                bg: summary.profit >= 0 ? "#f0fdf4" : "#fef2f2",
              },
              {
                label: "عدد المعاملات",
                value: String(summary.txCount),
                color: "#1e3a8a",
                bg: "#eaeefc",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: s.bg,
                  borderRadius: "12px",
                  padding: "0.875rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "800",
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Recharts */}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("ar-EG")} ج.م`,
                    name === "revenue"
                      ? "الإيرادات"
                      : name === "expenses"
                        ? "المصروفات"
                        : "الربح",
                  ]}
                  contentStyle={{
                    fontFamily: "inherit",
                    direction: "rtl",
                    fontSize: "13px",
                  }}
                />
                <Legend
                  formatter={(v) =>
                    v === "revenue"
                      ? "الإيرادات"
                      : v === "expenses"
                        ? "المصروفات"
                        : "الربح"
                  }
                  wrapperStyle={{ fontSize: "12px" }}
                />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "#9ca3af",
                fontSize: "13px",
              }}
            >
              لا توجد بيانات لهذه الفترة
            </div>
          )}
        </div>

        {/* Charts row: category donut + top sellers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Category donut */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "1.25rem",
              border: "1px solid #eef0f5",
            }}
          >
            <h3
              style={{
                margin: "0 0 1.25rem",
                fontSize: "15px",
                fontWeight: "700",
                color: "#1a1f36",
              }}
            >
              توزيع الفئات
            </h3>
            <DonutChart data={categoryData} />
          </div>

          {/* Top sellers */}
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
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#1a1f36",
                }}
              >
                🔥 الأكثر مبيعاً (إجمالي)
              </h3>
            </div>
            {topSellers.length === 0 ? (
              <div
                style={{
                  padding: "1.5rem",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                لا توجد مبيعات مسجلة
              </div>
            ) : (
              topSellers.map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid #f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: i === 0 ? "#fef9c3" : "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      flexShrink: 0,
                    }}
                  >
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#1a1f36",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {s.qty} وحدة
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#16a34a",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(s.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Monthly table + alerts row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          {/* Monthly table */}
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
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#1a1f36",
                }}
              >
                التفاصيل الشهرية
              </h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["الشهر", "الإيرادات", "المصروفات", "صافي الربح"].map(
                      (h) => (
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
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {monthlyBreakdown.slice(0, 8).map((m, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: "1px solid #f5f5f5" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#fafbff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#374151",
                        }}
                      >
                        {m.month}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#16a34a",
                        }}
                      >
                        {fmt(m.revenue)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "13px",
                          color: "#dc2626",
                        }}
                      >
                        {fmt(m.expenses)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "14px",
                          fontWeight: "800",
                          color: m.profit >= 0 ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {m.profit >= 0 ? "+" : ""}
                        {fmt(m.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {[
              {
                title: "⚠️ مخزون منخفض",
                items: lowStock,
                color: "#d97706",
                bg: "#fffbeb",
                renderVal: (p) => `${p.quantity} وحدة`,
              },
              {
                title: "❌ منتهي الصلاحية",
                items: expired,
                color: "#dc2626",
                bg: "#fef2f2",
                renderVal: (p) => p.expireDate?.split("T")[0],
              },
            ].map((section, si) => (
              <div
                key={si}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #eef0f5",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid #f0f2f8",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "700",
                      color: "#1a1f36",
                    }}
                  >
                    {section.title}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "20px",
                      background: section.bg,
                      color: section.color,
                    }}
                  >
                    {section.items.length}
                  </span>
                </div>
                {section.items.length === 0 ? (
                  <div
                    style={{
                      padding: "1rem 1.25rem",
                      fontSize: "12px",
                      color: "#9ca3af",
                      textAlign: "center",
                    }}
                  >
                    لا توجد منتجات في هذه الحالة ✓
                  </div>
                ) : (
                  section.items.slice(0, 3).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "0.625rem 1.25rem",
                        borderBottom: "1px solid #f5f5f5",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#374151",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: section.color,
                          marginRight: "0.5rem",
                          flexShrink: 0,
                        }}
                      >
                        {section.renderVal(p)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductAnalytics;
