import { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import logo from "../assets/roh.jpeg";
import { IoClose, IoChevronForward } from "react-icons/io5";
import { RiLogoutBoxLine } from "react-icons/ri";
import { FaUserCheck, FaBoxOpen } from "react-icons/fa";
import { MdAnalytics, MdPointOfSale } from "react-icons/md";
import { useAuth } from "../context/authContext";
import { useAttendance } from "../context/AttendanceContext";

export function NavbarComponnt() {
  const username = localStorage.getItem("username");
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { logout: clearAuthUser } = useAuth();
  const location = useLocation();
  const { openQuickCheckIn } = useAttendance();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const userMenuRef = useRef(null);

  // Close drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(`${apiUrl}/auth/logout`, {}, { withCredentials: true });
      clearAuthUser();
      localStorage.removeItem("username");
      navigate("/");
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <nav
        className="bg-white border-b border-gray-100 sticky top-0 z-40 w-full"
        dir="rtl"
      >
        <div className="max-w-full px-4 md:px-6 flex items-center h-[62px] gap-2 md:gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#e1e4ef] flex items-center justify-center overflow-hidden shadow-sm">
              <img
                src={logo}
                alt="روح العود"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-[15px] text-gray-800">
                روح العود
              </span>
              <p className="text-[11px] text-gray-400 m-0">
                نظام البيع والمخزون
              </p>
            </div>
          </Link>

          {/* Desktop Actions - now only the Cashier button */}
          <div className="hidden md:flex items-center gap-2 flex-1">
            <div className="w-px h-6 bg-gray-300 shrink-0" />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 shrink-0 mr-auto">
            {/* Cashier Button (replaces search) */}
            <button
              onClick={() => navigate("/cashier")}
              className="flex items-center gap-2 h-9 px-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-lg text-[16px] font-medium shadow-md transition-all"
            >
              <MdPointOfSale className="w-4 h-4" />
              الكاشير
            </button>

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 py-1.5 pr-2 pl-3 border border-gray-200 rounded-lg bg-transparent hover:bg-gray-50 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-[#344685] flex items-center justify-center text-xs font-bold text-white">
                  {username ? username[0].toUpperCase() : "U"}
                </div>
                <span className="text-[13px] font-medium text-gray-800 max-w-[90px] truncate hidden sm:inline-block">
                  {username}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="opacity-40"
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="#1a1f36"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute top-full mt-2 left-0 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-[11px] text-gray-400 m-0">
                      تسجيل الدخول بـ
                    </p>
                    <p className="text-[13px] font-semibold text-gray-800 mt-0.5">
                      {username}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-right text-[13px] text-red-500 flex items-center gap-2 hover:bg-red-50 transition-colors"
                  >
                    <RiLogoutBoxLine size={15} />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex flex-col gap-1 p-2 border border-gray-200 rounded-lg bg-transparent md:hidden"
            >
              <span className="block w-4.5 h-px bg-gray-600 rounded" />
              <span className="block w-4.5 h-px bg-gray-600 rounded" />
              <span className="block w-4.5 h-px bg-gray-600 rounded" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer - search removed, Cashier button added */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          mobileDrawerOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            mobileDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileDrawerOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-[280px] bg-white shadow-xl transform transition-transform duration-300 ${
            mobileDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          dir="rtl"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">القائمة</h3>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Cashier Button (replaces search in mobile) */}
              <button
                onClick={() => {
                  navigate("/cashier");
                  setMobileDrawerOpen(false);
                }}
                className="w-full flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-3 rounded-xl shadow-md"
              >
                <span className="font-medium">الكاشير</span>
                <MdPointOfSale className="w-5 h-5" />
              </button>

              {/* Navigation links */}
              {/* <div className="pt-2 space-y-1">
                <Link
                  to="/products"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">المنتجات</span>
                  <FaBoxOpen className="text-gray-500" size={18} />
                </Link>
                <Link
                  to="/products/analytics"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">التحليلات</span>
                  <MdAnalytics className="text-gray-500" size={18} />
                </Link>
                <Link
                  to="/attendance"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">سجل الحضور</span>
                  <IoChevronForward className="text-gray-400" />
                </Link>
                <Link
                  to="/customers"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-700">العملاء</span>
                  <IoChevronForward className="text-gray-400" />
                </Link>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
