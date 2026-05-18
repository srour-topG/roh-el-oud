import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaWeight,
  FaRuler,
  FaVenusMars,
} from "react-icons/fa";
import { IoCalendarOutline } from "react-icons/io5";
import { useAuth } from "../../context/AuthContext";
import { maskAddress, maskMobile } from "../../utils/maskFemale";

const SignupSchema = Yup.object().shape({
  name: Yup.string().required("الإسم مطلوب"),
  Gender: Yup.string().required("النوع مطلوب"),
  Address: Yup.string().required("العنوان مطلوب"),
  mobile: Yup.string()
    .optional()
    .matches(
      /^(010|011|012|015)[0-9]{8}$/,
      "رقم موبايل مصري صالح (مثال: 01012345678)",
    ),
  birthDate: Yup.string().required("تاريخ الميلاد مطلوب"),
  weight: Yup.string().optional(),
  tall: Yup.string().optional(),
});

const inputStyle = (hasError) => ({
  width: "100%",
  height: "44px",
  padding: "0 1rem 0 2.75rem",
  border: `1px solid ${hasError ? "#ef4444" : "#e5e7eb"}`,
  borderRadius: "10px",
  fontSize: "13px",
  background: "#f9fafb",
  color: "#1f2937",
  outline: "none",
  textAlign: "right",
  direction: "rtl",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
});

function Field({ label, icon, error, touched, children }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {children}
        <span
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
            display: "flex",
            pointerEvents: "none",
          }}
        >
          {icon}
        </span>
      </div>
      {touched && error && (
        <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#ef4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function CustomerDataModal({
  response,
  setResponse,
  openDataModal,
  setOpenDataModal,
  customerData,
  setToast,
  dataRender,
  setDataRender,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { role } = useAuth();

  if (!openDataModal) return null;

  return (
    <div
      onClick={() => setOpenDataModal(false)}
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
          width: "min(520px, 96vw)",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #f0f2f8",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: "700",
              color: "#1e3a8a",
            }}
          >
            تعديل بيانات المشترك
          </h3>
          <button
            className="p-0 leading-none"
            onClick={() => setOpenDataModal(false)}
            style={{
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
            }}
          >
            <IoClose size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "1.5rem" }}>
          <Formik
            initialValues={{
              id: customerData.id,
              name: customerData.name || "",
              mobile:
                maskMobile(customerData.mobile, role, customerData.gender) ||
                "",
              Gender: customerData.gender || "ذكر",
              Address:
                maskAddress(customerData.address, role, customerData.gender) ||
                "",
              birthDate:
                customerData.gender == "ذكر"
                  ? customerData.birthDate?.split("T")[0] || ""
                  : "",
              weight: customerData.weight || "",
              tall: customerData.tall || customerData.hight || "",
            }}
            validationSchema={SignupSchema}
            onSubmit={async (values) => {
              try {
                const res = await axios.patch(`${apiUrl}/customer`, values);
                setResponse(res.data);
                setOpenDataModal(false);
                setToast(true);
                setDataRender((v) => !v);
                setTimeout(() => setToast(false), 4000);
              } catch (e) {
                setResponse(e.response?.data || { Message: "حدث خطأ" });
                setToast(true);
              }
            }}
          >
            {({
              errors,
              touched,
              handleChange,
              handleBlur,
              values,
              setFieldValue,
            }) => (
              <Form>
                {/* Name */}
                <Field
                  label="الاسم الكامل"
                  icon={<FaUser size={13} />}
                  error={errors.name}
                  touched={touched.name}
                >
                  <input
                    name="name"
                    type="text"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.name}
                    style={inputStyle(errors.name && touched.name)}
                    placeholder="مثال: محمد أحمد علي"
                    onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  />
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  {/* Gender */}
                  <Field
                    label="الجنس"
                    icon={<FaVenusMars size={13} />}
                    error={errors.Gender}
                    touched={touched.Gender}
                  >
                    <select
                      name="Gender"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.Gender}
                      style={{
                        ...inputStyle(errors.Gender && touched.Gender),
                        appearance: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="ذكر">ذكر</option>
                      <option value="أنثى">أنثى</option>
                    </select>
                  </Field>

                  {/* Mobile */}
                  <Field
                    label="رقم الموبايل"
                    icon={<FaPhone size={12} />}
                    error={errors.mobile}
                    touched={touched.mobile}
                  >
                    <input
                      name="mobile"
                      type="tel"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.mobile}
                      style={inputStyle(errors.mobile && touched.mobile)}
                      placeholder="01XXXXXXXXX"
                      onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                    />
                  </Field>
                </div>

                {/* Address */}
                <Field
                  label="العنوان"
                  icon={<FaMapMarkerAlt size={13} />}
                  error={errors.Address}
                  touched={touched.Address}
                >
                  <input
                    name="Address"
                    type="text"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.Address}
                    style={inputStyle(errors.Address && touched.Address)}
                    placeholder="المدينة، الشارع"
                    onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  />
                </Field>

                {/* Birth Date */}
                <Field
                  label="تاريخ الميلاد"
                  icon={<IoCalendarOutline size={14} />}
                  error={errors.birthDate}
                  touched={touched.birthDate}
                >
                  <input
                    name="birthDate"
                    type="date"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.birthDate}
                    style={{
                      ...inputStyle(errors.birthDate && touched.birthDate),
                      cursor: "pointer",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                  />
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  {/* Weight */}
                  <Field label="الوزن (كجم)" icon={<FaWeight size={12} />}>
                    <input
                      name="weight"
                      type="text"
                      onChange={handleChange}
                      value={values.weight}
                      style={inputStyle(false)}
                      placeholder="82"
                      onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                    />
                  </Field>

                  {/* Height */}
                  <Field label="الطول (سم)" icon={<FaRuler size={12} />}>
                    <input
                      name="tall"
                      type="text"
                      onChange={handleChange}
                      value={values.tall}
                      style={inputStyle(false)}
                      placeholder="180"
                      onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
                    />
                  </Field>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    height: "48px",
                    background: "#1e3a8a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "0.5rem",
                    fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#1e40af")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#1e3a8a")
                  }
                >
                  حفظ التعديلات
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default CustomerDataModal;
