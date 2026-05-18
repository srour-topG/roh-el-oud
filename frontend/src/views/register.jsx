import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import SuccessToast from "../components/toasts/successToast";
import {
  FaUser,
  FaPhone,
  FaBriefcase,
  FaDollarSign,
  FaUserTag,
  FaLock,
  FaGraduationCap,
} from "react-icons/fa";
import { IoSaveOutline, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const apiUrl = import.meta.env.VITE_API_URL;

function Register() {
  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);
  const navigate = useNavigate();

  const SignupSchema = Yup.object().shape({
    name: Yup.string().required("الإسم مطلوب"),
    username: Yup.string().required("إسم المستخدم مطلوب"),
    password: Yup.string()
      .required("كلمة المرور مطلوبة")
      .min(6, "كلمة المرور قصيرة جداً"),
    role: Yup.string().required("الوظيفة مطلوبة"),
    mobile: Yup.string()
      .required("رقم الموبايل مطلوب")
      .matches(/^(010|011|012|015)[0-9]{8}$/, "رقم موبايل مصري صالح"),
    qualification: Yup.string().required("المؤهل مطلوب"),
    salary: Yup.number()
      .required("الراتب مطلوب")
      .typeError("يجب إدخال رقم صحيح"),
  });

  const sidebarImage =
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

  return (
    <div className="min-h-screen bg-white flex px-6 py-3" dir="rtl">
      {toast && <SuccessToast response={response} />}

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-slate-800">إضافة موظف جديد</h1>
          <p className="text-gray-500 text-sm mt-1">
            أدخل بيانات الموظف الجديد للانضمام إلى فريق العمل.
          </p>
        </div>

        <div className="flex-1 px-8 py-6">
          <Formik
            initialValues={{
              name: "",
              username: "",
              password: "",
              role: "",
              mobile: "",
              qualification: "",
              salary: "",
            }}
            validationSchema={SignupSchema}
            onSubmit={async (values) => {
              setIsSubmitting(true);
              setResponse(null);
              setToast(false);

              // Automatically set hiringDate to today
              const hiringDate = format(new Date(), "yyyy-MM-dd");

              const payload = {
                ...values,
                hiringDate,
              };

              try {
                const res = await axios.post(
                  `${apiUrl}/auth/register`,
                  payload,
                );
                setResponse(res.data);
                setToast(true);
                setTimeout(() => {
                  navigate("/users");
                }, 2000);
              } catch (error) {
                setResponse({
                  statusCode: "500",
                  Message: error.response?.data?.Message || "حدث خطأ في الحفظ",
                });
                setToast(true);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {({ errors, touched, handleChange, handleBlur, values }) => (
              <Form className="max-w-2xl">
                {/* Name */}
                <div className="mb-5">
                  <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <input
                      name="name"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.name}
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
                        errors.name && touched.name
                          ? "border-red-400"
                          : "border-gray-200"
                      }`}
                      placeholder="مثال: محمد أحمد علي"
                    />
                    <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {touched.name && errors.name && (
                    <div className="text-red-500 text-xs mt-1 text-right">
                      {errors.name}
                    </div>
                  )}
                </div>

                {/* Username & Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      اسم المستخدم
                    </label>
                    <div className="relative">
                      <input
                        name="username"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.username}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.username && touched.username
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="اسم المستخدم"
                      />
                      <FaUserTag className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {touched.username && errors.username && (
                      <div className="text-red-500 text-xs mt-1 text-right">
                        {errors.username}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={passwordShown ? "text" : "password"}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                        className={`w-full px-4 py-3 pr-12 pl-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.password && touched.password
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="••••••••"
                      />
                      <FaLock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setPasswordShown(!passwordShown)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {passwordShown ? (
                          <IoEyeOffOutline size={18} />
                        ) : (
                          <IoEyeOutline size={18} />
                        )}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <div className="text-red-500 text-xs mt-1 text-right">
                        {errors.password}
                      </div>
                    )}
                  </div>
                </div>

                {/* Role & Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      الوظيفة
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.role}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 appearance-none ${
                          errors.role && touched.role
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                      >
                        <option value="" disabled>
                          اختر الوظيفة
                        </option>
                        <option value="admin">مدير</option>
                        <option value="captin">مدرب</option>
                        <option value="receptionist">موظف استقبال</option>
                      </select>
                      <FaBriefcase className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {touched.role && errors.role && (
                      <div className="text-red-500 text-xs mt-1 text-right">
                        {errors.role}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      رقم الموبايل
                    </label>
                    <div className="relative">
                      <input
                        name="mobile"
                        type="tel"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.mobile}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.mobile && touched.mobile
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="01XXXXXXXXX"
                      />
                      <FaPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
                    </div>
                    {touched.mobile && errors.mobile && (
                      <div className="text-red-500 text-xs mt-1 text-right">
                        {errors.mobile}
                      </div>
                    )}
                  </div>
                </div>

                {/* Qualification & Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      المؤهل الدراسي
                    </label>
                    <div className="relative">
                      <input
                        name="qualification"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.qualification}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.qualification && touched.qualification
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="بكالوريوس تجارة"
                      />
                      <FaGraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {touched.qualification && errors.qualification && (
                      <div className="text-red-500 text-xs mt-1 text-right">
                        {errors.qualification}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      الراتب الشهري
                    </label>
                    <div className="relative">
                      <input
                        name="salary"
                        type="number"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.salary}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.salary && touched.salary
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="0.00"
                      />
                      <FaDollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {touched.salary && errors.salary && (
                      <div className="text-red-500 text-xs mt-1 text-right">
                        {errors.salary}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                >
                  {isSubmitting ? (
                    <span>جاري الحفظ...</span>
                  ) : (
                    <>
                      <IoSaveOutline size={20} />
                      <span>حفظ الموظف</span>
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-[400px] xl:w-[450px] relative bg-slate-900 rounded-l-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={sidebarImage}
            alt="Team"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-8 h-full">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-4">
              CARDIO TEAM
            </span>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              انضم إلى فريق كارديوا
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              نوفر بيئة عمل احترافية تدعم التطور الوظيفي والإبداع.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
