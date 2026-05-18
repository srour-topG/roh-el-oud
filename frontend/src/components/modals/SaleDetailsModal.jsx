import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import {
  MdClose,
  MdAdd,
  MdRemove,
  MdReplay,
  MdWarningAmber,
} from "react-icons/md";

const apiUrl = import.meta.env.VITE_API_URL;

export default function SaleDetailsModal({
  open,
  sale,
  onClose,
  onReturnSuccess,
}) {
  const [returnItems, setReturnItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [scannerBuffer, setScannerBuffer] = useState("");
  const [scannerActive, setScannerActive] = useState(true);
  const contentRef = useRef(null);

  /* ─────────────────────────────
     RESET STATE
  ───────────────────────────── */

  useEffect(() => {
    if (open) {
      setReturnItems({});
      setError("");
      setShowConfirm(false);

      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open, sale]);

  /* ─────────────────────────────
     ESC TO CLOSE
  ───────────────────────────── */

  const handleEscape = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleEscape]);

  // barcode scanner hardware
  useEffect(() => {
    if (!open || !scannerActive) return;

    let timeout;

    const handleScanner = (e) => {
      // ignore typing in inputs
      const tag = document.activeElement?.tagName;

      if (tag === "INPUT" || tag === "TEXTAREA") {
        return;
      }

      // scanner finished
      if (e.key === "Enter") {
        if (!scannerBuffer) return;

        const code = scannerBuffer.trim();

        const item = sale?.SaleItems.find((i) => i.Product?.barcode === code);

        if (item) {
          const available = item.quantity - (item.returnedQuantity || 0);

          const current = returnItems[item.id] || 0;

          if (current < available) {
            adjustQty(item.id, 1);
          }
        }

        setScannerBuffer("");

        return;
      }

      // barcode chars
      if (e.key.length === 1) {
        setScannerBuffer((prev) => prev + e.key);
      }

      clearTimeout(timeout);

      timeout = setTimeout(() => {
        setScannerBuffer("");
      }, 120);
    };

    window.addEventListener("keydown", handleScanner);

    return () => {
      window.removeEventListener("keydown", handleScanner);
    };
  }, [open, scannerBuffer, sale, returnItems, scannerActive]);

  /* ─────────────────────────────
     CALCULATIONS
  ───────────────────────────── */

  const returnCount = useMemo(
    () => Object.values(returnItems).reduce((a, b) => a + b, 0),
    [returnItems],
  );

  const returnAmount = useMemo(() => {
    let total = 0;

    Object.entries(returnItems).forEach(([id, qty]) => {
      const item = sale?.SaleItems.find((i) => i.id === Number(id));
      if (item) {
        total += qty * Number(item.price);
      }
    });

    return total;
  }, [returnItems, sale]);

  const canSubmit = returnCount > 0;

  /* ─────────────────────────────
     HELPERS
  ───────────────────────────── */

  const adjustQty = (saleItemId, delta) => {
    const saleItem = sale?.SaleItems.find((i) => i.id === saleItemId);

    if (!saleItem) return;

    const available = saleItem.quantity - (saleItem.returnedQuantity || 0);

    setReturnItems((prev) => {
      const current = prev[saleItemId] || 0;

      const next = Math.max(0, Math.min(current + delta, available));

      if (next === 0) {
        const { [saleItemId]: _, ...rest } = prev;

        return rest;
      }

      return {
        ...prev,
        [saleItemId]: next,
      };
    });
  };

  const returnAllAvailable = () => {
    const obj = {};

    sale?.SaleItems.forEach((item) => {
      const available = item.quantity - (item.returnedQuantity || 0);

      if (available > 0) {
        obj[item.id] = available;
      }
    });

    setReturnItems(obj);
  };

  /* ─────────────────────────────
   PRINT
───────────────────────────── */

  const handlePrint = () => {
    if (!sale) return;

    const html = contentRef.current.innerHTML;

    const win = window.open("", "_blank", "width=400,height=700");

    win.document.write(`
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8"/>
    <title>فاتورة #${sale.invoiceNumber}</title>

    <style>
      *{
        margin:0;
        padding:0;
        box-sizing:border-box;
      }

      body{
        font-family:'Courier New', monospace;
        width:302px;
        padding:10px;
        direction:rtl;
        color:#000;
        font-size:12px;
      }

      .center{
        text-align:center;
      }

      .bold{
        font-weight:bold;
      }

      .big{
        font-size:18px;
        font-weight:900;
      }

      .line{
        border-top:1px dashed #000;
        margin:8px 0;
      }

      .row{
        display:flex;
        justify-content:space-between;
        gap:10px;
        padding:3px 0;
      }

      .items{
        margin-top:8px;
      }

      .item{
        padding:6px 0;
        border-bottom:1px dashed #ddd;
      }

      .status{
        margin-top:10px;
        padding:6px;
        border:1px dashed #000;
        text-align:center;
        font-weight:bold;
      }

      .muted{
        color:#555;
      }

      .mt{
        margin-top:6px;
      }

      .total{
        font-size:15px;
        font-weight:900;
      }

      .returned{
        color:#7c3aed;
        font-weight:bold;
        margin-top:3px;
        font-size:11px;
      }
    </style>
  </head>

  <body>
    ${html}
  </body>
  </html>
`);

    win.document.close();

    win.focus();

    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  /* ─────────────────────────────
     SUBMIT
  ───────────────────────────── */

  const submitReturn = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");

    try {
      const items = Object.entries(returnItems).map(
        ([saleItemId, quantity]) => ({
          saleItemId: Number(saleItemId),
          quantity,
        }),
      );

      await axios.post(`${apiUrl}/sales/${sale.id}/return`, {
        items,
      });

      onReturnSuccess();
    } catch (e) {
      setError(e.response?.data?.Message || "حدث خطأ أثناء تنفيذ المرتجع");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !sale) return null;

  /* ─────────────────────────────
     STATUS COLORS
  ───────────────────────────── */

  const statusMap = {
    PAID: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      label: "مدفوع",
    },
    PARTIAL: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      label: "مدفوع جزئي",
    },
    DEBT: {
      bg: "bg-red-50",
      text: "text-red-600",
      label: "دين",
    },
    RETURNED: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      label: "مرتجع",
    },
    PARTIALLY_RETURNED: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      label: "مرتجع جزئي",
    },
  };

  const status = statusMap[sale.status] || statusMap.PAID;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
          className="w-full max-w-4xl bg-white rounded-[28px] overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.18)] flex flex-col max-h-[92vh]"
        >
          {/* HEADER */}
          <div className="relative border-b border-slate-100 px-7 py-6">
            <button
              onClick={onClose}
              className="absolute left-6 top-6 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center text-slate-500"
            >
              <MdClose size={20} />
            </button>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <MdReplay size={28} />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-slate-800">
                    فاتورة #{sale.invoiceNumber}
                  </h2>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}
                    >
                      {status.label}
                    </span>

                    <span className="text-sm text-slate-400">
                      {new Date(sale.createdAt).toLocaleString("ar-EG")}
                    </span>
                  </div>
                </div>
              </div>

              {sale.customerName && (
                <div className="flex items-center gap-2 text-sm text-slate-500 mr-[68px]">
                  <span>العميل:</span>

                  <span className="font-bold text-slate-700">
                    {sale.customerName}
                  </span>

                  {sale.customerPhone && (
                    <>
                      <span className="text-slate-300">•</span>

                      <span>{sale.customerPhone}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* BODY */}
          <div className="overflow-y-auto">
            {/* SUMMARY */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-100">
              <SummaryCard
                title="الإجمالي"
                value={`${Number(sale.totalPrice - sale.returnedAmount).toLocaleString()} ج.م`}
              />

              <SummaryCard
                title="المدفوع"
                value={`${Number(sale.paidAmount - sale.returnedAmount || 0).toLocaleString()} ج.م`}
                valueClass="text-emerald-600"
              />

              <SummaryCard
                title="المتبقي"
                value={`${Number(
                  sale.remainingAmount || 0,
                ).toLocaleString()} ج.م`}
                valueClass="text-red-500"
              />

              <SummaryCard
                title="المرتجع"
                value={`${Number(
                  sale.returnedAmount || 0,
                ).toLocaleString()} ج.م`}
                valueClass="text-violet-600"
              />
            </div>

            {/* PRODUCTS */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    المنتجات
                  </h3>

                  <p className="text-sm text-slate-400 mt-1">
                    اختر الكميات المراد إرجاعها
                  </p>
                </div>

                <button
                  onClick={returnAllAvailable}
                  className="h-11 px-5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition font-bold text-sm"
                >
                  إرجاع الكل
                </button>
              </div>

              <div className="space-y-4">
                {sale.SaleItems.map((item) => {
                  const available =
                    item.quantity - (item.returnedQuantity || 0);

                  const selected = returnItems[item.id] || 0;

                  const fullyReturned = available <= 0;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition overflow-hidden ${
                        selected > 0
                          ? "border-violet-200 bg-violet-50/40"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex justify-between gap-4 flex-wrap">
                          {/* Product Info */}
                          <div className="flex-1 min-w-[220px]">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-black text-slate-800 text-[15px]">
                                  {item.Product?.name || "منتج"}
                                </h4>

                                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                                  <span>
                                    الكمية:
                                    <strong className="text-slate-700 mr-1">
                                      {item.quantity}
                                    </strong>
                                  </span>

                                  <span>
                                    السعر:
                                    <strong className="text-slate-700 mr-1">
                                      {Number(item.price).toLocaleString()} ج.م
                                    </strong>
                                  </span>

                                  {item.returnedQuantity > 0 && (
                                    <span className="text-violet-600 font-bold">
                                      تم إرجاع {item.returnedQuantity}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!fullyReturned && (
                                <div className="text-left">
                                  <div className="text-xs text-slate-400 mb-1">
                                    المتاح
                                  </div>

                                  <div className="font-black text-amber-600">
                                    {available}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Returned Bar */}
                            {item.returnedQuantity > 0 && (
                              <div className="mt-4">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-violet-500 rounded-full"
                                    style={{
                                      width: `${
                                        (item.returnedQuantity /
                                          item.quantity) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center">
                            {fullyReturned ? (
                              <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-500 text-sm font-bold">
                                تم إرجاع المنتج بالكامل
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => adjustQty(item.id, -1)}
                                  disabled={selected <= 0}
                                  className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                                >
                                  <MdRemove size={18} />
                                </button>

                                <div className="w-14 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center font-black text-lg text-slate-800">
                                  {selected}
                                </div>

                                <button
                                  onClick={() => adjustQty(item.id, 1)}
                                  disabled={selected >= available}
                                  className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 hover:bg-violet-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
                                >
                                  <MdAdd size={18} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selected Preview */}
                      {selected > 0 && (
                        <div className="border-t border-violet-100 bg-violet-50 px-5 py-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-violet-700">
                            سيتم إرجاع {selected} قطعة
                          </span>

                          <span className="font-black text-violet-700">
                            {(selected * Number(item.price)).toLocaleString()}{" "}
                            ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* REASON */}
            {/* <div className="p-6 border-b border-slate-100">
              <label className="block text-sm font-black text-slate-700 mb-3">
                سبب الإرجاع
              </label>

              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سبب الإرجاع..."
                className="w-full resize-none rounded-2xl border border-slate-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none px-4 py-3 text-sm transition"
              />
            </div> */}

            {/* RETURN SUMMARY */}
            {returnCount > 0 && (
              <div className="mx-6 mt-6 rounded-2xl bg-violet-50 border border-violet-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-violet-100">
                  <h3 className="font-black text-violet-800">ملخص المرتجع</h3>
                </div>

                <div className="p-5 space-y-3">
                  {Object.entries(returnItems).map(([id, qty]) => {
                    const item = sale.SaleItems.find(
                      (i) => i.id === Number(id),
                    );

                    if (!item) return null;

                    return (
                      <div key={id} className="flex justify-between text-sm">
                        <div className="text-slate-700">
                          {item.Product?.name} × {qty}
                        </div>

                        <div className="font-bold text-slate-800">
                          {(qty * Number(item.price)).toLocaleString()} ج.م
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-4 border-t border-violet-100 flex justify-between items-center">
                    <span className="font-black text-slate-800">الإجمالي</span>

                    <span className="text-2xl font-black text-violet-700">
                      {returnAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mx-6 mt-6 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
                <MdWarningAmber className="text-red-500 mt-0.5" size={20} />

                <div className="text-sm font-medium text-red-600">{error}</div>
              </div>
            )}

            {/* PRINT TEMPLATE */}
            <div className="hidden">
              <div ref={contentRef}>
                <div className="center">
                  <div className="big">روح العود</div>

                  <div className="mt">فاتورة رقم #{sale.invoiceNumber}</div>

                  <div className="muted mt">
                    {new Date(sale.createdAt).toLocaleString("ar-EG")}
                  </div>
                </div>

                <div className="line"></div>

                {sale.customerName && (
                  <>
                    <div className="row">
                      <span>العميل</span>

                      <span>{sale.customerName}</span>
                    </div>

                    {sale.customerPhone && (
                      <div className="row">
                        <span>الهاتف</span>

                        <span>{sale.customerPhone}</span>
                      </div>
                    )}

                    <div className="line"></div>
                  </>
                )}

                <div className="items">
                  {sale.SaleItems.map((item) => {
                    const qty = item.quantity;
                    const returned = item.returnedQuantity || 0;
                    const subtotal = qty * Number(item.price);

                    return (
                      <div key={item.id} className="item">
                        <div className="bold">{item.Product?.name}</div>

                        <div className="row">
                          <span>
                            {qty} × {Number(item.price).toLocaleString()}
                          </span>

                          <span>{subtotal.toLocaleString()} ج.م</span>
                        </div>

                        {returned > 0 && (
                          <div className="returned">مرتجع: {returned}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="line"></div>

                <div className="row total">
                  <span>الإجمالي</span>

                  <span>{Number(sale.totalPrice).toLocaleString()} ج.م</span>
                </div>

                {Number(sale.discount || 0) > 0 && (
                  <div className="row">
                    <span>الخصم</span>

                    <span>{Number(sale.discount).toLocaleString()} ج.م</span>
                  </div>
                )}

                {Number(sale.returnedAmount || 0) > 0 && (
                  <div className="row">
                    <span>المرتجع</span>

                    <span>
                      {Number(sale.returnedAmount).toLocaleString()} ج.م
                    </span>
                  </div>
                )}

                <div className="row">
                  <span>المدفوع</span>

                  <span>{Number(sale.paidAmount).toLocaleString()} ج.م</span>
                </div>

                {Number(sale.remainingAmount || 0) > 0 && (
                  <div className="row">
                    <span>المتبقي</span>

                    <span>
                      {Number(sale.remainingAmount).toLocaleString()} ج.م
                    </span>
                  </div>
                )}

                <div className="row bold">
                  <span>الصافي</span>
                  <span>
                    {Number(
                      (sale.totalPrice || 0) - (sale.returnedAmount || 0),
                    ).toLocaleString()}{" "}
                    ج.م
                  </span>
                </div>

                <div className="status">{status.label}</div>

                <div className="line"></div>

                <div className="center muted mt">شكراً لزيارتكم ❤️</div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 mt-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  {returnCount > 0 && (
                    <>
                      <div className="text-sm text-slate-500">عدد العناصر</div>

                      <div className="font-black text-slate-800 text-lg">
                        {returnCount} منتج
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="
                              h-12 px-6 rounded-2xl
                              bg-blue-50 text-blue-600
                              hover:bg-blue-100
                              font-bold transition
                            "
                  >
                    إعادة طباعة الفاتورة
                  </button>
                  <button
                    onClick={onClose}
                    className="h-12 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                  >
                    إلغاء
                  </button>

                  <button
                    onClick={() => setShowConfirm(true)}
                    disabled={!canSubmit || loading}
                    className={`h-12 px-7 rounded-2xl font-black text-white transition ${
                      canSubmit && !loading
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "bg-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {loading ? "جاري التنفيذ..." : "تأكيد المرتجع"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIRM MODAL */}
        {showConfirm && (
          <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
              <div className="p-7">
                <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-5">
                  <MdReplay size={30} />
                </div>

                <h3 className="text-center text-2xl font-black text-slate-800">
                  تأكيد المرتجع
                </h3>

                <p className="text-center text-sm text-slate-500 mt-3 leading-7">
                  سيتم إرجاع <strong>{returnCount}</strong> منتج بقيمة{" "}
                  <strong>{returnAmount.toLocaleString()} ج.م</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-100">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="h-14 font-bold text-slate-600 hover:bg-slate-50 transition border-l border-slate-100"
                >
                  تراجع
                </button>

                <button
                  onClick={() => {
                    setShowConfirm(false);
                    submitReturn();
                  }}
                  className="h-14 font-black text-violet-600 hover:bg-violet-50 transition"
                >
                  تأكيد
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SummaryCard({ title, value, valueClass = "text-slate-800" }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100">
      <div className="text-xs font-bold text-slate-400 mb-2">{title}</div>

      <div className={`text-xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}
