import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { IoClose } from "react-icons/io5";
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
import { toast } from "sonner";

const apiUrl = import.meta.env.VITE_API_URL;

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
  salary: Yup.number().required("الراتب مطلوب").typeError("يجب إدخال رقم صحيح"),
});

function RegisterModal({ openModal, setOpenModal, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordShown, setPasswordShown] = useState(false);

  if (!openModal) return null;

  const handleClose = () => {
    setOpenModal(false);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-5 md:px-8 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
          <h3 className="text-lg font-bold text-[#1e3a8a]">إضافة موظف جديد</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
          >
            <IoClose size={18} />
          </button>
        </div>

        <div className="px-6 py-6 md:px-8 md:py-7">
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

              const hiringDate = format(new Date(), "yyyy-MM-dd");
              const payload = { ...values, hiringDate };

              try {
                const res = await axios.post(
                  `${apiUrl}/auth/register`,
                  payload,
                );
                toast.success(res.data?.Message || "تمت إضافة الموظف بنجاح");
                handleClose();
                if (onSuccess) onSuccess();
              } catch (error) {
                const message =
                  error.response?.data?.Message || "حدث خطأ في الحفظ";
                toast.error(message);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {({ errors, touched, handleChange, handleBlur, values }) => (
              <Form className="space-y-5">
                {/* الاسم الكامل */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <input
                      name="name"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.name}
                      className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                        errors.name && touched.name
                          ? "border-red-400"
                          : "border-gray-200"
                      }`}
                      placeholder="مثال: محمد أحمد علي"
                    />
                    <FaUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  </div>
                  {touched.name && errors.name && (
                    <p className="text-red-500 text-xs mt-1 text-right">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* اسم المستخدم + كلمة المرور */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      اسم المستخدم
                    </label>
                    <div className="relative">
                      <input
                        name="username"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.username}
                        className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.username && touched.username
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="اسم المستخدم"
                      />
                      <FaUserTag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                    {touched.username && errors.username && (
                      <p className="text-red-500 text-xs mt-1 text-right">
                        {errors.username}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        type={passwordShown ? "text" : "password"}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.password}
                        className={`w-full h-12 px-4 pr-11 pl-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.password && touched.password
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="••••••••"
                      />
                      <FaLock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <button
                        type="button"
                        onClick={() => setPasswordShown(!passwordShown)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {passwordShown ? (
                          <IoEyeOffOutline size={16} />
                        ) : (
                          <IoEyeOutline size={16} />
                        )}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="text-red-500 text-xs mt-1 text-right">
                        {errors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* الوظيفة + الموبايل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      الوظيفة
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.role}
                        className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.role && touched.role
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                      >
                        <option value="" disabled>
                          اختر الوظيفة
                        </option>
                        <option value="admin">مدير النظام</option>
                        <option value="manager">مدير</option>
                        <option value="cashier">كاشير</option>
                      </select>
                      <FaBriefcase className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    </div>
                    {touched.role && errors.role && (
                      <p className="text-red-500 text-xs mt-1 text-right">
                        {errors.role}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      رقم الموبايل
                    </label>
                    <div className="relative">
                      <input
                        name="mobile"
                        type="tel"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.mobile}
                        className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.mobile && touched.mobile
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="01XXXXXXXXX"
                      />
                      <FaPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm rotate-90" />
                    </div>
                    {touched.mobile && errors.mobile && (
                      <p className="text-red-500 text-xs mt-1 text-right">
                        {errors.mobile}
                      </p>
                    )}
                  </div>
                </div>

                {/* المؤهل + الراتب */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      المؤهل الدراسي
                    </label>
                    <div className="relative">
                      <input
                        name="qualification"
                        type="text"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.qualification}
                        className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.qualification && touched.qualification
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="بكالوريوس تجارة"
                      />
                      <FaGraduationCap className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                    {touched.qualification && errors.qualification && (
                      <p className="text-red-500 text-xs mt-1 text-right">
                        {errors.qualification}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      الراتب الشهري
                    </label>
                    <div className="relative">
                      <input
                        name="salary"
                        type="number"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.salary}
                        className={`w-full h-12 px-4 pr-11 rounded-xl border bg-gray-50 text-gray-700 text-sm outline-none transition-all focus:bg-white focus:border-blue-500 ${
                          errors.salary && touched.salary
                            ? "border-red-400"
                            : "border-gray-200"
                        }`}
                        placeholder="0.00"
                      />
                      <FaDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                    {touched.salary && errors.salary && (
                      <p className="text-red-500 text-xs mt-1 text-right">
                        {errors.salary}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-6"
                >
                  {isSubmitting ? (
                    "جاري الحفظ..."
                  ) : (
                    <>
                      <IoSaveOutline size={18} />
                      <span>حفظ الموظف</span>
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default RegisterModal;
