import landingImage from "../assets/roh.jpeg";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { login } from "../services/auth";
import { useState } from "react";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { toast, Toaster } from "sonner";

function Landing() {
  const [passwordShown, setPasswordShown] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const { login: setAuthUser } = useAuth();
  const navigate = useNavigate();

  const SignupSchema = Yup.object().shape({
    password: Yup.string().required("كلمة المرور مطلوبة"),
    username: Yup.string().required("اسم المستخدم مطلوب"),
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
      <Toaster position="top-center" richColors dir="rtl" />

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-30" />

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* Branding Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-md mb-4">
              <img
                src={landingImage}
                alt="روح العود"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">روح العود</h1>
            <p className="text-sm text-slate-600 font-medium mt-0.5 tracking-wide">
              ROUH AL OUD
            </p>
            <p className="text-xs text-slate-500 mt-2">
              نظام نقاط البيع والمخزون
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <hr className="flex-1 border-slate-200" />
            <span className="text-xs text-slate-500">تسجيل الدخول</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          {/* Form */}
          <Formik
            initialValues={{
              username: "",
              password: "",
            }}
            validationSchema={SignupSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setButtonLoading(true);
              try {
                const res = await login(values);
                toast.success("أهلاً بك في روح العود");
                setAuthUser(res.data.userInfo || res.data.user);
                navigate("/cashier", { replace: true });
              } catch (error) {
                const message =
                  error.response?.data?.message ||
                  error.response?.data?.Message ||
                  "فشل تسجيل الدخول";
                toast.error(message);
              } finally {
                setButtonLoading(false);
                setSubmitting(false);
              }
            }}
          >
            {({ errors, touched, handleChange, handleBlur, values }) => (
              <Form className="space-y-4">
                {/* Username Input */}
                <div>
                  <input
                    dir="rtl"
                    name="username"
                    type="text"
                    value={values.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="اسم المستخدم"
                    className={`w-full p-3 rounded-lg border outline-none transition text-gray-600 bg-white
                      ${
                        errors.username && touched.username
                          ? "border-red-500 ring-1 ring-red-500/20"
                          : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      }`}
                  />
                  {touched.username && errors.username && (
                    <p className="text-red-600 text-xs mt-2 text-right">
                      {errors.username}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <input
                      dir="rtl"
                      name="password"
                      type={passwordShown ? "text" : "password"}
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="كلمة المرور"
                      className={` w-full p-3 rounded-lg border outline-none transition text-gray-600
                      ${
                        errors.password && touched.password
                          ? "border-red-500 ring-1 ring-red-500/20"
                          : "border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                      }`}
                    />

                    {/* Eye Icon */}
                    <button
                      type="button"
                      onClick={() => setPasswordShown(!passwordShown)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                    >
                      {passwordShown ? (
                        <FaRegEye size={18} />
                      ) : (
                        <FaRegEyeSlash size={18} />
                      )}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-red-600 text-xs mt-2 text-right">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={buttonLoading}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed mt-6"
                >
                  {buttonLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </button>
              </Form>
            )}
          </Formik>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            روح العود © {new Date().getFullYear()} — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
