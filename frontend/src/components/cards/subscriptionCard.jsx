import { useState } from "react";
import axios from "axios";
import { GoPackage } from "react-icons/go";
import { MdCancelPresentation, MdDateRange } from "react-icons/md";
import { FaCheck, FaRotateRight, FaMoneyBillWave } from "react-icons/fa6";
import { DateNow } from "../../utils/date";
import RenewModal from "../modals/RenewModal";
import RefundModal from "../modals/RefundModal";
import EditSubscriptionModal from "../modals/EditSubscriptionModal";
import { FaEdit } from "react-icons/fa";

const today = DateNow();

function getSubStatus(sub) {
  if (!sub) return null;
  const sessionsLeft = sub.availableSessions;
  if (sub.status === "returned")
    return {
      type: "returned",
      label: "مرتجع",
      color: "#7c3aed",
      bg: "#f5f3ff",
    };
  if (sub.status !== "active")
    return {
      type: "inactive",
      label: "غير نشط",
      color: "#6b7280",
      bg: "#f3f4f6",
    };
  if (sessionsLeft === 0 || sub.endDate < today)
    return { type: "ended", label: "منتهي", color: "#dc2626", bg: "#fef2f2" };
  if (sessionsLeft <= 2)
    return {
      type: "soon",
      label: `تبقى ${sessionsLeft} جلسة فقط`,
      color: "#d97706",
      bg: "#fffbeb",
    };
  return { type: "active", label: "نشط", color: "#16a34a", bg: "#f0fdf4" };
}

export default function SubscriptionCard({
  sub,
  price,
  setResponse,
  setToast,
  setSubscriptionsRender,
  subscriptionsRender,
  setSubId,
  setOpenModal,
}) {
  const [renewModal, setRenewModal] = useState(false);
  const [refundModal, setRefundModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const status = getSubStatus(sub);
  const sessionsLeft = sub.availableSessions;
  const total = sub.availableSessions + sub.usedSessions;
  const progressPct = Math.min(
    100,
    total > 0 ? (sub.availableSessions / total) * 100 : 0,
  );

  function notify(data) {
    setToast(true);
    setResponse(data);
    setSubscriptionsRender((v) => !v);
    setTimeout(() => setToast(false), 3000);
  }

  const canRenew = ["ended", "soon", "inactive"].includes(status.type);
  const isReturned = status.type === "returned";

  const canEdit = !isReturned;

  const borderColor =
    {
      active: "#86efac",
      soon: "#fcd34d",
      returned: "#ddd6fe",
      ended: "#fecaca",
    }[status.type] || "#e5e7eb";

  return (
    <>
      {renewModal && (
        <RenewModal
          sub={sub}
          price={price}
          onClose={() => setRenewModal(false)}
          onSuccess={(d) => {
            setRenewModal(false);
            notify(d);
          }}
        />
      )}
      {refundModal && (
        <RefundModal
          sub={sub}
          onClose={() => setRefundModal(false)}
          onSuccess={(d) => {
            setRefundModal(false);
            notify(d);
          }}
        />
      )}

      {editModal && (
        <EditSubscriptionModal
          sub={sub}
          onClose={() => setEditModal(false)}
          onSuccess={(d) => {
            setEditModal(false);
            notify(d);
          }}
        />
      )}

      <div
        style={{
          border: `1.5px solid ${borderColor}`,
          borderRadius: "16px",
          padding: "1.25rem",
          marginBottom: "0.875rem",
          background: "#fff",
          position: "relative",
        }}
      >
        {/* Status badge */}
        <span
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            fontSize: "11px",
            fontWeight: "700",
            padding: "3px 10px",
            borderRadius: "20px",
            background: status.bg,
            color: status.color,
          }}
        >
          {status.label}
        </span>

        {/* Banners */}
        {status.type === "soon" && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "1rem",
              fontSize: "12px",
              color: "#92400e",
            }}
          >
            ⚠️ يتبقى {sessionsLeft} جلسة فقط
          </div>
        )}
        {status.type === "ended" && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "1rem",
              fontSize: "12px",
              color: "#991b1b",
            }}
          >
            ❌ انتهى هذا الاشتراك
          </div>
        )}
        {isReturned && (
          <div
            style={{
              background: "#f5f3ff",
              border: "1px solid #ddd6fe",
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "1rem",
              fontSize: "12px",
              color: "#5b21b6",
            }}
          >
            💰 تم تسجيل مرتجع لهذا الاشتراك
          </div>
        )}

        {/* Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "0.5rem",
            textAlign: "center",
            marginTop: "0.5rem",
          }}
        >
          {[
            {
              label: "الباقة",
              value: sub.packageName,
              icon: <GoPackage size={14} />,
            },
            {
              label: "مستخدم",
              value: sub.usedSessions,
              icon: <MdCancelPresentation size={14} color="#dc2626" />,
            },
            {
              label: "متبقي",
              value: sub.availableSessions,
              icon: <FaCheck size={12} color="#16a34a" />,
            },
            {
              label: "تاريخ الاشتراك",
              value: sub.startDate?.split("T")[0],
              icon: <MdDateRange size={14} color="#6b7280" />,
            },
            {
              label: "تاريخ الانتهاء",
              value: sub.endDate?.split("T")[0],
              icon: <MdDateRange size={14} color="#6b7280" />,
            },
          ].map((col, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                {col.icon} {col.label}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#1f2937",
                }}
              >
                {col.value}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {sub.status === "active" && (
          <div style={{ marginTop: "1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#6b7280" }}>
                الجلسات
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: sessionsLeft <= 2 ? "#d97706" : "#1e3a8a",
                }}
              >
                {sessionsLeft}/{total}
              </span>
            </div>
            <div
              style={{
                height: "5px",
                borderRadius: "3px",
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "3px",
                  width: `${progressPct}%`,
                  background: sessionsLeft <= 2 ? "#f59e0b" : "#1e3a8a",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Actions — hidden only if already returned */}
        {!isReturned && (
          <div
            style={{
              display: "flex",
              gap: "0.625rem",
              marginTop: "1rem",
              flexWrap: "wrap",
            }}
          >
            {canRenew && (
              <button
                onClick={() => setRenewModal(true)}
                style={{
                  flex: 1,
                  minWidth: "100px",
                  height: "38px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#1e40af",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#dbeafe")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#eff6ff")
                }
              >
                <FaRotateRight size={12} /> تجديد
              </button>
            )}
            {/* مرتجع — always shown */}
            <button
              onClick={() => setRefundModal(true)}
              style={{
                flex: 1,
                minWidth: "100px",
                height: "38px",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#7c3aed",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#ede9fe")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#f5f3ff")
              }
            >
              <FaMoneyBillWave size={12} /> مرتجع
            </button>

            {canEdit && (
              <button
                onClick={() => setEditModal(true)}
                style={{
                  flex: 1,
                  minWidth: "100px",
                  height: "38px",
                  background: "#f8f9fc",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f8f9fc")
                }
              >
                <FaEdit size={12} /> تعديل
              </button>
            )}

            {/* إلغاء — always shown */}
            <button
              onClick={() => {
                setSubId(sub.id);
                setOpenModal(true);
              }}
              style={{
                flex: 1,
                minWidth: "100px",
                height: "38px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#dc2626",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#fee2e2")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#fef2f2")
              }
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
    </>
  );
}
