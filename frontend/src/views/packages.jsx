import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import axios from "axios";
import { IoAdd, IoClose } from "react-icons/io5";
import { GoPackage } from "react-icons/go";
import { MdModeEdit, MdDelete } from "react-icons/md";
import { addpackage, editPackage } from "../services/packages";
import SuccessToast from "../components/toasts/successToast";
import { LoadingSpinner } from "../pinner";
import DeleteConfirmationModal from "../components/modals/deleteConfirmModal";

// ── Shared field styles ────────────────────────────────────────────────────────
const IS = (err) => ({
  width: "100%",
  height: "44px",
  padding: "0 0.875rem",
  border: `1px solid ${err ? "#ef4444" : "#e5e7eb"}`,
  borderRadius: "10px",
  fontSize: "14px",
  background: "#f9fafb",
  color: "#374151",
  outline: "none",
  textAlign: "right",
  direction: "rtl",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.15s",
});

const PackageSchema = Yup.object().shape({
  name: Yup.string().required("نوع الباقة مطلوب"),
  duration: Yup.number()
    .required("المدة مطلوبة")
    .positive("يجب أن تكون أكبر من صفر"),
  count: Yup.number().required("عدد الجلسات مطلوب").positive(),
  price: Yup.number().required("السعر مطلوب").positive(),
});

const PACKAGE_TYPES = ["تمرينة", "شهري", "سنوي", "نصف سنوي"];

// ── Package form (shared between Add and Edit) ─────────────────────────────────
function PackageForm({ initialValues, onSubmit, submitLabel = "حفظ" }) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={PackageSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      {({ errors, touched, handleChange, handleBlur, values }) => (
        <Form>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            {/* Type */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                نوع الباقة
              </label>
              <select
                name="name"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.name}
                style={{
                  ...IS(errors.name && touched.name),
                  cursor: "pointer",
                  appearance: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              >
                <option value="" disabled>
                  اختر نوع
                </option>
                {PACKAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {touched.name && errors.name && (
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#ef4444",
                  }}
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                المدة (أيام)
              </label>
              <input
                name="duration"
                type="number"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.duration}
                style={IS(errors.duration && touched.duration)}
                placeholder="30"
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              />
              {touched.duration && errors.duration && (
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#ef4444",
                  }}
                >
                  {errors.duration}
                </p>
              )}
            </div>

            {/* Sessions */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                عدد الجلسات
              </label>
              <input
                name="count"
                type="number"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.count}
                style={IS(errors.count && touched.count)}
                placeholder="12"
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              />
              {touched.count && errors.count && (
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#ef4444",
                  }}
                >
                  {errors.count}
                </p>
              )}
            </div>

            {/* Price */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                السعر (جنيه)
              </label>
              <input
                name="price"
                type="number"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.price}
                style={IS(errors.price && touched.price)}
                placeholder="500"
                onFocus={(e) => (e.target.style.borderColor = "#1e3a8a")}
              />
              {touched.price && errors.price && (
                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: "11px",
                    color: "#ef4444",
                  }}
                >
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              height: "46px",
              background: "#1e3a8a",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1e40af")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1e3a8a")}
          >
            {submitLabel}
          </button>
        </Form>
      )}
    </Formik>
  );
}

function EditPackageModal({
  openEditModal,
  setOpenEditModal,
  editedPackage,
  setRerender,
  reRender,
  setToast,
  setResponse,
}) {
  if (!openEditModal || !editedPackage) return null;

  return (
    <div
      onClick={() => setOpenEditModal(false)}
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
          padding: "1.75rem",
          width: "min(480px, 96vw)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          position: "relative",
        }}
      >
        <button
          onClick={() => setOpenEditModal(false)}
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            width: "30px",
            height: "30px",
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
          <IoClose size={15} />
        </button>

        <h3
          style={{
            margin: "0 0 1.25rem",
            fontSize: "17px",
            fontWeight: "700",
            color: "#1e3a8a",
          }}
        >
          تعديل الباقة
        </h3>

        <PackageForm
          initialValues={{
            id: editedPackage.id,
            name: editedPackage.type,
            duration: editedPackage.duration,
            count: editedPackage.count,
            price: editedPackage.price,
          }}
          submitLabel="حفظ التعديلات"
          onSubmit={async (values) => {
            try {
              const res = await editPackage(values);
              setResponse(res.data);
              setToast(true);
              setOpenEditModal(false);
              setRerender((v) => !v);
              setTimeout(() => setToast(false), 3000);
            } catch (e) {
              setResponse(e.response?.data || { Message: "حدث خطأ" });
              setToast(true);
            }
          }}
        />
      </div>
    </div>
  );
}

