import { HiOutlineExclamationCircle } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

function DeleteConfirmationModal({ openModal, setOpenModal, execFunc, Message }) {
  if (!openModal) return null;

  return (
    <div
      onClick={() => setOpenModal(false)}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff", borderRadius: "20px",
          padding: "2rem 2rem 1.5rem",
          width: "min(380px, 92vw)",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <button onClick={() => setOpenModal(false)}
          style={{ position: "absolute", top: "1rem", left: "1rem", width: "30px", height: "30px", borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
          <IoClose size={15} />
        </button>

        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
          <HiOutlineExclamationCircle style={{ fontSize: "32px", color: "#dc2626" }} />
        </div>

        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: "700", color: "#1a1f36" }}>
          تأكيد الحذف
        </h3>
        <p style={{ margin: "0 0 1.75rem", fontSize: "14px", color: "#6b7280" }}>
          {Message || "هل أنت متأكد من رغبتك في الحذف؟ لا يمكن التراجع عن هذا الإجراء."}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <button
            onClick={() => { execFunc(); setOpenModal(false); }}
            style={{ height: "44px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#b91c1c"}
            onMouseLeave={e => e.currentTarget.style.background = "#dc2626"}
          >
            حذف
          </button>
          <button
            onClick={() => setOpenModal(false)}
            style={{ height: "44px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#f3f4f6"}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;