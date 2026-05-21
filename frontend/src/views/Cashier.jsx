import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  MdDelete,
  MdSearch,
  MdShop,
  MdShoppingBasket,
  MdShoppingCartCheckout,
  MdStar,
} from "react-icons/md";
import { FaProductHunt } from "react-icons/fa";
import productMockImg from "../assets/roh.jpeg";
import useBarcodeScanner from "../hooks/useBarcodeScanner";

const apiUrl = import.meta.env.VITE_API_URL;
const STATIC =
  import.meta.env.VITE_BACKEND_STATIC_URL || "http://localhost:6060";

// ── Constants ─────────────────────────────────────────────────────────────────
const DT = { FIXED: "fixed", PERCENT: "percent" };
const PM = { NOW: "now", LATER: "later", PARTIAL: "partial" };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const genInvoice = () =>
  `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// scanner
function QRScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | scanning | unsupported | error
  const [manualInput, setManualInput] = useState("");
  const lastScan = useRef({ value: "", time: 0 });

  useEffect(() => {
    if (!("BarcodeDetector" in window)) {
      setStatus("unsupported");
      return;
    }
    startCamera();
    return stopCamera;
  }, []);

  const startCamera = async () => {
    try {
      detectorRef.current = new window.BarcodeDetector({
        formats: [
          "qr_code",
          "code_128",
          "code_39",
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
        ],
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("scanning");
        scheduleScan();
      }
    } catch (e) {
      setStatus("error");
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const scheduleScan = () => {
    const scan = async () => {
      if (videoRef.current?.readyState >= 2) {
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          if (codes.length) {
            const val = codes[0].rawValue;
            const now = Date.now();
            if (
              val !== lastScan.current.value ||
              now - lastScan.current.time > 2000
            ) {
              lastScan.current = { value: val, time: now };
              stopCamera();
              onDetected(val);
              return;
            }
          }
        } catch (_) {}
      }
      rafRef.current = requestAnimationFrame(scan);
    };
    rafRef.current = requestAnimationFrame(scan);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onDetected(manualInput.trim());
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 4000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{ width: "min(440px, 94vw)" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h3
              style={{
                color: "#fff",
                margin: "0 0 2px",
                fontSize: "18px",
                fontWeight: "800",
              }}
            >
              مسح QR / باركود
            </h3>
            <p style={{ color: "#9ca3af", margin: 0, fontSize: "12px" }}>
              وجّه الكاميرا نحو الكود
            </p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Camera view */}
        {(status === "loading" || status === "scanning") && (
          <div
            style={{
              position: "relative",
              borderRadius: "20px",
              overflow: "hidden",
              background: "#111",
              aspectRatio: "4/3",
            }}
          >
            <video
              ref={videoRef}
              muted
              playsInline
              style={{ width: "100%", display: "block" }}
            />

            {/* Scanning overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ position: "relative", width: 180, height: 180 }}>
                {/* corners */}
                {[
                  { top: 0, right: "auto", bottom: "auto", left: 0 },
                  { top: 0, right: 0, bottom: "auto", left: "auto" },
                  { top: "auto", right: "auto", bottom: 0, left: 0 },
                  { top: "auto", right: 0, bottom: 0, left: "auto" },
                ].map((pos, i) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      ...pos,
                      width: 28,
                      height: 28,
                      borderTop: i < 2 ? "3px solid #22c55e" : "none",
                      borderBottom: i >= 2 ? "3px solid #22c55e" : "none",
                      borderLeft: i % 2 === 0 ? "3px solid #22c55e" : "none",
                      borderRight: i % 2 !== 0 ? "3px solid #22c55e" : "none",
                    }}
                  />
                ))}
                {/* scanning line animation */}
                <div
                  style={{
                    position: "absolute",
                    left: 4,
                    right: 4,
                    height: 2,
                    background:
                      "linear-gradient(90deg, transparent, #22c55e, transparent)",
                    animation: "scanLine 1.8s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            {status === "loading" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                جاري تشغيل الكاميرا…
              </div>
            )}
          </div>
        )}

        {/* Unsupported / error: manual input */}
        {(status === "unsupported" || status === "error") && (
          <div
            style={{
              background: "rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>
              {status === "error" ? "📵" : "🔍"}
            </div>
            <p
              style={{ color: "#e5e7eb", margin: "0 0 1rem", fontSize: "14px" }}
            >
              {status === "error"
                ? "لا يمكن الوصول للكاميرا. أدخل الباركود يدوياً."
                : "المتصفح لا يدعم المسح. أدخل الباركود يدوياً."}
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                autoFocus
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="الباركود أو اسم المنتج"
                style={{
                  flex: 1,
                  height: "44px",
                  padding: "0 0.875rem",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  textAlign: "right",
                }}
              />
              <button
                onClick={handleManualSubmit}
                style={{
                  height: "44px",
                  padding: "0 1rem",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                بحث
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 4px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 6px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT
// ─────────────────────────────────────────────────────────────────────────────
function Receipt({ data, onNewSale }) {
  const contentRef = useRef(null);

  const statusMeta = {
    PAID: { label: "مدفوع بالكامل ✓", color: "#16a34a", bg: "#f0fdf4" },
    DEBT: { label: "دين — غير مدفوع", color: "#dc2626", bg: "#fef2f2" },
    PARTIAL: { label: "مدفوع جزئياً", color: "#d97706", bg: "#fffbeb" },
  }[data.status] || { label: data.status, color: "#6b7280", bg: "#f3f4f6" };

  const handlePrint = () => {
    const html = contentRef.current.innerHTML;
    const win = window.open("", "_blank", "width=400,height=700");
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>إيصال #${data.saleId}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Courier New',monospace;font-size:12px;width:302px;direction:rtl;padding:8px}
        .c{text-align:center}.b{font-weight:bold}
        .dash{border-top:1px dashed #000;margin:6px 0}
        .row{display:flex;justify-content:space-between;padding:3px 0}
        .big{font-size:16px;font-weight:900}
        .status{text-align:center;padding:5px;border:1px dashed currentColor;margin-top:8px;font-weight:bold}
      </style>
    </head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };
  // console.log(data);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "24px",
          width: "min(440px, 96vw)",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
        }}
      >
        {/* Toolbar */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: "800",
              color: "#1a1f36",
            }}
          >
            🧾 الإيصال
          </h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handlePrint}
              autoFocus
              style={{
                height: "38px",
                padding: "0 1rem",
                background: "#1e3a8a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              🖨 طباعة
            </button>
            <button
              onClick={onNewSale}
              style={{
                height: "38px",
                width: "38px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: "700",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          <div
            ref={contentRef}
            dir="rtl"
            style={{ fontFamily: "'Courier New', monospace", fontSize: "13px" }}
          >
            {/* Store header */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <div
                className="text-gray-800 font-extrabold"
                style={{
                  fontSize: "20px",
                  fontWeight: "900",
                  letterSpacing: 2,
                }}
              >
                روح العود
              </div>

              {/* <div style={{ color: "#6b7280", fontSize: "11px", marginTop: 2 }}>
                نظام كاشير POS
              </div> */}
              <div
                style={{ borderTop: "1px dashed #d1d5db", margin: "8px 0" }}
              />
              <div style={{ fontSize: "12px" }} className="text-gray-800">
                رقم الفاتورة:{" "}
                <strong style={{ color: "#1e3a8a" }}>#{data.invoiceNumber}</strong>
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                {new Date(data.createdAt).toLocaleString("ar-EG")}
              </div>
            </div>

            <div style={{ borderTop: "1px dashed #d1d5db", margin: "8px 0" }} />

            {/* Items */}
            {data.items.map((item, i) => (
              <div
                key={i}
                className="text-gray-600"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                  fontSize: "12px",
                }}
              >
                <span style={{ flex: 1, paddingLeft: 8 }}>{item.name}</span>
                <span style={{ color: "#6b7280", marginLeft: 6 }}>
                  ×{item.quantity}
                </span>
                <span
                  style={{ fontWeight: "700", minWidth: 68, textAlign: "left" }}
                >
                  {fmt(item.price * item.quantity)} ج
                </span>
              </div>
            ))}

            <div style={{ borderTop: "1px dashed #d1d5db", margin: "8px 0" }} />

            {/* Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                padding: "2px 0",
                color: "#6b7280",
              }}
            >
              <span>المجموع الفرعي</span>
              <span>{fmt(data.subtotal)} ج.م</span>
            </div>
            {data.discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  padding: "2px 0",
                  color: "#dc2626",
                }}
              >
                <span>الخصم</span>
                <span>- {fmt(data.discount)} ج.م</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0 0",
                marginTop: 4,
                borderTop: "2px solid #1e3a8a",
                fontSize: "16px",
                fontWeight: "900",
                color: "#1a1f36",
              }}
            >
              <span>الإجمالي</span>
              <span>{fmt(data.total)} ج.م</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                padding: "3px 0",
                color: "#16a34a",
              }}
            >
              <span>المدفوع</span>
              <span>{fmt(data.paidAmount)} ج.م</span>
            </div>
            {data.remainingAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  padding: "3px 0",
                  color: "#dc2626",
                }}
              >
                <span>المتبقي (دين)</span>
                <span>{fmt(data.remainingAmount)} ج.م</span>
              </div>
            )}

            {/* Customer (if debt) */}
            {data.customerName && (
              <>
                <div
                  style={{ borderTop: "1px dashed #d1d5db", margin: "8px 0" }}
                />
                <div style={{ fontSize: "12px", color: "#374151" }}>
                  <div>
                    العميل: <strong>{data.customerName}</strong>
                  </div>
                  {data.customerPhone && (
                    <div>الهاتف: {data.customerPhone}</div>
                  )}
                </div>
              </>
            )}

            <div style={{ borderTop: "1px dashed #d1d5db", margin: "8px 0" }} />

            {/* Status badge */}
            <div
              style={{
                textAlign: "center",
                padding: "6px 10px",
                borderRadius: "8px",
                background: statusMeta.bg,
                color: statusMeta.color,
                fontWeight: "800",
                fontSize: "14px",
              }}
            >
              {statusMeta.label}
            </div>
            <div
              style={{
                textAlign: "center",
                marginTop: "10px",
                fontSize: "11px",
                color: "#9ca3af",
              }}
            >
              شكراً لتعاملكم معنا 🙏
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CheckoutModal({
  cart,
  subtotal,
  discountAmount,
  total,
  onClose,
  onSuccess,
}) {
  const [payMode, setPayMode] = useState(PM.NOW);
  const [partialInput, setPartialInput] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const partialPaid = parseFloat(partialInput) || 0;

  const paidAmount =
    payMode === PM.NOW ? total : payMode === PM.LATER ? 0 : partialPaid;
  const remainingAmount = Math.max(0, total - paidAmount);
  const saleStatus =
    payMode === PM.NOW ? "PAID" : payMode === PM.LATER ? "DEBT" : "PARTIAL";

  const isValid = () => {
    if (payMode === PM.PARTIAL) {
      if (partialPaid <= 0 || partialPaid >= total) return false;
    }
    if (payMode !== PM.NOW && !customerName.trim()) return false;
    return true;
  };

  const handleConfirm = async () => {
    if (!isValid() || loading) return;
    setLoading(true);
    setError("");

    try {
      const invoiceNumber = genInvoice();

      // if (payMode === PM.NOW) {
      //   // ── Pay Now: use existing /products/sell per item ──────────────────
      //   for (const item of cart) {
      //     await axios.post(`${apiUrl}/products/sell`, {
      //       productID: item.product.id,
      //       quantity: item.quantity,
      //     });
      //   }
      // } else {
      //   // ── Debt / Partial: deduct stock via /products/stock ───────────────
      //   for (const item of cart) {
      //     await axios.post(`${apiUrl}/products/stock`, {
      //       productID: item.product.id,
      //       type: "remove",
      //       quantity: item.quantity,
      //       notes: `بيع كاشير - ${saleStatus === "DEBT" ? "دين" : "دفع جزئي"}`,
      //     });
      //   }

      // Create indebtedness record if there's remaining
      // if (remainingAmount > 0) {
      //   await axios
      //     .post(`${apiUrl}/debts`, {
      //       customerName: customerName.trim(),
      //       customerPhone: customerPhone.trim() || null,
      //       invoiceNumber,
      //       totalAmount: total,
      //       paidAmount,
      //       remainingAmount,
      //       notes: `فاتورة كاشير — ${invoiceNumber}`,
      //       status: saleStatus === "DEBT" ? "pending" : "partial",
      //     })
      //     .catch((e) => {
      //       console.warn(
      //         "Debt record endpoint unavailable (POST /debts):",
      //         e.message,
      //       );
      //     });
      // }
      // }

      // Create sale record (new endpoint — graceful if not yet implemented)
      let saleId = Math.floor(Math.random() * 90000) + 10000;
      await axios
        .post(`${apiUrl}/sales`, {
          invoiceNumber,
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            price: parseFloat(i.product.sellPrice),
          })),
          totalPrice: total,
          discount: discountAmount,
          paidAmount,
          remainingAmount,
          status: saleStatus,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
        })
        .then((res) => {
          if (res.data?.sale?.id) saleId = res.data.sale.id;
        })
        .catch(() => {});

      onSuccess({
        saleId,
        invoiceNumber,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: parseFloat(i.product.sellPrice),
        })),
        subtotal,
        discount: discountAmount,
        total,
        paidAmount,
        remainingAmount,
        status: saleStatus,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
      setError(
        e.response?.data?.Message ||
          "حدث خطأ أثناء المعالجة. تحقق من الاتصال وأعد المحاولة.",
      );
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    {
      id: PM.NOW,
      icon: "💵",
      label: "دفع الآن",
      sub: "نقداً / بطاقة",
      color: "#16a34a",
    },
    {
      id: PM.PARTIAL,
      icon: "💳",
      label: "دفع جزئي",
      sub: "والباقي دين",
      color: "#d97706",
    },
    {
      id: PM.LATER,
      icon: "📋",
      label: "دين كامل",
      sub: "لاحقاً",
      color: "#dc2626",
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 3500,
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
          borderRadius: "24px",
          width: "min(520px, 96vw)",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 28px 80px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 3px",
                fontSize: "20px",
                fontWeight: "900",
                color: "#1a1f36",
              }}
            >
              إتمام الشراء
            </h2>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "15px" }}>
              {cart.length} منتج في السلة
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              border: "none",
              background: "#f3f4f6",
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: "16px",
              color: "#6b7280",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Order summary */}
          <div
            style={{
              background: "#f8f9fc",
              borderRadius: "14px",
              padding: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "15px",
                fontWeight: "700",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              ملخص الطلب
            </p>
            {cart.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                  fontSize: "17px",
                }}
              >
                <span style={{ color: "#374151" }}>
                  {item.product.name}{" "}
                  <span style={{ color: "#9ca3af" }}>×{item.quantity}</span>
                </span>
                <span style={{ fontWeight: "600", color: "#374151" }}>
                  {fmt(item.product.sellPrice * item.quantity)} ج.م
                </span>
              </div>
            ))}
            {discountAmount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "4px 0 0",
                  marginTop: 6,
                  borderTop: "1px dashed #e5e7eb",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                <span>الخصم</span>
                <span>- {fmt(discountAmount)} ج.م</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0 0",
                marginTop: 6,
                borderTop: "2px solid #1e3a8a",
                fontSize: "20px",
                fontWeight: "900",
                color: "#1e3a8a",
              }}
            >
              <span>الإجمالي</span>
              <span>{fmt(total)} ج.م</span>
            </div>
          </div>

          {/* Payment mode selector */}
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "14px",
              fontWeight: "700",
              color: "#374151",
            }}
          >
            طريقة الدفع
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayMode(m.id)}
                style={{
                  padding: "0.875rem 0.5rem",
                  border: `2px solid ${payMode === m.id ? m.color : "#e5e7eb"}`,
                  borderRadius: "12px",
                  background: payMode === m.id ? `${m.color}12` : "#f9fafb",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: "22px" }}>{m.icon}</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: payMode === m.id ? "800" : "600",
                    color: payMode === m.id ? m.color : "#374151",
                  }}
                >
                  {m.label}
                </span>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {m.sub}
                </span>
              </button>
            ))}
          </div>

          {/* Partial amount input */}
          {payMode === PM.PARTIAL && (
            <div
              style={{
                background: "#fffbeb",
                border: "1.5px solid #fcd34d",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#92400e",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                المبلغ المدفوع الآن (ج.م)
              </label>
              <input
                type="number"
                value={partialInput}
                onChange={(e) => setPartialInput(e.target.value)}
                placeholder="0.00"
                onWheel={(e) => e.target.blur()}
                min="0.01"
                max={total - 0.01}
                step="0.01"
                autoFocus
                className="text-amber-600"
                style={{
                  width: "100%",
                  height: "48px",
                  padding: "0 1rem",
                  border: "2px solid #fcd34d",
                  borderRadius: "10px",
                  fontSize: "18px",
                  fontFamily: "inherit",
                  outline: "none",
                  textAlign: "right",
                  fontWeight: "700",
                  boxSizing: "border-box",
                }}
              />
              {partialPaid > 0 && partialPaid < total && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#16a34a" }}>
                    المدفوع: {fmt(partialPaid)} ج.م
                  </span>
                  <span style={{ color: "#dc2626", fontWeight: "700" }}>
                    الدين: {fmt(total - partialPaid)} ج.م
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Customer info (debt modes) */}
          {payMode !== PM.NOW && (
            <div
              style={{
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <label
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#991b1b",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                بيانات العميل{" "}
                <span style={{ color: "#dc2626" }}>* مطلوب للدين</span>
              </label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم العميل *"
                className="text-gray-600"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 0.875rem",
                  border: "1.5px solid #fecaca",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  marginBottom: "0.5rem",
                  boxSizing: "border-box",
                  textAlign: "right",
                  background: "#fff",
                }}
              />
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="رقم الهاتف (اختياري)"
                className="text-gray-600"
                style={{
                  width: "100%",
                  height: "44px",
                  padding: "0 0.875rem",
                  border: "1.5px solid #fecaca",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  textAlign: "right",
                  background: "#fff",
                }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "0.75rem 1rem",
                color: "#dc2626",
                fontSize: "13px",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
              }}
            >
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Confirm / Cancel */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={handleConfirm}
              disabled={!isValid() || loading}
              style={{
                height: "54px",
                background:
                  isValid() && !loading
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "#d1d5db",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                fontSize: "16px",
                fontWeight: "800",
                cursor: isValid() && !loading ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                transition: "all 0.15s",
                boxShadow:
                  isValid() && !loading
                    ? "0 4px 16px rgba(22,163,74,0.3)"
                    : "none",
              }}
            >
              {loading ? (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(255,255,255,0.4)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  جاري المعالجة…
                </span>
              ) : (
                "✓ تأكيد الدفع"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                height: "54px",
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CART ITEM
// ─────────────────────────────────────────────────────────────────────────────
function CartItem({ item, onQtyChange, onRemove }) {
  const { product, quantity } = item;
  const atMax = quantity >= product.storeQuantity;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.625rem 0.75rem",
        background: "#f8f9fc",
        borderRadius: "11px",
        border: "1px solid #eef0f5",
      }}
    >
      {/* Thumb */}
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          background: "linear-gradient(135deg,#f1f3f9,#e8ecf8)",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {product.image ? (
          <img
            src={`${STATIC}/${product.image}`}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <span style={{ fontSize: "16px" }}>📦</span>
        )}
      </div>

      {/* Name + price */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 1px",
            fontSize: "18px",
            fontWeight: "700",
            color: "#1a1f36",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </p>
        <span style={{ fontSize: "15px", color: "#16a34a", fontWeight: "600" }}>
          {fmt(product.sellPrice)} ج.م
        </span>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onRemove}
          title="حذف"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "none",
            background: "#fef2f2",
            color: "#dc2626",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MdDelete size={16} />
        </button>
        <button
          onClick={() => onQtyChange(quantity - 1)}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "700",
            color: "#374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          −
        </button>
        <span
          style={{
            minWidth: "24px",
            textAlign: "center",
            fontSize: "14px",
            fontWeight: "900",
            color: "#1e3a8a",
          }}
        >
          {quantity}
        </span>
        <button
          onClick={() => !atMax && onQtyChange(quantity + 1)}
          disabled={atMax}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: `1.5px solid ${atMax ? "#e5e7eb" : "#1e3a8a"}`,
            background: atMax ? "#f3f4f6" : "#eaeefc",
            cursor: atMax ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "700",
            color: atMax ? "#9ca3af" : "#1e3a8a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <div
        style={{
          minWidth: "62px",
          textAlign: "left",
          fontSize: "17px",
          fontWeight: "800",
          color: "#1a1f36",
          flexShrink: 0,
        }}
      >
        {fmt(product.sellPrice * quantity)} ج
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD (search / grid)
// ─────────────────────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, cartQty }) {
  const isOut = product.storeQuantity === 0;
  const isLow = !isOut && product.storeQuantity <= product.minQuantity;
  const inCart = cartQty > 0;

  return (
    <div
      onClick={() => !isOut && onAdd(product)}
      style={{
        background: "#fff",
        borderRadius: "14px",
        border: `1.5px solid ${inCart ? "#1e3a8a" : isOut ? "#fecaca" : "#eef0f5"}`,
        overflow: "hidden",
        cursor: isOut ? "not-allowed" : "pointer",
        opacity: isOut ? 0.65 : 1,
        transition: "all 0.15s",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        if (!isOut)
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(30,58,138,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* In-cart badge */}
      {inCart && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#1e3a8a",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: "800",
            zIndex: 1,
          }}
        >
          {cartQty}
        </div>
      )}

      {/* Image */}
      <div
        style={{
          height: 120,
          background: "linear-gradient(135deg,#f1f3f9,#e8ecf8)",
          // background: "#FFEFCC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {product.image ? (
          <img
            src={`${STATIC}/${product.image}`}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <img
            src={productMockImg}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {/* stock label */}
        <span
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            fontSize: "16px",
            fontWeight: "700",
            padding: "2px 6px",
            borderRadius: "12px",
            background: isOut ? "#fef2f2" : isLow ? "#fffbeb" : "#f0fdf4",
            color: isOut ? "#dc2626" : isLow ? "#92400e" : "#15803d",
          }}
        >
          {isOut ? "نفذ" : `${product.storeQuantity}`}
        </span>
      </div>

      {/* Info */}
      <div
        style={{
          padding: "0.5rem 0.625rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <p
          className="text-xl"
          style={{
            margin: 0,
            fontWeight: "700",
            color: "#1a1f36",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </p>
        {product.category?.name && (
          <span
            className="text-sm "
            style={{ fontSize: "11px", color: "#9ca3af" }}
          >
            {product.category.name}
          </span>
        )}
        <span
          style={{
            fontSize: "20px",
            fontWeight: "800",
            color: "#16a34a",
            marginTop: "auto",
            marginBottom: "5%",
          }}
        >
          {fmt(product.sellPrice)} ج.م
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const colors = {
    success: { bg: "#16a34a", icon: "✓" },
    error: { bg: "#dc2626", icon: "⚠" },
    info: { bg: "#1e3a8a", icon: "ℹ" },
  };
  const c = colors[type] || colors.info;
  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: c.bg,
        color: "#fff",
        padding: "0.75rem 1.5rem",
        borderRadius: "14px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
        animation: "toastIn 0.3s ease",
        whiteSpace: "nowrap",
        maxWidth: "90vw",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {c.icon} {msg}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CASHIER PAGE
// ─────────────────────────────────────────────────────────────────────────────
function Cashier() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  const [cart, setCart] = useState([]);

  const [discountType, setDiscountType] = useState(DT.FIXED);
  const [discountInput, setDiscountInput] = useState("");
  const [discountValue, setDiscountValue] = useState(0); // actual deducted amount

  const [showScanner, setShowScanner] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [toast, setToast] = useState(null); // { msg, type }

  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  const barcodeMapRef = useRef({});

  // ── Calculations ────────────────────────────────────────────────────────────
  const subtotal = cart.reduce(
    (s, i) => s + parseFloat(i.product.sellPrice) * i.quantity,
    0,
  );
  const discountAmount =
    discountType === DT.PERCENT
      ? subtotal * (discountValue / 100)
      : discountValue;
  const total = Math.max(0, subtotal - discountAmount);
  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (q = "", catId = null) => {
    setSearchLoading(true);
    try {
      const params = { limit: 80, cashier: true };
      if (q) params.search = q;
      if (catId && catId !== "all") params.categoryId = catId;
      const res = await axios.get(`${apiUrl}/products`, { params });
      const prods = res.data.products || [];
      // console.log(prods);
      setProducts(prods);
      // collect categories from results
      const cats = {};
      prods.forEach((p) => {
        if (p.category?.id) cats[p.category.id] = p.category.name;
      });
      setCategories(Object.entries(cats).map(([id, name]) => ({ id, name })));
    } catch (e) {
      console.error(e);
      showToast("تعذّر تحميل المنتجات", "error");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    setTimeout(() => searchRef.current?.focus(), 150);
  }, []);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    fetchProducts(search, catId);
  };

  // ── Cart logic ───────────────────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        if (exists.quantity >= product.storeQuantity) {
          showToast(`الكمية القصوى المتاحة: ${product.storeQuantity}`, "error");
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      if (product.storeQuantity === 0) {
        showToast(`"${product.name}" غير متوفر في المحل`, "error");
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => {
        if (i.product.id !== productId) return i;
        return { ...i, quantity: Math.min(newQty, i.product.storeQuantity) };
      }),
    );
  };

  const removeFromCart = (productId) =>
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

  const clearCart = () => {
    setCart([]);
    setDiscountInput("");
    setDiscountValue(0);
  };

  // ── QR scan handler ──────────────────────────────────────────────────────────
  const handleScan = async (value) => {
    setShowScanner(false);
    showToast(`جاري البحث: ${value}`, "info");
    try {
      const res = await axios.get(`${apiUrl}/products`, {
        params: { search: value, limit: 10, cashier: true },
      });
      const prods = res.data.products || [];
      // Prefer exact barcode match
      const found = prods.find((p) => p.barcode === value) || prods[0];
      if (!found) {
        showToast(`لم يُعثر على منتج: ${value}`, "error");
      } else if (found.quantity === 0) {
        showToast(`"${found.name}" نفذ من المخزن`, "error");
      } else {
        addToCart(found);
        showToast(`تمت إضافة "${found.name}"`, "success");
      }
    } catch {
      showToast("خطأ في الاتصال بالخادم", "error");
    }
  };

  // ── Discount ─────────────────────────────────────────────────────────────────
  const handleDiscountInput = (val) => {
    setDiscountInput(val);
    const num = parseFloat(val) || 0;
    if (discountType === DT.PERCENT) {
      setDiscountValue(Math.min(100, Math.max(0, num)));
    } else {
      setDiscountValue(Math.min(subtotal, Math.max(0, num)));
    }
  };

  const switchDiscountType = (type) => {
    setDiscountType(type);
    setDiscountInput("");
    setDiscountValue(0);
  };

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleBarcodeScanned = useCallback(
    async (barcode) => {
      if (barcodeMapRef.current[barcode] === "pending") return;

      try {
        let product = barcodeMapRef.current[barcode];
        if (!product) {
          barcodeMapRef.current[barcode] = "pending";
          const res = await axios.get(`${apiUrl}/products`, {
            params: { barcode },
          });
          product = res.data.product;
          if (!product) {
            showToast(`المنتج غير موجود (باركود: ${barcode})`, "error");
            delete barcodeMapRef.current[barcode];
            return;
          }
          barcodeMapRef.current[barcode] = product;
        }

        if (product.storeQuantity <= 0) {
          showToast(`"${product.name}" غير متوفر في المحل`, "error");
          return;
        }

        addToCart(product);
        showToast(`تمت إضافة "${product.name}"`, "success");
      } catch (err) {
        console.error(err);
        showToast("خطأ في الاتصال بالخادم", "error");
      } finally {
        if (barcodeMapRef.current[barcode] === "pending") {
          delete barcodeMapRef.current[barcode];
        }
      }
    },
    [addToCart, showToast],
  );

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => fetchProducts(val, activeCategory),
      280,
    );
  };

  const handleSearchKeyDown = async (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    // console.log(e.target.value);
    const barcode = search.trim();

    if (!barcode) return;

    await handleBarcodeScanned(barcode);
    setSearch("");
  };

  useBarcodeScanner(handleBarcodeScanned, { minLength: 4, cooldown: 800 });

  // ── Checkout success ──────────────────────────────────────────────────────────
  const handleCheckoutSuccess = (receiptData) => {
    setShowCheckout(false);
    setReceipt(receiptData);
    clearCart();
    fetchProducts(search, activeCategory);
    showToast("تمت عملية البيع بنجاح ✓", "success");
  };

  // ── Render helpers ───────────────────────────────────────────────────────────
  const cartMap = Object.fromEntries(
    cart.map((i) => [i.product.id, i.quantity]),
  );

  return (
    <div
      dir="rtl"
      className="bg-gray-50"
      style={{
        // background: "#f0f2f8",
        minHeight: "100vh",
        fontFamily: "inherit",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Global styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(-12px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Scanner */}
      {showScanner && (
        <QRScanner
          onDetected={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Checkout */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {/* Receipt */}
      {receipt && (
        <Receipt
          data={receipt}
          onNewSale={() => {
            setReceipt(null);
            setTimeout(() => {
              searchRef.current?.focus();
            }, 100);
          }}
        />
      )}

      {/* ── TOP BAR ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0.75rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            className="text-xl font-extrabold"
            style={{
              margin: "0 0 1px",
              color: "#1a1f36",
            }}
          >
            كاشير
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
            نظام نقاط البيع
          </p>
        </div>

        {/* Search */}
        <div style={{ flex: 1, position: "relative", maxWidth: 480 }}>
          <MdSearch
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="ابحث بالاسم أو الباركود…"
            className="text-gray-600"
            style={{
              width: "100%",
              height: "44px",
              padding: "0 2.75rem 0 2.5rem",
              border: "2px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "16px",
              background: "#f8f9fc",
              outline: "none",
              fontFamily: "inherit",
              direction: "rtl",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
            onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                fetchProducts("", activeCategory);
              }}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#e5e7eb",
                border: "none",
                borderRadius: "50%",
                width: "22px",
                height: "22px",
                cursor: "pointer",
                color: "#6b7280",
                fontSize: "12px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* QR button */}
        {/* <button
          onClick={() => setShowScanner(true)}
          style={{
            height: "44px",
            padding: "0 1rem",
            background: "#1e3a8a",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "14px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          📷 مسح QR
        </button> */}
      </div>

      {/* ── MAIN BODY ── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          height: "calc(100vh - 69px)",
          position: "relative",
        }}
      >
        {/* ── LEFT: Products ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "1rem",
            marginLeft: "360px",
          }}
        >
          {/* Category chips */}
          {categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                overflowX: "auto",
                paddingBottom: "0.75rem",
                flexShrink: 0,
              }}
            >
              {[{ id: "all", name: "الكل" }, ...categories].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    flexShrink: 0,
                    height: "32px",
                    padding: "0 1rem",
                    border: `1.5px solid ${activeCategory === cat.id ? "#1e3a8a" : "#e5e7eb"}`,
                    borderRadius: "20px",
                    background: activeCategory === cat.id ? "#1e3a8a" : "#fff",
                    color: activeCategory === cat.id ? "#fff" : "#6b7280",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: "16px",
                    fontWeight: "600",
                    transition: "all 0.15s",
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {searchLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #1e3a8a",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            ) : products.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "#9ca3af",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: 8 }}>📦</div>
                <p className="text-xl" style={{ margin: 0 }}>
                  لا توجد منتجات مطابقة
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAdd={addToCart}
                    cartQty={cartMap[p.id] || 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart + Payment ── */}
        <div
          style={{
            position: "fixed",
            top: "62px",
            left: 0,
            width: "360px",
            height: "calc(100vh - 69px)",
            borderLeft: "1px solid #e5e7eb",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 20,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.04)",
          }}
        >
          {/* Cart header */}
          <div
            style={{
              padding: "1rem",
              borderBottom: "1px solid #f3f4f6",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "800",
                    color: "#1a1f36",
                  }}
                >
                  🛒 السلة
                </h2>
                {cartItemCount > 0 && (
                  <span
                    style={{
                      background: "#1e3a8a",
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: "700",
                      padding: "1px 7px",
                      borderRadius: "12px",
                    }}
                  >
                    {cartItemCount}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  style={{
                    fontSize: "13px",
                    color: "#dc2626",
                    background: "#fef2f2",
                    border: "none",
                    borderRadius: "6px",
                    padding: "3px 8px",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  مسح الكل ✕
                </button>
              )}
            </div>
          </div>

          {/* Cart items */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  textAlign: "center",
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontSize: "44px", marginBottom: 8 }}>🛒</div>
                <p style={{ margin: 0, fontSize: "19px", lineHeight: 1.6 }}>
                  السلة فارغة
                  <br />
                  اضغط على منتج لإضافته
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onQtyChange={(qty) => updateQty(item.product.id, qty)}
                  onRemove={() => removeFromCart(item.product.id)}
                />
              ))
            )}
          </div>

          {/* Bottom: discount + totals + checkout */}
          {cart.length > 0 && (
            <div
              style={{
                borderTop: "1px solid #f3f4f6",
                padding: "0.875rem",
                flexShrink: 0,
              }}
            >
              {/* Discount */}
              <div style={{ marginBottom: "0.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    gap: "0.375rem",
                    marginBottom: "0.375rem",
                  }}
                >
                  {[
                    { id: DT.FIXED, label: "خصم ثابت" },
                    { id: DT.PERCENT, label: "نسبة %" },
                  ].map((dt) => (
                    <button
                      key={dt.id}
                      onClick={() => switchDiscountType(dt.id)}
                      style={{
                        flex: 1,
                        height: "30px",
                        border: `1.5px solid ${discountType === dt.id ? "#1e3a8a" : "#e5e7eb"}`,
                        borderRadius: "7px",
                        background:
                          discountType === dt.id ? "#eaeefc" : "#f9fafb",
                        color: discountType === dt.id ? "#1e3a8a" : "#9ca3af",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "15px",
                        fontWeight: discountType === dt.id ? "700" : "500",
                      }}
                    >
                      {dt.label}
                    </button>
                  ))}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    value={discountInput}
                    onChange={(e) => handleDiscountInput(e.target.value)}
                    placeholder={
                      discountType === DT.FIXED
                        ? "مبلغ الخصم (ج.م)"
                        : "نسبة الخصم (%)"
                    }
                    min="0"
                    className="text-gray-600"
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 2.25rem 0 0.75rem",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "15px",
                      fontFamily: "inherit",
                      outline: "none",
                      textAlign: "right",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "0.625rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "11px",
                      color: "#9ca3af",
                      pointerEvents: "none",
                    }}
                  >
                    {discountType === DT.PERCENT ? "%" : "ج"}
                  </span>
                </div>
              </div>

              {/* Totals */}
              <div
                style={{
                  background: "#f8f9fc",
                  borderRadius: "12px",
                  padding: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#6b7280",
                    marginBottom: 4,
                  }}
                >
                  <span>المجموع الفرعي</span>
                  <span>{fmt(subtotal)} ج.م</span>
                </div>
                {discountAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#dc2626",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      الخصم{" "}
                      {discountType === DT.PERCENT && `(${discountValue}%)`}
                    </span>
                    <span>- {fmt(discountAmount)} ج.م</span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: 8,
                    marginTop: 4,
                    borderTop: "2px solid #1e3a8a",
                    fontSize: "20px",
                    fontWeight: "900",
                    color: "#1e3a8a",
                  }}
                >
                  <span>الإجمالي</span>
                  <span>{fmt(total)} ج.م</span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={() => setShowCheckout(true)}
                autoFocus
                style={{
                  width: "100%",
                  height: "52px",
                  background:
                    "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "14px",
                  fontSize: "18px",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(30,58,138,0.32)",
                  transition: "transform 0.12s, box-shadow 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 26px rgba(30,58,138,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 20px rgba(30,58,138,0.32)";
                }}
              >
                💳 إتمام الدفع {fmt(total)} ج.م
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cashier;
