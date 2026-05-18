import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MdModeEdit,
  MdDelete,
  MdAdd,
  MdInventory,
  MdQrCode,
  MdWarning,
  MdRemove,
} from "react-icons/md";
import { IoClose, IoSearch } from "react-icons/io5";
import { FaBoxOpen, FaCamera } from "react-icons/fa6";
import { HiOutlineExclamationCircle } from "react-icons/hi";

const apiUrl = import.meta.env.VITE_API_URL;
const STATIC =
  import.meta.env.VITE_BACKEND_STATIC_URL || "http://localhost:6060";

// ── Shared input style ────────────────────────────────────────────────────────
const IS = (err) => ({
  width: "100%",
  height: "44px",
  padding: "0 0.875rem",
  border: `1px solid ${err ? "#ef4444" : "#e5e7eb"}`,
  borderRadius: "10px",
  fontSize: "14px",
  background: "#f9fafb",
  color: "#374151",
  outline: "none",
  textAlign: "right",
  direction: "rtl",
  boxSizing: "border-box",
  fontFamily: "inherit",
});

function getProductStatus(p) {
  if (p.quantity === 0)
    return {
      label: "نفذ المخزون",
      color: "#dc2626",
      bg: "#fef2f2",
      dot: "#dc2626",
    };
  if (p.quantity <= p.minQuantity)
    return {
      label: "مخزون منخفض",
      color: "#d97706",
      bg: "#fffbeb",
      dot: "#f59e0b",
    };
  return { label: "متوفر", color: "#16a34a", bg: "#f0fdf4", dot: "#22c55e" };
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, ok }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "1.25rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: ok ? "#16a34a" : "#dc2626",
        color: "#fff",
        padding: "0.75rem 1.5rem",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "700",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      {message}
    </div>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────
