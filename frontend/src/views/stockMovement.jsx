import { useState, useEffect } from "react";
import axios from "axios";
import { MdAdd, MdRemove } from "react-icons/md";
import { FaBoxOpen } from "react-icons/fa6";
import SuccessToast from "../components/toasts/successToast";
import { LoadingSpinner } from "../pinner";
import { differenceInDays } from "date-fns";

const apiUrl = import.meta.env.VITE_API_URL;

function StockMovement() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState();
  const [activeType, setActiveType] = useState("add"); // "add" | "remove"
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);

  const [form, setForm] = useState({
    productID: "",
    quantity: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    axios
      .get(`${apiUrl}/products`, { params: { limit: 100 } })
      .then((r) => setProducts(r.data.products || []))
      .catch(console.error);
    fetchMovements(1);
  }, []);

  const fetchMovements = async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiUrl}/products/stock/movements`, {
        params: { page: p, limit: 10 },
      });
      setMovements(res.data.movements);
      setTodayCount(res.data.todayCount || 0);
      setMovTotalPages(res.data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(
    (p) => String(p.id) === String(form.productID),
  );

  const handleSubmit = async () => {
    if (!form.productID) {
      setFormError("يرجى اختيار منتج");
      return;
    }
    if (!form.quantity || parseInt(form.quantity) <= 0) {
      setFormError("يرجى إدخال كمية صحيحة");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await axios.post(`${apiUrl}/products/stock`, {
        productID: form.productID,
        type: activeType,
        quantity: parseInt(form.quantity),
        notes: form.notes,
      });
      setResponse(res.data);
      setToast(true);
      setForm({
        productID: "",
        quantity: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchMovements(1);
      // refresh products list
      axios
        .get(`${apiUrl}/products`, { params: { limit: 100 } })
        .then((r) => setProducts(r.data.products || []));
      setTimeout(() => setToast(false), 3000);
    } catch (e) {
      setResponse(e.response?.data || { Message: "حدث خطأ" });
      setToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Low stock products for sidebar
  const lowStock = products
    .filter((p) => p.quantity > 0 && p.quantity <= (p.minQuantity || 5))
    .slice(0, 5);

  return (
    <div
      dir="rtl"
      style={{
        background: "#f7f8fc",
        minHeight: "100vh",
        padding: "1.5rem 1rem",
      }}
    >
      {toast && <SuccessToast response={response} />}

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
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
              حركة المخزون
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              تتبع وتحديث كميات المنتجات
            </p>
          </div>
          {/* Today counter */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #eef0f5",
              borderRadius: "14px",
              padding: "0.875rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                إجمالي الحركات اليوم
              </div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: "800",
                  color: "#1e3a8a",
                  lineHeight: 1.1,
                }}
              >
                {todayCount}
              </div>
            </div>
          </div>
        </div>

        {/* <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid #eef0f5",
            }}
          >
            <div style={{ display: "flex", borderBottom: "1px solid #f0f2f8" }}>
              {[
                { v: "add", l: "إضافة كمية", icon: <MdAdd size={16} /> },
                { v: "remove", l: "سحب كمية", icon: <MdRemove size={16} /> },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => setActiveType(t.v)}
                  style={{
                    flex: 1,
                    height: "52px",
                    background:
                      activeType === t.v
                        ? t.v === "add"
                          ? "#f0fdf4"
                          : "#fef2f2"
                        : "transparent",
                    border: "none",
                    borderBottom:
                      activeType === t.v
                        ? `2px solid ${t.v === "add" ? "#16a34a" : "#dc2626"}`
                        : "2px solid transparent",
                    fontSize: "14px",
                    fontWeight: "700",
                    color:
                      activeType === t.v
                        ? t.v === "add"
                          ? "#16a34a"
                          : "#dc2626"
                        : "#9ca3af",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                    marginBottom: "-1px",
                  }}
                >
                  {t.icon} {t.l}
                </button>
              ))}
            </div>

            <div style={{ padding: "1.5rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  اختر المنتج
                </label>
                <select
                  value={form.productID}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, productID: e.target.value }));
                    setFormError("");
                  }}
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "14px",
                    background: "#f9fafb",
                    color: form.productID ? "#374151" : "#9ca3af",
                    outline: "none",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    direction: "rtl",
                    textAlign: "right",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                >
                  <option value="">اختر منتجاً...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.quantity} متاح)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div
                  style={{
                    background: "#f8f9fc",
                    border: "1px solid #eef0f8",
                    borderRadius: "10px",
                    padding: "0.875rem 1rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#1a1f36",
                      }}
                    >
                      {selectedProduct.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#6b7280",
                        marginTop: "3px",
                      }}
                    >
                      السعر:{" "}
                      {Number(selectedProduct.price).toLocaleString("ar-EG")}{" "}
                      ج.م
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "800",
                        color:
                          selectedProduct.quantity <=
                          (selectedProduct.minQuantity || 5)
                            ? "#d97706"
                            : "#1e3a8a",
                      }}
                    >
                      {selectedProduct.quantity}
                    </div>
                    <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                      الكمية الحالية
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, quantity: e.target.value }));
                      setFormError("");
                    }}
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      fontSize: "16px",
                      fontWeight: "700",
                      background: "#f9fafb",
                      color: "#1a1f36",
                      outline: "none",
                      boxSizing: "border-box",
                      textAlign: "center",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#374151",
                      marginBottom: "6px",
                    }}
                  >
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 1rem",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      fontSize: "14px",
                      background: "#f9fafb",
                      outline: "none",
                      boxSizing: "border-box",
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                    onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "6px",
                  }}
                >
                  ملاحظات إضافية{" "}
                  <span style={{ color: "#9ca3af", fontWeight: "400" }}>
                    (اختياري)
                  </span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="أدخل أي تفاصيل إضافية هنا..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "13px",
                    background: "#f9fafb",
                    color: "#374151",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    direction: "rtl",
                    textAlign: "right",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>

              {formError && (
                <p
                  style={{
                    margin: "0 0 1rem",
                    fontSize: "13px",
                    color: "#ef4444",
                  }}
                >
                  {formError}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: "100%",
                  height: "50px",
                  background: activeType === "add" ? "#16a34a" : "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.7 : 1,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.15s",
                  boxShadow:
                    activeType === "add"
                      ? "0 4px 12px rgba(22,163,74,0.25)"
                      : "0 4px 12px rgba(220,38,38,0.25)",
                }}
              >
                {submitting ? (
                  "جاري المعالجة..."
                ) : activeType === "add" ? (
                  <>
                    <MdAdd size={20} /> إضافة للمخزون
                  </>
                ) : (
                  <>
                    <MdRemove size={20} /> سحب من المخزون
                  </>
                )}
              </button>
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
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
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#1a1f36",
                  }}
                >
                  معاينة المخزون الحالي
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: "600",
                  }}
                >
                  منخفض
                </span>
              </div>
              {lowStock.length === 0 ? (
                <div
                  style={{
                    padding: "1.5rem",
                    textAlign: "center",
                    color: "#9ca3af",
                    fontSize: "13px",
                  }}
                >
                  المخزون في حالة جيدة ✓
                </div>
              ) : (
                lowStock.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "0.875rem 1.25rem",
                      borderBottom: "1px solid #f5f5f5",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#1a1f36",
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#d97706",
                          marginTop: "2px",
                        }}
                      >
                        الحد الأدنى: {p.minQuantity}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: "#d97706",
                        }}
                      >
                        {p.quantity}
                      </div>
                      <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                        UNIT
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div> */}

        {/* ── Recent movements table ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #eef0f5",
            marginTop: "1.25rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #f0f2f8",
            }}
          >
            <span
              style={{ fontSize: "15px", fontWeight: "700", color: "#1a1f36" }}
            >
              آخر الحركات المسجلة
            </span>
          </div>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "المنتج",
                      "النوع",
                      "الكمية",
                      "الرصيد بعد",
                      "الملاحظات",
                      "التاريخ",
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
                  {movements.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          padding: "2rem",
                          color: "#9ca3af",
                        }}
                      >
                        لا توجد حركات مسجلة
                      </td>
                    </tr>
                  ) : (
                    movements.map((m, i) => (
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
                            color: "#1a1f36",
                          }}
                        >
                          {m.Product?.name}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 10px",
                              borderRadius: "20px",
                              background:
                                m.type === "add" ? "#f0fdf4" : "#fef2f2",
                              color: m.type === "add" ? "#16a34a" : "#dc2626",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              width: "fit-content",
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background:
                                  m.type === "add" ? "#22c55e" : "#ef4444",
                              }}
                            />
                            {m.type === "add" ? "إضافة" : "سحب"}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "14px",
                            fontWeight: "800",
                            color: m.type === "add" ? "#16a34a" : "#dc2626",
                          }}
                        >
                          {m.type === "add" ? "+" : "-"}
                          {m.quantity}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "13px",
                            color: "#374151",
                            fontWeight: "600",
                          }}
                        >
                          {m.quantityAfter}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "12px",
                            color: "#6b7280",
                            maxWidth: "200px",
                          }}
                        >
                          {m.notes || "—"}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "12px",
                            color: "#6b7280",
                          }}
                        >
                          {m.date?.split("T")[0]}{" "}
                          {m.date?.split("T")[1]?.slice(0, 5)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {movTotalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "4px",
                padding: "1rem",
              }}
            >
              {Array.from({ length: movTotalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setMovPage(p);
                      fetchMovements(p);
                    }}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: movPage === p ? "none" : "1px solid #e5e7eb",
                      background: movPage === p ? "#1e3a8a" : "#fff",
                      color: movPage === p ? "#fff" : "#4b5563",
                      cursor: "pointer",
                    }}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockMovement;
