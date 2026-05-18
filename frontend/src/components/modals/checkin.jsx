import { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { MdQrCode2, MdCheckCircle } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import ImageWithAuth from "../ImageWithAuth";

const Schema = Yup.object().shape({
  customerID: Yup.number()
    .typeError("الكود يجب أن يكون رقماً")
    .required("ادخل الكود"),
});

function CheckInModal({
  openModal,
  setOpenModal,
  setPreCheckOpenModal,
  setSubData,
  setPersonalData,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [lastScanned, setLastScanned] = useState(null);
  function handlePrecheck(id, resetForm) {
    axios
      .get(`${apiUrl}/precheck?id=${id}`)
      .then((response) => {
        const customer = response.data.customerData;
        const sub = response.data.subscription;

        // Show the last scanned preview
        if (customer) {
          setLastScanned({
            name: customer.name,
            image: customer.image,
            gender: customer.gender,
            isActive: !!sub,
          });
        }

        setPersonalData(customer);
        setSubData(sub);
        setPreCheckOpenModal(true);
        setOpenModal(false);
        resetForm();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  if (!openModal) return null;

  return (
    // Backdrop
    <div
      onClick={() => setOpenModal(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(200, 210, 230, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Modal box */}
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "2rem 2rem 1.75rem",
          width: "min(440px, 92vw)",
          position: "relative",
          boxShadow: "0 20px 60px rgba(30,58,138,0.12)",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setOpenModal(false)}
          className="p-0 leading-none"
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "none",
            background: "#f3f4f6",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        >
          <IoClose size={18} />
        </button>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "800",
              color: "#1e3a8a",
              marginBottom: "6px",
            }}
          >
            تسجيل حضور سريع
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
            أدخل الرمز التعريفي للمشترك لبدء الجلسة
          </p>
        </div>

        <Formik
          initialValues={{ customerID: "" }}
          validationSchema={Schema}
          onSubmit={(values, { resetForm }) => {
            handlePrecheck(values.customerID, resetForm);
          }}
        >
          {({ errors, touched, handleChange, handleBlur, values }) => (
            <Form>
              {/* Input label */}
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "8px",
                  textAlign: "right",
                }}
              >
                كود المشترك
              </label>

              {/* Input with QR icon */}
              <div style={{ position: "relative", marginBottom: "8px" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <MdQrCode2 size={20} />
                </span>
                <input
                  name="customerID"
                  type="text"
                  autoFocus
                  onChange={handleChange}
                  //   onBlur={handleBlur}
                  value={values.customerID}
                  placeholder="مثال: 4492"
                  style={{
                    width: "100%",
                    height: "48px",
                    padding: "0 1rem 0 3rem",
                    fontSize: "15px",
                    fontWeight: "600",
                    textAlign: "right",
                    direction: "rtl",
                    border: `1.5px solid ${errors.customerID && touched.customerID ? "#ef4444" : "#e5e7eb"}`,
                    borderRadius: "12px",
                    background: "#f9fafb",
                    color: "#111827",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  onBlur={(e) => {
                    handleBlur(e);
                    e.target.style.borderColor = errors.customerID
                      ? "#ef4444"
                      : "#e5e7eb";
                  }}
                />
              </div>

              {/* Validation error */}
              {touched.customerID && errors.customerID && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "12px",
                    color: "#ef4444",
                    textAlign: "right",
                  }}
                >
                  {errors.customerID}
                </p>
              )}

              {/* Last scanned preview */}
              {lastScanned && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "0.75rem 1rem",
                    marginBottom: "1.25rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        overflow: "hidden",
                        background: "#dbeafe",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1e3a8a",
                      }}
                    >
                      <ImageWithAuth
                        customer={lastScanned}
                        className="w-full h-full object-cover"
                        fallbackIcon={() => lastScanned.name?.[0]}
                      />
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: "#9ca3af",
                          marginBottom: "2px",
                        }}
                      >
                        آخر مسح ناجح
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {lastScanned.name}
                      </p>
                    </div>
                  </div>
                  {/* Status badge */}
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      background: lastScanned.isActive ? "#dcfce7" : "#fee2e2",
                      color: lastScanned.isActive ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {lastScanned.isActive ? "نشط" : "منتهي"}
                  </span>
                </div>
              )}

              {/* Confirm button */}
              <button
                type="submit"
                style={{
                  width: "100%",
                  height: "52px",
                  background: "#1e3a8a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: lastScanned ? "0" : "1rem",
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
                <MdCheckCircle size={20} />
                تأكيد الحضور
              </button>

              {/* Cancel link */}
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                style={{
                  width: "100%",
                  marginTop: "0.875rem",
                  background: "none",
                  border: "none",
                  fontSize: "13px",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#6b7280")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
              >
                إلغاء العملية
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default CheckInModal;