function ProductModal({ mode, product, onClose, onSuccess }) {
  const isEdit = mode === "edit";
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [customCategory, setCustomCategory] = useState("");

  const [form, setForm] = useState({
    name: isEdit ? product.name : "",
    sellPrice: isEdit ? String(product.sellPrice) : "",
    buyPrice: isEdit ? String(product.buyPrice) : "",
    quantity: isEdit ? String(product.quantity) : "0",
    minQuantity: isEdit ? String(product.minQuantity) : "5",
    barcode: isEdit ? product.barcode || "" : "",
    category: isEdit ? product.category?.name || "" : "",
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get(`${apiUrl}/categories`);
        setCategories(res.data);
      } catch (e) {
        console.log(e);
      }
    }
    fetchCategories();
  }, []);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "الاسم مطلوب";
    if (!form.sellPrice || Number(form.sellPrice) <= 0)
      e.sellPrice = "سعر البيع مطلوب";
    if (!form.buyPrice || Number(form.buyPrice) <= 0)
      e.buyPrice = "سعر الشراء مطلوب";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("sellPrice", form.sellPrice);
      fd.append("buyPrice", form.buyPrice);
      if (!isEdit) fd.append("quantity", form.quantity);
      fd.append("minQuantity", form.minQuantity);
      if (form.barcode) fd.append("barcode", form.barcode);

      // Handle category: if "أخرى", send customCategory, otherwise send selected category
      let finalCategory = form.category;
      if (form.category === "أخرى") {
        finalCategory = customCategory;
      }
      if (finalCategory) fd.append("category", finalCategory);

      if (imageFile) fd.append("image", imageFile);

      if (isEdit) {
        await axios.patch(`${apiUrl}/products/${product.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onSuccess("تم التعديل بنجاح", true);
      } else {
        await axios.post(`${apiUrl}/products`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        onSuccess("تمت الإضافة بنجاح", true);
      }
    } catch (error) {
      onSuccess(error.response?.data?.Message || "حدث خطأ", false);
    } finally {
      setSubmitting(false);
    }
  }

  const sellPrice = Number(form.sellPrice) || 0;
  const buyPrice = Number(form.buyPrice) || 0;
  const margin = sellPrice - buyPrice;


  const currentImage = isEdit ? product.image : null;
  const previewSrc =
    preview ||
    (currentImage ? `${STATIC}/${currentImage.replace(/\\/g, "/")}` : null);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "1.75rem",
          width: "min(540px, 96vw)",
          maxHeight: "92vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
          }}
        >
          <IoClose size={15} color="#6b7280" />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#eaeefc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdInventory size={20} color="#1e3a8a" />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: "700",
              color: "#1e3a8a",
            }}
          >
            {isEdit ? "تعديل المنتج" : "إضافة منتج جديد"}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            {/* Name */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                اسم المنتج *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                style={IS(!!errors.name)}
                placeholder="مثال: شنطه , حذاء"
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                onBlur={(e) =>
                  (e.target.style.borderColor = errors.name
                    ? "#ef4444"
                    : "#e5e7eb")
                }
              />
              {errors.name && (
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#ef4444",
                  }}
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Numeric fields */}
            {[
              { key: "sellPrice", label: "سعر البيع (ج.م) *", ph: "0.00" },
              { key: "buyPrice", label: "سعر الشراء (ج.م) *", ph: "0.00" },
              ...(!isEdit
                ? [
                    { key: "quantity", label: "الكمية الأولية", ph: "0" },
                    { key: "minQuantity", label: "حد التنبيه", ph: "5" },
                  ]
                : [{ key: "minQuantity", label: "حد التنبيه", ph: "5" }]),
            ].map((f) => (
              <div key={f.key}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: "5px",
                  }}
                >
                  {f.label}
                </label>
                <input
                  type="number"
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  style={IS(!!errors[f.key])}
                  placeholder={f.ph}
                  onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
                {errors[f.key] && (
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "11px",
                      color: "#ef4444",
                    }}
                  >
                    {errors[f.key]}
                  </p>
                )}
              </div>
            ))}

            {/* Category with "أخرى" option */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                الفئة
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                style={{ ...IS(), cursor: "pointer", appearance: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              >
                <option value="">اختر فئة</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="أخرى">أخرى</option>
              </select>
            </div>

            {/* Custom category input when "أخرى" is selected */}
            {form.category === "أخرى" && (
              <div style={{ marginTop: "0.75rem", gridColumn: "1 / -1" }}>
                <input
                  type="text"
                  placeholder="اكتب اسم الفئة الجديدة"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  style={IS()}
                />
              </div>
            )}

            {/* Barcode */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                الباركود{" "}
                <span style={{ color: "#9ca3af", fontWeight: "400" }}>
                  (اختياري)
                </span>
              </label>
              <input
                value={form.barcode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, barcode: e.target.value }))
                }
                style={IS()}
                placeholder="123456789"
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>

            {/* Profit preview */}
            {sellPrice > 0 && buyPrice > 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  background: margin >= 0 ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${margin >= 0 ? "#bbf7d0" : "#fecaca"}`,
                  borderRadius: "10px",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: margin >= 0 ? "#15803d" : "#b91c1c",
                  }}
                >
                  هامش الربح للوحدة
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: margin >= 0 ? "#15803d" : "#b91c1c",
                  }}
                >
                  {margin.toLocaleString("ar-EG")} ج.م
                  {buyPrice > 0 && ` (${(margin / sellPrice) * 100}%)`}
                </span>
              </div>
            )}

            {/* Image picker */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                صورة المنتج{" "}
                <span style={{ color: "#9ca3af", fontWeight: "400" }}>
                  (اختياري)
                </span>
              </label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "12px",
                    border: "2px dashed #d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    background: "#f9fafb",
                    flexShrink: 0,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "#1e3a8a")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "#d1d5db")
                  }
                >
                  {previewSrc ? (
                    <img
                      src={previewSrc}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <FaCamera size={22} style={{ color: "#9ca3af" }} />
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      height: "36px",
                      padding: "0 1rem",
                      background: "#f3f4f6",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      color: "#374151",
                    }}
                  >
                    {previewSrc ? "تغيير الصورة" : "اختر صورة"}
                  </button>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "11px",
                      color: "#9ca3af",
                    }}
                  >
                    JPG, PNG حتى 5MB
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setPreview(URL.createObjectURL(f));
                      setImageFile(f);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginTop: "1.25rem",
            }}
          >
            <button
              type="submit"
              disabled={submitting}
              style={{
                height: "46px",
                background: "#1e3a8a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting
                ? "جاري..."
                : isEdit
                  ? "حفظ التعديلات"
                  : "إضافة المنتج"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: "46px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Stock Adjust Modal ────────────────────────────────────────────────────────
function StockModal({ product, type, onClose, onSuccess }) {
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdd = type === "add";

  async function handleSubmit() {
    const n = parseInt(qty);
    if (!n || n <= 0) return;

    if (!isAdd && n > product.quantity) {
      onSuccess("الكمية أكبر من المخزون الحالي", false);
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/products/stock`, {
        productID: product.id,
        type,
        quantity: n,
        notes: notes || undefined,
      });
      onSuccess(isAdd ? "تمت الإضافة للمخزون" : "تم السحب من المخزون", true);
    } catch (error) {
      onSuccess(error.response?.data?.Message || "حدث خطأ", false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "1.75rem",
          width: "min(380px, 92vw)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "none",
            background: "#FEE2E2",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FF0000",
          }}
        >
          <IoClose size={15} />
        </button>

        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: isAdd ? "#f0fdf4" : "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          {isAdd ? (
            <MdAdd size={24} color="#16a34a" />
          ) : (
            <MdRemove size={24} color="#dc2626" />
          )}
        </div>
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#1a1f36",
            textAlign: "center",
          }}
        >
          {isAdd ? "إضافة للمخزون" : "سحب من المخزون"}
        </h3>
        <p
          style={{
            margin: "0 0 1.25rem",
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
          }}
        >
          {product.name} — متاح: {product.quantity}
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "5px",
              color: "#374151",
            }}
          >
            الكمية
          </label>
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            autoFocus
            style={{
              ...IS(),
              fontSize: "22px",
              fontWeight: "700",
              textAlign: "center",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "5px",
              color: "#374151",
            }}
          >
            ملاحظات{" "}
            <span style={{ color: "#9ca3af", fontWeight: "400" }}>
              (اختياري)
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-gray-600"
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "13px",
              background: "#f9fafb",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
              direction: "rtl",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={loading || !qty}
            style={{
              height: "44px",
              background: isAdd ? "#16a34a" : "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading || !qty ? "not-allowed" : "pointer",
              opacity: !qty ? 0.6 : 1,
              fontFamily: "inherit",
            }}
          >
            {loading ? "جاري..." : "تأكيد"}
          </button>
          <button
            onClick={onClose}
            style={{
              height: "44px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ product, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await axios.delete(`${apiUrl}/products/${product.id}`);
      onSuccess("تم الحذف بنجاح", true);
    } catch (error) {
      onSuccess(error.response?.data?.Message || "حدث خطأ", false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem",
          width: "min(380px, 92vw)",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IoClose size={15} />
        </button>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#fef2f2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <HiOutlineExclamationCircle
            style={{ fontSize: "32px", color: "#dc2626" }}
          />
        </div>
        <h3
          style={{
            margin: "0 0 6px",
            fontSize: "17px",
            fontWeight: "700",
            color: "#1a1f36",
          }}
        >
          حذف المنتج
        </h3>
        <p style={{ margin: "0 0 1.5rem", fontSize: "13px", color: "#6b7280" }}>
          هل متأكد من حذف <strong>{product.name}</strong>؟ ستبقى الحركات السابقة
          محفوظة.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={handleDelete}
            disabled={loading}
            style={{
              height: "44px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? "جاري..." : "حذف"}
          </button>
          <button
            onClick={onClose}
            style={{
              height: "44px",
              background: "#f3f4f6",
              color: "#374151",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

const TH = ({ children, center }) => (
  <th
    style={{
      textAlign: center ? "center" : "right",
      padding: "13px 16px",
      fontSize: "12px",
      fontWeight: "600",
      color: "#4b5563",
      background: "#f1f3f9",
      borderBottom: "1px solid #e5e7eb",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </th>
);

// ── Main Products Page ────────────────────────────────────────────────────────
export default function Products() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    lowStockCount: 0,
    emptyCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [modal, setModal] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [toast, setToast] = useState(null);
  const debounceRef = useRef(null);
  const LIMIT = 10;

  // Fetch categories for filter dropdown
  useEffect(() => {
    axios
      .get(`${apiUrl}/categories`)
      .then((res) => {
        setCategories(res.data);
      })
      .catch(console.error);
  }, []);

  const fetchProducts = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (search) params.search = search;
      if (category !== "all") {
        params.categoryId = category;
      }
      if (status !== "all") params.status = status;
      const res = await axios.get(`${apiUrl}/products`, { params });

      setAllProducts(res.data.products);
      setStats(
        res.data.stats || { totalCount: 0, lowStockCount: 0, emptyCount: 0 },
      );
      setTotalPages(res.data.totalPages);
      setTotalItems(res.data.totalItems);
    } catch (error) {
      console.error(error);
      setToast({ message: "فشل تحميل المنتجات", ok: false });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    let cleanPath = imagePath.replace(/\\/g, "/");
    if (
      !cleanPath.startsWith("uploads/") &&
      !cleanPath.startsWith("/uploads")
    ) {
      cleanPath = `uploads/${cleanPath}`;
    }
    return `${STATIC}/${cleanPath}`;
  };

  useEffect(() => {
    fetchProducts(1);
    setPage(1);
  }, [category, status]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(1);
      setPage(1);
    }, 350);
  }, [search]);

  function notify(msg, ok) {
    setModal(null);
    setStockModal(null);
    setToast({ message: msg, ok });
    fetchProducts(page);
    setTimeout(() => setToast(null), 3000);
  }

  const statCards = [
    {
      label: "إجمالي المنتجات",
      value: stats.totalCount,
      color: "#1e3a8a",
      bg: "#eaeefc",
      icon: <MdInventory size={20} />,
    },
    {
      label: "مخزون منخفض",
      value: stats.lowStockCount,
      color: "#d97706",
      bg: "#fffbeb",
      icon: <MdWarning size={20} />,
    },
    {
      label: "نفذ المخزون",
      value: stats.emptyCount,
      color: "#dc2626",
      bg: "#fef2f2",
      icon: <FaBoxOpen size={18} />,
    },
  ];

  return (
    <div
      dir="rtl"
      style={{
        background: "#f7f8fc",
        minHeight: "100vh",
        padding: "1.5rem 1rem",
      }}
    >
      {toast && <Toast message={toast.message} ok={toast.ok} />}
      {modal?.type === "add" && (
        <ProductModal
          mode="add"
          onClose={() => setModal(null)}
          onSuccess={notify}
        />
      )}
      {modal?.type === "edit" && (
        <ProductModal
          mode="edit"
          product={modal.product}
          onClose={() => setModal(null)}
          onSuccess={notify}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          product={modal.product}
          onClose={() => setModal(null)}
          onSuccess={notify}
        />
      )}
      {stockModal && (
        <StockModal
          product={stockModal.product}
          type={stockModal.type}
          onClose={() => setStockModal(null)}
          onSuccess={notify}
        />
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem",
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
              المنتجات
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
              إدارة المخزون والأسعار
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* <button
              onClick={() => navigate("stock")}
              style={{
                height: "42px",
                padding: "0 1.25rem",
                background: "#fff",
                color: "#7c3aed",
                border: "1px solid #ddd6fe",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              📊
            </button> */}
            <button
              onClick={() => setModal({ type: "add" })}
              style={{
                height: "42px",
                padding: "0 1.25rem",
                background: "#1e3a8a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(30,58,138,0.25)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#1e40af")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#1e3a8a")
              }
            >
              <MdAdd size={18} /> إضافة منتج
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          {statCards.map((s, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: "1px solid #eef0f5",
                borderRadius: "14px",
                padding: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: s.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginBottom: "3px",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: "800",
                    color: s.value > 0 && i > 0 ? s.color : "#1a1f36",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            border: "1px solid #eef0f5",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <IoSearch
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                fontSize: "15px",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو الباركود"
              style={{ ...IS(), paddingRight: "2.25rem", height: "38px" }}
              onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              height: "38px",
              padding: "0 0.75rem",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "13px",
              background: "#f9fafb",
              color: "#374151",
              outline: "none",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            <option value="all">كل الفئات</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[
              { v: "all", l: "الكل" },
              { v: "low", l: "منخفض" },
              { v: "out", l: "نفذ" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setStatus(opt.v)}
                style={{
                  height: "34px",
                  padding: "0 0.875rem",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: "1px solid",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: status === opt.v ? "#1e3a8a" : "#f9fafb",
                  borderColor: status === opt.v ? "#1e3a8a" : "#e5e7eb",
                  color: status === opt.v ? "#fff" : "#374151",
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
          <span
            style={{ marginRight: "auto", fontSize: "13px", color: "#6b7280" }}
          >
            {totalItems} منتج
          </span>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #eef0f5",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>المنتج</TH>
                  <TH>الفئة</TH>
                  <TH center>سعر البيع</TH>
                  <TH center>سعر الشراء</TH>
                  <TH center>الربح</TH>
                  <TH center>المخزون</TH>
                  <TH>الحالة</TH>
                  <TH center>إجراءات</TH>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ textAlign: "center", padding: "3rem" }}
                    >
                      <div
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <div>جاري التحميل...</div>
                      </div>
                    </td>
                  </tr>
                ) : allProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: "3rem",
                        color: "#9ca3af",
                      }}
                    >
                      لا توجد منتجات
                    </td>
                  </tr>
                ) : (
                  allProducts.map((p) => {
                    const st = getProductStatus(p);
                    const profit =
                      parseFloat(p.sellPrice) - parseFloat(p.buyPrice);
                    return (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid #f5f5f5" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fafbff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Product with image */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                overflow: "hidden",
                                background: "#f1f3f9",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {p.image ? (
                                <img
                                  src={getImageUrl(p.image)}
                                  alt={p.name}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <FaBoxOpen
                                  size={18}
                                  style={{ color: "#c7cfe0" }}
                                />
                              )}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: "600",
                                  fontSize: "13px",
                                  color: "#1a1f36",
                                }}
                              >
                                {p.name}
                              </div>
                              {p.barcode && (
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#9ca3af",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                >
                                  <MdQrCode size={10} />
                                  {p.barcode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          {p.category ? (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "#f0f2f8",
                                color: "#374151",
                              }}
                            >
                              {p.category?.name}
                            </span>
                          ) : (
                            <span
                              style={{ color: "#d1d5db", fontSize: "12px" }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#16a34a",
                          }}
                        >
                          {Number(p.sellPrice).toLocaleString("ar-EG")} ج.م
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          {Number(p.buyPrice).toLocaleString("ar-EG")} ج.م
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "center",
                            fontSize: "13px",
                            fontWeight: "700",
                            color: profit > 0 ? "#10b981" : "#ef4444",
                          }}
                        >
                          {profit.toLocaleString("ar-EG")} ج.م
                        </td>

                        {/* Stock +/- */}
                        <td
                          style={{ padding: "12px 16px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "5px",
                            }}
                          >
                            <button
                              onClick={() =>
                                setStockModal({ product: p, type: "remove" })
                              }
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#fee2e2",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#dc2626",
                                fontSize: "14px",
                                fontWeight: "700",
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: "800",
                                color:
                                  p.quantity <= p.minQuantity
                                    ? "#dc2626"
                                    : "#1a1f36",
                                minWidth: "28px",
                                textAlign: "center",
                              }}
                            >
                              {p.quantity}
                            </span>
                            <button
                              onClick={() =>
                                setStockModal({ product: p, type: "add" })
                              }
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "6px",
                                border: "none",
                                background: "#dcfce7",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#16a34a",
                                fontSize: "14px",
                                fontWeight: "700",
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* emptyQuantity column */}
                        {/* <td style={{ textAlign: "center", fontSize: "13px" }}>
                          {p.emptyQuantity || 0}
                        </td> */}

                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 10px",
                              borderRadius: "20px",
                              background: st.bg,
                              color: st.color,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              width: "fit-content",
                            }}
                          >
                            <span
                              style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: st.dot,
                              }}
                            />
                            {st.label}
                          </span>
                        </td>

                        <td
                          style={{ padding: "12px 16px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "0.375rem",
                              justifyContent: "center",
                            }}
                          >
                            {[
                              {
                                icon: <MdModeEdit size={15} />,
                                action: () =>
                                  setModal({ type: "edit", product: p }),
                                hover: {
                                  bg: "#eff6ff",
                                  border: "#bfdbfe",
                                  color: "#1e3a8a",
                                },
                              },
                              {
                                icon: <MdDelete size={15} />,
                                action: () =>
                                  setModal({ type: "delete", product: p }),
                                hover: {
                                  bg: "#fef2f2",
                                  border: "#fecaca",
                                  color: "#dc2626",
                                },
                              },
                            ].map((btn, i) => (
                              <button
                                key={i}
                                onClick={btn.action}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "8px",
                                  border: "1px solid #e5e7eb",
                                  background: "#f9fafb",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#374151",
                                  transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    btn.hover.bg;
                                  e.currentTarget.style.borderColor =
                                    btn.hover.border;
                                  e.currentTarget.style.color = btn.hover.color;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#f9fafb";
                                  e.currentTarget.style.borderColor = "#e5e7eb";
                                  e.currentTarget.style.color = "#374151";
                                }}
                              >
                                {btn.icon}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                borderTop: "1px solid #f0f2f8",
              }}
            >
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                عرض {(page - 1) * LIMIT + 1}–
                {Math.min(page * LIMIT, totalItems)} من {totalItems}
              </span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  className="text-gray-600 text-lg"
                  disabled={page === 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    fetchProducts(page - 1);
                  }}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    opacity: page === 1 ? 0.4 : 1,
                    fontSize: "13px",
                  }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pg) => (
                    <button
                      key={pg}
                      onClick={() => {
                        setPage(pg);
                        fetchProducts(pg);
                      }}
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: page === pg ? "none" : "1px solid #e5e7eb",
                        background: page === pg ? "#1e3a8a" : "#fff",
                        color: page === pg ? "#fff" : "#4b5563",
                        cursor: "pointer",
                      }}
                    >
                      {pg}
                    </button>
                  ),
                )}
                <button
                  disabled={page === totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchProducts(page + 1);
                  }}
                  className="text-gray-600 text-lg"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    opacity: page === totalPages ? 0.4 : 1,
                    fontSize: "13px",
                  }}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
