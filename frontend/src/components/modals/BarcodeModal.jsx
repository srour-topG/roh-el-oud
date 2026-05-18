// components/modals/BarcodeModal.jsx

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { FaDownload, FaWhatsapp, FaPrint } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function BarcodeModal({ customer, onClose }) {
  const barcodeRef = useRef(null);
  const { role } = useAuth();
  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, String(customer.id), {
        format: "CODE128",
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    }
  }, [customer.id]);

  // Convert SVG barcode → PNG
  const convertToPNG = () => {
    return new Promise((resolve) => {
      const svg = barcodeRef.current;
      const canvas = document.createElement("canvas");

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();

      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        resolve(canvas.toDataURL("image/png"));
      };

      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgData)));
    });
  };

  // Download barcode image
  const downloadBarcode = async () => {
    const pngUrl = await convertToPNG();

    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${customer.name}-${customer.id}.png`;
    link.click();
  };

  // Send WhatsApp message
  const sendWhatsApp = () => {
    const phone = customer.mobile?.replace(/^0/, "20");

    const message = encodeURIComponent(
      `مرحباً ${customer.name}

كود عضويتك في نادي كارديو هو:

${customer.id}

قم بإظهار الكود عند الدخول للنادي.`,
    );

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  // Print barcode
  const printBarcode = () => {
    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
        </head>
        <body style="text-align:center;font-family:Arial">
          <h3>${customer.name}</h3>
          ${barcodeRef.current.outerHTML}
          <p>ID: ${customer.id}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="bg-white rounded-2xl p-8 w-[min(400px,92vw)] text-center"
      >
        <h3 className="text-lg font-bold text-[#1e3a8a] mb-1">
          باركود المشترك
        </h3>

        <p className="text-xs text-gray-400 mb-4">
          {customer.name} — #{customer.id}
        </p>

        <svg ref={barcodeRef} className="mx-auto mb-5" />

        <div className="flex gap-3 flex-wrap">
          {/* Download */}
          <button
            onClick={downloadBarcode}
            className="flex-1 h-11 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <FaDownload size={16} />
            تحميل
          </button>

          {/* WhatsApp */}
          {role === "admin" && customer.mobile && (
            <button
              onClick={sendWhatsApp}
              className="flex-1 h-11 bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
            >
              <FaWhatsapp size={18} />
              واتساب
            </button>
          )}

          {/* Print */}
          <button
            onClick={printBarcode}
            className="flex-1 h-11 bg-gray-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          >
            <FaPrint size={16} />
            طباعة
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full h-11 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
