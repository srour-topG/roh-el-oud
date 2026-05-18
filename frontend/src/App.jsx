import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AttendanceProvider, useAttendance } from "./context/AttendanceContext";
import { useCallback, useState } from "react";
import Landing from "./views/landing.jsx";
import Dashboard from "./views/dashboard.jsx";
import Register from "./views/register.jsx";
import Users from "./views/users.jsx";
import Profile from "./views/customerProfile.jsx";
import AddCustomer from "./views/addCustomer.jsx";
import Customers from "./views/customers.jsx";
import Packages from "./views/packages.jsx";
import Attendance from "./views/attendacnce.jsx";
import Finance from "./views/finance.jsx";
import Expenses from "./views/expenses.jsx";
import Subscriptions from "./views/subscriptions.jsx";
import NotFound from "./views/notFound.jsx";
import ProtectedRoute from "./context/routeProtection.jsx";
import { NavbarComponnt } from "./components/navbar.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import CheckInModal from "./components/modals/checkin";
import { PrecheckModal } from "./components/modals/precheck";
import SuccessToast from "./components/toasts/successToast";
import Products from "./views/products.jsx";
import StockMovement from "./views/stockMovement.jsx";
import ProductAnalytics from "./views/productAnalytics.jsx";
import Cashier from "./views/cashier.jsx";
import CashierDailyIncome from "./views/CashierDailyIncome.jsx";
import FinanceDashboard from "./views/FinanceDashboard.jsx";
import useBarcodeScanner from "./hooks/useBarcodeScanner.js";
import axios from "axios";
import Debt from "./views/debt.jsx";
import SalesPage from "./views/SalesPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AttendanceProvider>
        <MainLayout />
      </AttendanceProvider>
    </BrowserRouter>
  );
}

function MainLayout() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const showNavbar = location.pathname !== "/";

  const {
    openModal,
    setOpenModal,
    preCheckOpenModal,
    setPreCheckOpenModal,
    personalData,
    setPersonalData,
    subData,
    setSubData,
    triggerRefresh,
  } = useAttendance();

  const [toast, setToast] = useState(false);
  const [response, setResponse] = useState(null);
  const [reRender, setRerender] = useState(false);

  const handleScan = useCallback(
    async (code) => {
      try {
        const res = await axios.get(`${apiUrl}/checkIn/${code}`);
        new Audio("/success.mp3")?.play()?.catch(() => {});
        setResponse({
          statusCode: "200",
          message: res.data.Message || "Checked in successfully",
        });
        setToast(true);
        triggerRefresh();
      } catch (err) {
        new Audio("/fail.mp3")?.play()?.catch(() => {});
        const message =
          err.response?.data?.Message || err.message || "Error occurred";
        setResponse({
          statusCode: err.response?.status?.toString() || "500",
          Message: message,
        });
        setToast(true);
      }
    },
    [apiUrl, triggerRefresh],
  );

  useBarcodeScanner(handleScan, { minLength: 1, timeout: 100, cooldown: 1500 });

  return (
    <div style={{ minHeight: "100vh" }} className="bg-gray-50">
      {/* Top Navbar */}
      {showNavbar && <NavbarComponnt />}

      {/* Body: Sidebar + Content */}
      <div style={{ display: "flex", flexDirection: "row-reverse" }}>
        {showNavbar && <Sidebar />}

        <main style={{ flex: 1, minWidth: 0, padding: 0 }}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Subscriptions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/packages"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <Packages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <SalesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <FinanceDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription/finance"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <Finance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-customer"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <AddCustomer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/:id"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <StockMovement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cashier"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Cashier />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/cashier"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <CashierDailyIncome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  {" "}
                  <ProductAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/debt"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager", "cashier"]}>
                  <Debt />
                </ProtectedRoute>
              }
            />
            <Route path="/not-found" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals for Attendance */}
      <CheckInModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        PreCheckOpenModal={preCheckOpenModal}
        setPreCheckOpenModal={setPreCheckOpenModal}
        subData={subData}
        setSubData={setSubData}
        setPersonalData={setPersonalData}
        triggerRefresh={triggerRefresh}
      />
      <PrecheckModal
        setRerender={setRerender}
        reRender={reRender}
        setToast={setToast}
        setOpenModal={setOpenModal}
        setResponse={setResponse}
        toast={toast}
        subData={subData}
        setSubData={setSubData}
        PreCheckOpenModal={preCheckOpenModal}
        personalData={personalData}
        setPersonalData={setPersonalData}
        setPreCheckOpenModal={setPreCheckOpenModal}
        triggerRefresh={triggerRefresh}
      />
      {toast && <SuccessToast response={response} />}
    </div>
  );
}
