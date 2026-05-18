import { useState, useRef, useEffect } from "react";
import { Button, Modal, Spinner } from "flowbite-react";
import Webcam from "react-webcam";
import { FaCamera, FaCheck } from "react-icons/fa";
import { HiUpload } from "react-icons/hi";
import { RiResetRightFill } from "react-icons/ri";
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

function ChangeImageModal({
  camModal,
  setCamModal,
  customerID,
  setDataRender,
  dataRender,
  setToast,
  setResponse,
}) {
  const [uploadMethod, setUploadMethod] = useState("file");
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [webcamError, setWebcamError] = useState(false);
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };
    if (camModal) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [camModal]);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith("image/")) {
      alert("الرجاء اختيار ملف صورة فقط");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
      return;
    }
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setFile(selectedFile);
  };

  const handleCapture = () => {
    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        const capturedFile = base64ToFile(imageSrc, `webcam-${Date.now()}.jpg`);
        setPreview(imageSrc);
        setFile(capturedFile);
      } else {
        alert("لم يتم التقاط الصورة. حاول مرة أخرى.");
      }
    } catch (err) {
      console.error("Webcam capture error:", err);
      alert("حدث خطأ أثناء التقاط الصورة");
    }
  };

  const resetSelection = () => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setWebcamError(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.put(
        `${apiUrl}/customer/${customerID}/image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setResponse(res.data);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
      setDataRender(!dataRender);
      setCamModal(false);
      resetSelection();
    } catch (error) {
      console.error("Upload error:", error);
      setResponse(
        error.response?.data || { Message: "حدث خطأ أثناء رفع الصورة" },
      );
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCamModal(false);
    resetSelection();
    setUploadMethod("webcam");
  };

  if (!camModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Modal card - stop propagation to prevent closing when clicking inside */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            تغيير الصورة الشخصية
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Method Toggle */}
          <div className="flex gap-2">
            <Button
              color={uploadMethod === "webcam" ? "blue" : "gray"}
              onClick={() => {
                setUploadMethod("webcam");
                resetSelection();
              }}
              className="flex-1"
            >
              <FaCamera className="ml-2 h-4 w-4" />
              الكاميرا
            </Button>
            <Button
              color={uploadMethod === "file" ? "blue" : "gray"}
              onClick={() => {
                setUploadMethod("file");
                resetSelection();
              }}
              className="flex-1"
            >
              <HiUpload className="ml-2 h-4 w-4" />
              رفع ملف
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {preview ? (
            <div className="space-y-3">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-contain rounded-lg border"
              />
              <div className="flex gap-2">
                <Button
                  color="gray"
                  onClick={resetSelection}
                  className="flex-1"
                >
                  <RiResetRightFill className="ml-2 h-5 w-5" />
                  إعادة
                </Button>
                <Button
                  color="default"
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Spinner size="sm" className="ml-2" />}
                  {loading ? "جاري الرفع..." : "حفظ الصورة"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {uploadMethod === "webcam" ? (
                <div className="relative">
                  {webcamError ? (
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-red-500">
                        تعذر الوصول إلى الكاميرا. تأكد من منح الإذن.
                      </p>
                    </div>
                  ) : (
                    <Webcam
                      mirrored
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full rounded-lg"
                      style={{ height: "300px", objectFit: "cover" }}
                      onUserMediaError={() => setWebcamError(true)}
                    />
                  )}
                  <Button
                    color="blue"
                    onClick={handleCapture}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2"
                    disabled={webcamError}
                  >
                    <FaCamera className="ml-2 h-5 w-5" />
                    التقاط صورة
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-400 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 h-64 flex flex-col items-center justify-center"
                >
                  <HiUpload className="h-16 w-16 text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium text-lg">
                    اضغط لاختيار صورة من الجهاز
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    JPG, PNG (Max 5MB)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <Button color="red" onClick={handleClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChangeImageModal;
