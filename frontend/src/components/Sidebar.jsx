import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdOutlinePointOfSale,
  MdOutlineViewList,
  MdReceipt,
} from "react-icons/md";
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineBanknotes,
} from "react-icons/hi2";
import { IoCashOutline } from "react-icons/io5";
import { IoMdClipboard } from "react-icons/io";
import { RiUser2Line, RiUserAddLine } from "react-icons/ri";
import { useAuth } from "../context/authContext";

const NAV_ITEMS = [
  // {
  //   label: "الرئيسية",
  //   href: "/dashboard",
  //   icon: <HiOutlineHome size={20} />,
  //   roles: ["admin", "manager", "cashier"],
  // },
  {
    label: "الكاشير",
    href: "/cashier",
    icon: <MdOutlinePointOfSale size={20} />,
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "الإيصالات",
    href: "/sales",
    icon: <MdReceipt size={20} />,
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "المنتجات",
    href: "/products",
    icon: <HiOutlineCube size={22} />,
    roles: ["admin", "manager", "cashier"],
  },
  // {
  //   label: "المخزون",
  //   href: "/stock",
  //   icon: <IoMdClipboard size={20} />,
  //   roles: ["admin", "manager", "cashier"],
  // },
  {
    label: "المديونيات",
    href: "/debt",
    icon: <MdOutlineViewList size={20} />,
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "المصروفات",
    icon: <HiOutlineBanknotes size={22} />,
    href: "/expenses",
    roles: ["admin", "manager", "cashier"],
  },
  {
    label: "المبيعات",
    href: "/finance",
    icon: <IoCashOutline size={22} />,
    roles: ["admin", "manager"],
  },
  {
    label: "المستخدمين",
    href: "/users",
    icon: <RiUser2Line size={20} />,
    roles: ["admin", "manager"],
  },
];

export function Sidebar() {
  const { role } = useAuth();

  return (
    <aside
      dir="rtl"
      className="hidden md:flex flex-col w-[220px] min-h-screen bg-white border-l border-gray-100 sticky top-0 p-6 pr-4 shrink-0 justify-between"
    >
      <div>
        <nav className="flex-1 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`h-5 w-5 shrink-0 transition-all ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-blue-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="mr-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="bg-[#344685] rounded-2xl p-5 text-white text-right">
        <p className="text-xs opacity-80 mb-1">تحتاج للمساعدة؟</p>
        <p className="text-sm font-semibold mb-3">تواصل مع الدعم الفني</p>
        <a
          href="https://wa.me/201033438365"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2 bg-white text-[#344685] rounded-lg font-semibold text-sm text-center hover:bg-gray-50 transition"
        >
          اتصل بنا
        </a>
      </div>
    </aside>
  );
}
