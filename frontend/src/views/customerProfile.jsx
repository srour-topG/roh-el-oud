import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaMobileScreenButton,
  FaWeightScale,
  FaCamera,
  FaMars,
  FaVenus,
  FaQrcode,
} from "react-icons/fa6";
import { TbRulerMeasure2 } from "react-icons/tb";
import { FaLocationDot } from "react-icons/fa6";
import { SlCalender } from "react-icons/sl";
import { MdModeEdit } from "react-icons/md";
import { differenceInYears, differenceInDays } from "date-fns";
import { DateTime } from "luxon";
import CustomerDataModal from "../components/modals/customerData";
import SuccessToast from "../components/toasts/successToast";
import ChangeImageModal from "../components/modals/ChangeImageModal";
import DeleteConfirmationModal from "../components/modals/deleteConfirmModal";
import { LoadingSpinner } from "../pinner";
import SubscriptionCard from "../components/cards/subscriptionCard";
import BarcodeModal from "../components/modals/BarcodeModal";
import CustomerAttendance from "../components/customerAttendance";
import SubscribeModal from "../components/modals/SubscribeModal";
import ImageWithAuth from "../components/ImageWithAuth";
import { maskAddress, maskAge, maskMobile } from "../utils/maskFemale";
import { useAuth } from "../context/AuthContext";
// import img from "../assets/landing2.png";
import { CustomerDebtPanel } from "../components/customerDebtPanel";
import DebtBadge, { useCustomerDebt } from "../components/debtBadge";

const today = DateTime.now().setZone("Africa/Cairo").toFormat("yyyy-MM-dd");

function getSubStatus(sub) {
  if (!sub) return null;
  const daysLeft = differenceInDays(new Date(sub.endDate), new Date());
  if (sub.status !== "active")
    return {
      type: "archived",
      label: "مؤرشف",
      color: "#6b7280",
      bg: "#f3f4f6",
    };
  if (sub.availableSessions === 0 || sub.endDate < today)
    return { type: "ended", label: "منتهي", color: "#dc2626", bg: "#fef2f2" };
  if (daysLeft <= 7)
    return {
      type: "soon",
      label: `ينتهي خلال ${new Intl.NumberFormat("ar-EG").format(daysLeft)} يوم`,
      color: "#d97706",
      bg: "#fffbeb",
    };
  return { type: "active", label: "نشط", color: "#16a34a", bg: "#f0fdf4" };
}

const SignupSchema = Yup.object().shape({
  packID: Yup.number().required("اختر باقة"),
});

