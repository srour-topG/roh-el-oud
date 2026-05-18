import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState, useRef } from "react";
import SuccessToast from "../components/toasts/successToast";
import Webcam from "react-webcam";
import { HiUpload } from "react-icons/hi";
import {
  FaCamera,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaWeight,
  FaRuler,
  FaCalendarAlt,
  FaVenusMars,
} from "react-icons/fa";
import { RiResetRightFill } from "react-icons/ri";
import { IoSaveOutline } from "react-icons/io5";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DateInput from "../components/dateInput";
// import sidebarImg from "../assets/sidebar.png";

const apiUrl = import.meta.env.VITE_API_URL;

function AddCustomer() {
  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState("file");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

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
    birthDate: Yup.string().optional(),
    weight: Yup.string().optional(),
    tall: Yup.string().optional(),
  });

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleFileChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("الرجاء اختيار ملف صورة فقط");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
        return;
      }
      setImageFile(file);
      setFieldValue("image", file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCapture = (setFieldValue) => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      const file = base64ToFile(imageSrc, `webcam-${Date.now()}.jpg`);
      setImageFile(file);
      setFieldValue("image", file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetImage = (setFieldValue) => {
    setImageFile(null);
    setFieldValue("image", null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-white flex px-6 py-3" dir="rtl">
      {toast && <SuccessToast response={response} />}

      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto ">
        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-slate-800">
            إضافة مشترك جديد
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            أدخل تفاصيل العضوية الجديدة للبدء في تتبع الأداء الرياضي.
          </p>
        </div>

        <div className="flex-1 px-8 py-6">
          <Formik
            initialValues={{
              name: "",
              mobile: "",
              Gender: "ذكر",
              Address: "",
              birthDate: "",
              weight: "",
              tall: "",
              image: null,
            }}
            validationSchema={SignupSchema}
            onSubmit={async (values) => {
              setIsSubmitting(true);
              setResponse(null);
              setToast(false);

              const formData = new FormData();
              formData.append("name", values.name);
              formData.append("mobile", values.mobile);
              formData.append("Gender", values.Gender);
              formData.append("Address", values.Address);
              formData.append("birthDate", values.birthDate);
              formData.append("weight", values.weight);
              formData.append("tall", values.tall);
              if (values.image) {
                formData.append("image", values.image);
              }

              try {
                const res = await axios.post(`${apiUrl}/customer`, formData, {
                  headers: { "Content-Type": "multipart/form-data" },
                });

                setResponse(res.data);
                setToast(true);
                setTimeout(() => {
                  navigate(`/customer/${res.data.customerID}`);
                }, 2000);
              } catch (error) {
                setResponse({
                  statusCode: "500",
                  Message: error.response?.data?.Message || "حدث خطأ في الرفع",
                });
                setToast(true);
              } finally {
                setIsSubmitting(false);
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
              <Form className="max-w-2xl">
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
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors.name && touched.name ? "border-red-400" : "border-gray-200"}`}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      الجنس
                    </label>
                    <div className="relative">
                      <select
                        name="Gender"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={values.Gender}
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 appearance-none ${errors.Gender && touched.Gender ? "border-red-400" : "border-gray-200"}`}
                      >
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                      <FaVenusMars className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
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
                        className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${errors.mobile && touched.mobile ? "border-red-400" : "border-gray-200"}`}
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

                <div className="mb-5">
                  <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                    العنوان بالتفصيل
                  </label>
                  <div className="relative">
                    <input
                      name="Address"
                      type="text"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.Address}
                      className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-xl text-right text-gray-900 outline-none transition-all focus:bg-white focus:border-blue-500 ${errors.Address && touched.Address ? "border-red-400" : "border-gray-200"}`}
                      placeholder="دسوق - شارع الجيش - بجوار البنك الأهلي"
                    />
                    <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  {touched.Address && errors.Address && (
                    <div className="text-red-500 text-xs mt-1 text-right">
                      {errors.Address}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                      تاريخ الميلاد
                    </label>
                    <DateInput
                      value={values.birthDate}
                      onChange={(date) => setFieldValue("birthDate", date)}
                      error={errors.birthDate}
                      touched={touched.birthDate}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                        الوزن الحالي
                      </label>
                      <div className="relative">
                        <input
                          name="weight"
                          type="text"
                          onChange={handleChange}
                          value={values.weight}
                          className="w-full px-3 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-right text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                          placeholder="0.0"
                        />
                        <FaWeight className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 text-sm font-medium mb-2 text-right">
                        الطول
                      </label>
                      <div className="relative">
                        <input
                          name="tall"
                          type="text"
                          onChange={handleChange}
                          value={values.tall}
                          className="w-full px-3 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-right text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                          placeholder="0.0"
                        />
                        <FaRuler className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-slate-700 text-sm font-medium mb-3 text-right">
                    الصورة الشخصية
                  </label>

                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setUploadMethod("file");
                        resetImage(setFieldValue);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${uploadMethod === "file" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      <HiUpload className="inline ml-2" />
                      رفع ملف
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadMethod("webcam");
                        resetImage(setFieldValue);
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${uploadMethod === "webcam" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      <FaCamera className="inline ml-2" />
                      الكاميرا
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e, setFieldValue)}
                    accept="image/*"
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative w-40 h-40 mx-auto">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-xl shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => resetImage(setFieldValue)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-lg"
                      >
                        <RiResetRightFill className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                      {uploadMethod === "webcam" ? (
                        <div className="space-y-3">
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            mirrored={true}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="w-full max-w-xs mx-auto rounded-lg"
                            style={{ height: "160px", objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            onClick={() => handleCapture(setFieldValue)}
                            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
                          >
                            التقاط صورة
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="cursor-pointer"
                        >
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <HiUpload className="text-gray-400 text-2xl" />
                          </div>
                          <p className="text-gray-600 font-medium">
                            اضغط لاختيار صورة
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            JPG, PNG (حد أقصى 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                      <span>حفظ المشترك</span>
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[400px] xl:w-[450px] relative bg-slate-900 rounded-l-2xl overflow-hidden">
        <div className="absolute inset-0 ">
          <img
            // src={sidebarImg}
            alt="Gym Equipment"
            className="w-full h-full object-cover opacity-90 -translate-y-1"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-end p-8 h-full">
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-4">
              ELITE PERFORMANCE
            </span>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              ابدأ رحلة التميز مع كارديوا
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              نحن لا نقدم صالة ألعاب رياضية فحسب، بل نقدم تجارب أداء استثنائية
              لأعضائنا.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCustomer;