// ── Package row card ───────────────────────────────────────────────────────────
function PackageCard({ pkg, onEdit, onDelete }) {
  const typeColors = {
    تمرينة: { bg: "#eff6ff", color: "#1d4ed8" },
    شهري: { bg: "#f0fdf4", color: "#15803d" },
    سنوي: { bg: "#fdf4ff", color: "#7e22ce" },
    "نصف سنوي": { bg: "#fff7ed", color: "#c2410c" },
  };
  const tc = typeColors[pkg.type] || { bg: "#f3f4f6", color: "#374151" };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Left: type badge + stats */}
      <div
        style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: tc.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <GoPackage size={20} color={tc.color} />
        </div>
        <div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "20px",
              background: tc.bg,
              color: tc.color,
            }}
          >
            {pkg.type}
          </span>
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "6px" }}>
            {[
              ["المدة", `${pkg.duration} يوم`],
              ["الجلسات", `${pkg.count} جلسة`],
              ["السعر", `${pkg.price} جنيه`],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#1f2937",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button
          onClick={() => onEdit(pkg)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#374151",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#eff6ff";
            e.currentTarget.style.borderColor = "#bfdbfe";
            e.currentTarget.style.color = "#1e3a8a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#374151";
          }}
        >
          <MdModeEdit size={16} />
        </button>
        <button
          onClick={() => onDelete(pkg.id)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#374151",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#fef2f2";
            e.currentTarget.style.borderColor = "#fecaca";
            e.currentTarget.style.color = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f9fafb";
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#374151";
          }}
        >
          <MdDelete size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Main Packages page ─────────────────────────────────────────────────────────
function Packages() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState();
  const [openModal, setOpenModal] = useState(false);
  const [packageID, setPackageID] = useState();
  const [packages, setPackages] = useState([]);
  const [reRender, setRerender] = useState(false);
  const [editedPackage, setEditedPackage] = useState();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    setPackagesLoading(true);
    axios
      .get(`${apiUrl}/packages`)
      .then((r) => setPackages(r.data.packages))
      .catch(console.error)
      .finally(() => setPackagesLoading(false));
  }, [reRender]);

  function deletePack() {
    axios
      .delete(`${apiUrl}/packages`, { data: { packageID } })
      .then((r) => {
        setPackages((prev) => prev.filter((p) => p.id !== packageID));
        setResponse(r.data);
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      })
      .catch((e) => {
        setResponse(e.response?.data);
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      });
  }

  async function handleAdd(values, { resetForm }) {
    try {
      const res = await addpackage(values);
      setResponse(res.data);
      setToast(true);
      setRerender((v) => !v);
      resetForm();
      setActiveTab("list");
      setTimeout(() => setToast(false), 3000);
    } catch (e) {
      setResponse(e.response?.data || { Message: "حدث خطأ" });
      setToast(true);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        background: "#f7f8fc",
        minHeight: "100vh",
        padding: "1.5rem 1rem",
      }}
    >
      {toast && <SuccessToast response={response} />}
      <DeleteConfirmationModal
        execFunc={deletePack}
        openModal={openModal}
        setOpenModal={setOpenModal}
      />
      <EditPackageModal
        openEditModal={openEditModal}
        setOpenEditModal={setOpenEditModal}
        editedPackage={editedPackage}
        setRerender={setRerender}
        reRender={reRender}
        setToast={setToast}
        setResponse={setResponse}
      />

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Page header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: "800",
              color: "#1a1f36",
            }}
          >
            الباقات
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
            إدارة باقات الاشتراك والعروض
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #f0f2f8" }}>
            {[
              {
                key: "list",
                label: "الباقات الحالية",
                icon: <GoPackage size={14} />,
              },
              {
                key: "add",
                label: "إضافة باقة جديدة",
                icon: <IoAdd size={16} />,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  height: "52px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeTab === tab.key
                      ? "2px solid #1e3a8a"
                      : "2px solid transparent",
                  fontSize: "14px",
                  fontWeight: activeTab === tab.key ? "700" : "500",
                  color: activeTab === tab.key ? "#1e3a8a" : "#9ca3af",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                  marginBottom: "-1px",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Packages list tab */}
          {activeTab === "list" && (
            <div style={{ padding: "1.25rem" }}>
              {packagesLoading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "3rem",
                  }}
                >
                  <LoadingSpinner size="xl" />
                </div>
              ) : packages?.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "3rem",
                    color: "#9ca3af",
                    fontSize: "14px",
                  }}
                >
                  لا توجد باقات حتى الآن
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      onEdit={(p) => {
                        setEditedPackage(p);
                        setOpenEditModal(true);
                      }}
                      onDelete={(id) => {
                        setPackageID(id);
                        setOpenModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add tab */}
          {activeTab === "add" && (
            <div style={{ padding: "1.5rem" }}>
              <PackageForm
                initialValues={{ name: "", duration: "", count: "", price: "" }}
                submitLabel="إضافة الباقة"
                onSubmit={handleAdd}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Packages;
