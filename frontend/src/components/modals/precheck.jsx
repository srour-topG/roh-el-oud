import { IoAlertCircleOutline } from "react-icons/io5";
import { FaCheck, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import { GoPackage } from "react-icons/go";
import { IoPersonSharp } from "react-icons/io5";
import axios from "axios";
import {
  differenceInYears,
  differenceInDays,
  formatDistanceToNow,
} from "date-fns";
import { ar } from "date-fns/locale";
import ImageWithAuth from "../ImageWithAuth";
import { maskAddress, maskAge, maskMobile } from "../../utils/maskFemale";
import { useAuth } from "../../context/AuthContext";
import DebtBadge, { useCustomerDebt } from "../debtBadge";

export function PrecheckModal({
  setToast,
  setRerender,
  reRender,
  setOpenModal,
  PreCheckOpenModal,
  setPreCheckOpenModal,
  personalData,
  setPersonalData,
  subData,
  setSubData,
  setResponse,
  toast,
  triggerRefresh,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;

  const { role } = useAuth();

  function handleSubmit(id) {
    axios
      .get(`${apiUrl}/checkIn/${id}`)
      .then((response) => {
        setResponse(response.data);
        setToast(true);
        setPreCheckOpenModal(false);
        setOpenModal(false);
        setRerender(!reRender);
        triggerRefresh();
        setTimeout(() => setToast(false), 3000);
      })
      .catch((error) => {
        setResponse(error.response?.data || { Message: error.message });
        setToast(true);
        setPreCheckOpenModal(false);
        setOpenModal(false);
        setTimeout(() => setToast(false), 3000);
      });
  }

  // Age calculation
  const age = personalData?.birthDate
    ? differenceInYears(new Date(), new Date(personalData.birthDate))
    : null;

  // Days remaining in subscription
  const daysRemaining = subData?.endDate
    ? differenceInDays(new Date(subData.endDate), new Date())
    : null;

  // Last visit (from usedSessions — we'll display the endDate label as a proxy)
  // If you store last visit date, swap this out
  const lastVisitLabel = subData?.updatedAt
    ? formatDistanceToNow(new Date(subData.updatedAt), {
        addSuffix: true,
        locale: ar,
      })
    : "—";

  if (!PreCheckOpenModal) return null;

  return (
    <div
      onClick={() => setPreCheckOpenModal(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(200, 212, 230, 0.6)",
        backdropFilter: "blur(6px)",
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
          borderRadius: "24px",
          width: "min(580px, 96vw)",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(30,58,138,0.14)",
        }}
      >
        {subData && personalData ? (
          <>
            {/* ── Header ── */}
            <div
              style={{
                padding: "2rem 2rem 1.5rem",
                textAlign: "center",
                borderBottom: "1px solid #f0f2f8",
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#eef1ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  color: "#1e3a8a",
                }}
              >
                <IoPersonSharp size={24} />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "800",
                  color: "#1e3a8a",
                  marginBottom: "6px",
                }}
              >
                سجل حضورك
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
                يرجى مراجعة البيانات قبل تأكيد الدخول
              </p>
            </div>

            {/* ── Customer Card ── */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(personalData.id);
              }}
              style={{ padding: "1.5rem 2rem" }}
            >
              <div
                style={{
                  background: "#f8f9fc",
                  border: "1px solid #eef0f8",
                  borderRadius: "16px",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center justify-start gap-2">
                      <h3
                        style={{
                          // margin: "0 0 0.5rem",
                          fontSize: "20px",
                          fontWeight: "800",
                          color: "#1e3a8a",
                        }}
                      >
                        {personalData?.name}
                      </h3>
                      <DebtBadge
                        customerID={personalData.id}
                        variant="icon-only"
                        size="lg"
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.75rem",
                        marginBottom: "0.875rem",
                      }}
                    >
                      {personalData?.mobile && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          <FaPhone size={11} />
                          {maskMobile(
                            personalData.mobile,
                            role,
                            personalData.gender,
                          )}
                        </span>
                      )}
                      {personalData?.address && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          <FaMapMarkerAlt size={11} />
                          {maskAddress(
                            personalData.address,
                            role,
                            personalData.gender,
                          )}
                        </span>
                      )}
                      {age !== null && (
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                          }}
                        >
                          {maskAge(`${age} سنة`, role, personalData.gender)}
                        </span>
                      )}
                    </div>

                    {/* Package badge */}
                    <div className="flex items-center justify-start gap-4">
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: "#e8edf8",
                          color: "#1e3a8a",
                          fontSize: "12px",
                          fontWeight: "600",
                          padding: "5px 12px",
                          borderRadius: "20px",
                        }}
                      >
                        <GoPackage size={13} />
                        {subData?.packageName}
                      </span>
                      <DebtBadge
                        customerID={personalData.id}
                        variant="pill"
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Photo */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "90px",
                        height: "90px",
                        borderRadius: "14px",
                        overflow: "hidden",
                        background: "#dbeafe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImageWithAuth
                        customer={personalData}
                        className="w-full h-full object-cover"
                        fallbackIcon={() => (
                          <IoPersonSharp size={36} color="#93c5fd" />
                        )}
                      />
                    </div>
                    {/* Active badge */}
                    <span
                      style={{
                        position: "absolute",
                        bottom: "6px",
                        left: "6px",
                        background: "#16a34a",
                        color: "#fff",
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "2px 7px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                      }}
                    >
                      <FaCheck size={8} />
                      نشط
                    </span>
                  </div>
                </div>

                {/* ── Stat boxes ── */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "0.75rem",
                    marginTop: "1.25rem",
                  }}
                >
                  {[
                    {
                      label: "عدد الزيارات",
                      value: `${subData?.usedSessions ?? 0} زيارة`,
                    },
                    {
                      label: "آخر زيارة",
                      value: lastVisitLabel,
                    },
                    {
                      label: "الأيام المتبقية",
                      value:
                        daysRemaining !== null
                          ? `${daysRemaining > 0 ? new Intl.NumberFormat("ar-EG").format(daysRemaining) : new Intl.NumberFormat("ar-EG").format(0)} يوم`
                          : "—",
                      valueColor:
                        daysRemaining !== null && daysRemaining <= 7
                          ? "#dc2626"
                          : "#1e3a8a",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#fff",
                        border: "1px solid #eef0f8",
                        borderRadius: "12px",
                        padding: "0.75rem 1rem",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px",
                          fontSize: "11px",
                          color: "#9ca3af",
                          fontWeight: "500",
                        }}
                      >
                        {stat.label}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: "800",
                          color: stat.valueColor || "#1e3a8a",
                        }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Sessions remaining bar ── */}
              {subData?.availableSessions !== undefined && (
                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                      الجلسات المتبقية
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#1e3a8a",
                      }}
                    >
                      {subData.availableSessions} /{" "}
                      {(subData.availableSessions ?? 0) +
                        (subData.usedSessions ?? 0)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      borderRadius: "4px",
                      background: "#e5e7eb",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "4px",
                        background: "#1e3a8a",
                        width: `${Math.min(
                          100,
                          ((subData.availableSessions ?? 0) /
                            Math.max(
                              1,
                              (subData.availableSessions ?? 0) +
                                (subData.usedSessions ?? 0),
                            )) *
                            100,
                        )}%`,
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="submit"
                  autoFocus
                  style={{
                    height: "52px",
                    background: "#1e3a8a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#1e40af")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#1e3a8a")
                  }
                >
                  <FaCheck size={14} />
                  تأكيد الحضور
                </button>

                <button
                  onClick={() => setPreCheckOpenModal(false)}
                  style={{
                    height: "52px",
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#e5e7eb")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#f3f4f6")
                  }
                >
                  إلغاء
                </button>
              </div>
            </form>
          </>
        ) : (
          /* ── No subscription ── */
          <div
            style={{
              padding: "3rem 2rem",
              textAlign: "center",
            }}
          >
            <IoAlertCircleOutline
              size={80}
              color="#dc2626"
              style={{ margin: "0 auto 1rem" }}
            />
            <h4
              style={{
                margin: "0 0 0.5rem",
                fontSize: "18px",
                fontWeight: "700",
                color: "#dc2626",
              }}
            >
              لا يوجد كود أو اشتراك مفعل
            </h4>
            <p
              style={{
                margin: "0 0 1.5rem",
                fontSize: "13px",
                color: "#9ca3af",
              }}
            >
              تحقق من الكود أو تواصل مع الإدارة
            </p>
            <button
              onClick={() => setPreCheckOpenModal(false)}
              style={{
                padding: "0.625rem 2rem",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