function Profile() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { id: customerID } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { hasDebt, totalRemaining } = useCustomerDebt(customerID);

  const [packages, setPackages] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [customerData, setCustomerData] = useState({});
  const [activeTab, setActiveTab] = useState("subs");
  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState();
  const [subscriptionsRender, setSubscriptionsRender] = useState(false);
  const [dataRender, setDataRender] = useState(false);
  const [camModal, setCamModal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openDataModal, setOpenDataModal] = useState(false);
  const [barcodeModal, setBarcodeModal] = useState(false);
  const [subID, setSubId] = useState("");
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);
  const [subscribeModal, setSubscribeModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const age = customerData?.birthDate
    ? differenceInYears(new Date(), new Date(customerData.birthDate))
    : null;

  const activeSubscription = subscriptions.find((s) => s.status === "active");
  const subStatus = getSubStatus(activeSubscription);
  const getImageUrl = () => customerData?.image ;

  useEffect(() => {
    axios
      .get(`${apiUrl}/packages`)
      .then((r) => setPackages(r.data.packages))
      .catch(console.error);
  }, []);

  useEffect(() => {
    axios
      .get(`${apiUrl}/subscription/${customerID}`)
      .then((r) => setSubscriptions(r.data.subscriptions))
      .catch(console.error)
      .finally(() => setSubscriptionsLoading(false));
  }, [subscriptionsRender, customerID]);

  useEffect(() => {
    axios
      .get(`${apiUrl}/customer/${customerID}`)
      .then((r) => {
        setCustomerData(r.data.customer);
        if (!r.data.customer) navigate("/not-found");
      })
      .catch(console.error)
      .finally(() => setCustomerLoading(false));
  }, [dataRender, customerID]);

  // const subscribe = (packId) => {
  //   axios
  //     .post(`${apiUrl}/subscribe`, { packID: packId, customerID })
  //     .then((r) => {
  //       setToast(true);
  //       setResponse(r.data);
  //       setSubscriptionsRender((v) => !v);
  //       setTimeout(() => setToast(false), 3000);
  //     })
  //     .catch((e) => {
  //       setToast(true);
  //       setResponse(e.response?.data || e.message);
  //       setTimeout(() => setToast(false), 3000);
  //     });
  // };

  const deleteSub = () => {
    axios
      .delete(`${apiUrl}/subscribe`, { data: { id: subID } })
      .then((r) => {
        setToast(true);
        setResponse(r.data);
        setSubscriptionsRender((v) => !v);
        setTimeout(() => setToast(false), 3000);
      })
      .catch((e) => {
        setToast(true);
        setResponse(e.response?.data || e.message);
        setTimeout(() => setToast(false), 3000);
      });
  };

  if (customerLoading) return <LoadingSpinner fullPage />;

  return (
    <div dir="rtl" className="bg-gray-50 min-h-screen">
      {toast && <SuccessToast response={response} />}
      {camModal && (
        <ChangeImageModal
          dataRender={dataRender}
          setDataRender={setDataRender}
          customerID={customerID}
          setToast={setToast}
          response={response}
          setResponse={setResponse}
          setCamModal={setCamModal}
          camModal={camModal}
        />
      )}
      {barcodeModal && (
        <BarcodeModal
          customer={customerData}
          onClose={() => setBarcodeModal(false)}
        />
      )}
      <DeleteConfirmationModal
        execFunc={deleteSub}
        openModal={openModal}
        setOpenModal={setOpenModal}
      />
      <CustomerDataModal
        dataRender={dataRender}
        setDataRender={setDataRender}
        customerData={customerData}
        openDataModal={openDataModal}
        setOpenDataModal={setOpenDataModal}
        setToast={setToast}
        response={response}
        setResponse={setResponse}
      />

      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-md mb-5">
          {/* Banner with avatar inside (at the top) */}
          <div
            className="relative h-48 sm:h-56 md:h-64"
            style={{
              background:
                "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 left-1/4 w-32 h-32 rounded-full bg-white/5" />

            {/* ID chip top‑right */}
            <div className="absolute top-3 right-3 z-10">
              <span className="text-xs font-bold text-white/90 bg-white/15 border border-white/25 px-3 py-1 rounded-full">
                #{customerData.id}
              </span>
            </div>

            {/* Action buttons top‑left */}
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <button
                onClick={() => setOpenDataModal(true)}
                className="w-9 h-9 rounded-full bg-white/15 border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition"
              >
                <MdModeEdit size={15} />
              </button>
              <button
                onClick={() => setBarcodeModal(true)}
                className="w-9 h-9 rounded-full bg-white/15 border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition"
              >
                <FaQrcode size={14} />
              </button>
            </div>

            {/* Avatar – now inside the banner, centered horizontally, near the bottom */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-20">
              <div
                onClick={() => setCamModal(true)}
                className="relative w-46 h-46 sm:w-54 sm:h-54 md:w-62 md:h-62 rounded-lg border-4 border-white overflow-hidden bg-blue-100 cursor-pointer shadow-lg group"
              >
                <ImageWithAuth
                  customer={customerData}
                  className="w-full h-full object-cover"
                  fallbackIcon={() => (
                    <div className="w-full h-full bg-blue-200 flex items-center justify-center text-4xl font-bold text-blue-800">
                      {customerData.name?.[0]}
                    </div>
                  )}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <FaCamera size={28} className="text-white" />
                </div>
              </div>

              {/* Status dot */}
              {subStatus && (
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ background: subStatus.color }}
                />
              )}
            </div>
          </div>

          {/* Name and badges – extra top padding to account for avatar overlap */}
          <div className="pt-16 pb-5 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">
              {customerData.name}
            </h2>
            <DebtBadge customerID={customerID} size="lg" variant="tag" className="mb-2"/>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {subStatus && (
                <span
                  className="text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{ background: subStatus.bg, color: subStatus.color }}
                >
                  {subStatus.label}
                </span>
              )}
              <span
                className="text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{
                  background:
                    customerData.gender === "أنثى" ? "#fdf2f8" : "#eff6ff",
                  color: customerData.gender === "أنثى" ? "#9d174d" : "#1e40af",
                }}
              >
                {customerData.gender === "أنثى" ? (
                  <FaVenus size={10} />
                ) : (
                  <FaMars size={10} />
                )}
                {customerData.gender || "—"}
              </span>
            </div>
          </div>

          {/* Info grid – responsive: on mobile it wraps to 2 columns */}
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-gray-100 border-t border-b border-gray-100">
            {[
              {
                label: "رقم الهاتف",
                value: maskMobile(
                  customerData.mobile,
                  role,
                  customerData.gender,
                ),
                icon: <FaMobileScreenButton size={16} />,
              },
              {
                label: "العمر",
                value: maskAge(`${age} سنة`, role, customerData.gender),
                icon: <SlCalender size={15} />,
              },
              {
                label: "العنوان",
                value: maskAddress(
                  customerData.address,
                  role,
                  customerData.gender,
                ),
                icon: <FaLocationDot size={15} />,
              },
              {
                label: "الوزن",
                value: customerData.weight ? `${customerData.weight} كجم` : "—",
                icon: <FaWeightScale size={15} />,
              },
              {
                label: "الطول",
                value: customerData.tall ? `${customerData.tall} سم` : "—",
                icon: <TbRulerMeasure2 size={16} />,
              },
            ].map((item, idx) => (
              <div key={idx} className="py-3 px-2 text-center">
                <div className="text-[#1e3a8a] flex justify-center mb-1">
                  {item.icon}
                </div>
                <div className="text-[10px] text-gray-400 mb-1">
                  {item.label}
                </div>
                <div className="text-xs sm:text-sm font-bold text-gray-800 break-words">
                  {item.value || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[
              { key: "subs", label: "الاشتراكات" },
              { key: "attendance", label: "سجل الحضور" },
              { key: "debt", label: "المديونية" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 h-12 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "text-[#1e3a8a] border-b-2 border-[#1e3a8a]"
                    : "text-gray-400 border-b-2 border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "subs" && (
            <div className="p-5">
              {subscribeModal && selectedPackage && (
                <SubscribeModal
                  pkg={selectedPackage}
                  customerID={customerID}
                  onClose={() => {
                    setSubscribeModal(false);
                    setSelectedPackage(null);
                  }}
                  onSuccess={(data) => {
                    setSubscribeModal(false);
                    setSelectedPackage(null);
                    setToast(true);
                    setResponse(data);
                    setSubscriptionsRender((v) => !v);
                    setTimeout(() => setToast(false), 3000);
                  }}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <select
                  value={selectedPackage?.id || ""}
                  onChange={(e) => {
                    const pkg = packages.find(
                      (p) => String(p.id) === e.target.value,
                    );
                    setSelectedPackage(pkg || null);
                  }}
                  className="flex-1 h-11 px-4 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 outline-none"
                >
                  <option value="" disabled>
                    اختر باقة
                  </option>
                  {packages?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.type} ({p.count} حصة) — {p.price} جنيه
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedPackage) setSubscribeModal(true);
                  }}
                  disabled={!selectedPackage}
                  className="h-11 px-6 bg-[#1e3a8a] text-white rounded-xl text-sm font-semibold whitespace-nowrap hover:bg-[#1e40af] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  اشتراك
                </button>
              </div>

              {subscriptionsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                subscriptions.map((sub) => {
                  const matchedPkg = packages.find(
                    (pkg) => pkg.type === sub.packageName,
                  );
                  const price = matchedPkg?.price || 0;
                  return (
                    <SubscriptionCard
                      key={sub.id}
                      sub={sub}
                      price={price}
                      setResponse={setResponse}
                      setToast={setToast}
                      setSubscriptionsRender={setSubscriptionsRender}
                      subscriptionsRender={subscriptionsRender}
                      setSubId={setSubId}
                      setOpenModal={setOpenModal}
                    />
                  );
                })
              )}
            </div>
          )}

          {activeTab === "attendance" && (
            <CustomerAttendance
              apiUrl={apiUrl}
              customerID={customerID}
              subscriptions={subscriptions}
            />
          )}

          {activeTab === "debt" && (
            <CustomerDebtPanel customerID={customerID} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
