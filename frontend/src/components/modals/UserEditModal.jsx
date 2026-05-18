import { Formik, Form } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { IoClose } from "react-icons/io5";
import {
  FaUser,
  FaPhone,
  FaBriefcase,
  FaDollarSign,
  FaUserTag,
  FaLock,
} from "react-icons/fa";
import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("الإسم مطلوب"),
  username: Yup.string().required("اسم المستخدم مطلوب"),
  role: Yup.string().required("الدور مطلوب"),
  mobile: Yup.string().matches(/^(010|011|012|015)[0-9]{8}$/, "رقم غير صالح"),
  qualification: Yup.string(),
  salary: Yup.number().typeError("يجب أن يكون رقماً"),
  password: Yup.string().min(6, "كلمة المرور قصيرة"),
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
  boxSizing: "border-box",
  fontFamily: "inherit",
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

function UserEditModal({
  openModal,
  setOpenModal,
  userData,
  setToast,
  setResponse,
  onSuccess,
}) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [passwordShown, setPasswordShown] = useState(false);

  if (!openModal || !userData) return null;

  return (
    <div
      onClick={() => setOpenModal(false)}
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
            تعديل بيانات الموظف
          </h3>
          <button
            onClick={() => setOpenModal(false)}
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

        <div style={{ padding: "1.5rem" }}>
          <Formik
            initialValues={{
              id: userData.id,
              name: userData.name || "",
              username: userData.username || "",
              password: "",
              role: userData.role || "",
              mobile: userData.phone || "",
              qualification: userData.qualification || "",
              salary: userData.salary || "",
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              try {
                const payload = { ...values };
                if (!payload.password) delete payload.password;
                const res = await axios.patch(`${apiUrl}/auth/user`, payload);
                setResponse(res.data);
                setOpenModal(false);
                setToast(true);
                onSuccess();
                setTimeout(() => setToast(false), 3000);
              } catch (e) {
                setResponse(e.response?.data || { Message: "حدث خطأ" });
                setToast(true);
              }
            }}
          >
            {({ errors, touched, handleChange, handleBlur, values }) => (
              <Form>
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
                    placeholder="محمد أحمد"
                  />
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <Field
                    label="اسم المستخدم"
                    icon={<FaUserTag size={13} />}
                    error={errors.username}
                    touched={touched.username}
                  >
                    <input
                      name="username"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.username}
                      style={inputStyle(errors.username && touched.username)}
                      placeholder="username"
                    />
                  </Field>
                  <Field
                    label="كلمة المرور (اختياري)"
                    icon={<FaLock size={12} />}
                    error={errors.password}
                    touched={touched.password}
                  >
                    <div style={{ position: "relative" }}>
                      <input
                        name="password"
                        type={passwordShown ? "text" : "password"}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                        style={{
                          ...inputStyle(errors.password && touched.password),
                          paddingLeft: "2.5rem",
                        }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordShown(!passwordShown)}
                        style={{
                          position: "absolute",
                          left: "0.5rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          color: "#9ca3af",
                          cursor: "pointer",
                        }}
                      >
                        {passwordShown ? (
                          <IoEyeOffOutline size={16} />
                        ) : (
                          <IoEyeOutline size={16} />
                        )}
                      </button>
                    </div>
                  </Field>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <Field
                    label="الدور"
                    icon={<FaBriefcase size={12} />}
                    error={errors.role}
                    touched={touched.role}
                  >
                    <select
                      name="role"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.role}
                      style={{
                        ...inputStyle(errors.role && touched.role),
                        appearance: "none",
                      }}
                    >
                      <option value="">اختر</option>
                      {/* <option value="admin">  </option> */}
                      <option value="manager">مدير</option>
                      <option value="casheir">كاشير</option>
                    </select>
                  </Field>
                  <Field
                    label="الموبايل"
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
                      placeholder="01xxxxxxxxx"
                    />
                  </Field>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <Field label="المؤهل" icon={<FaBriefcase size={12} />}>
                    <input
                      name="qualification"
                      type="text"
                      onChange={handleChange}
                      value={values.qualification}
                      style={inputStyle(false)}
                      placeholder="بكالوريوس"
                    />
                  </Field>
                  <Field
                    label="الراتب"
                    icon={<FaDollarSign size={12} />}
                    error={errors.salary}
                    touched={touched.salary}
                  >
                    <input
                      name="salary"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.salary}
                      style={inputStyle(errors.salary && touched.salary)}
                      placeholder="5000"
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
                  }}
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

export default UserEditModal;
