import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  IoSearch,
  IoPersonCircleOutline,
  IoFilterOutline,
  IoChevronDown,
  IoAdd,
} from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdModeEdit, MdBlock, MdCheckCircle } from "react-icons/md";
import { toast } from "sonner";
import DeleteConfirmationModal from "../components/modals/deleteConfirmModal";
import UserEditModal from "../components/modals/UserEditModal";
import RegisterModal from "../components/modals/RegisterModal";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = useMemo(() => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 p-4 border-t border-gray-100">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <FaChevronRight size={12} />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition"
      >
        <FaChevronLeft size={12} />
      </button>
    </div>
  );
};

function Users() {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState("suspend");
  const [reRender, setRerender] = useState(false);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/users`);
        setUsers(res.data.users);
        setFilteredUsers(res.data.users);
      } catch (e) {
        console.error(e);
        toast.error("فشل تحميل المستخدمين");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [apiUrl, reRender]);

  // Client-side filtering
  useEffect(() => {
    let filtered = [...users];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.username?.toLowerCase().includes(term),
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, roleFilter, users]);

  // Pagination
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const hasActiveFilters = searchTerm !== "" || roleFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
  };

  // Suspend / Activate
  const handleStatusToggle = (user) => {
    setSelectedUser(user);
    setActionType(user.status === "active" ? "suspend" : "activate");
    setConfirmModalOpen(true);
  };

  const confirmStatusToggle = async () => {
    if (!selectedUser) return;
    try {
      const res = await axios.delete(`${apiUrl}/auth/userSupend`, {
        data: { userID: selectedUser.id },
      });
      toast.success(
        res.data?.Message ||
          `تم ${actionType === "suspend" ? "إيقاف" : "تفعيل"} المستخدم بنجاح`,
      );
      setRerender((prev) => !prev);
    } catch (error) {
      toast.error(error.response?.data?.Message || "حدث خطأ");
    } finally {
      setConfirmModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const roleLabels = {
    admin: "مدير النظام",
    manager: "مدير",
    cashier: "كاشير",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <DeleteConfirmationModal
        execFunc={confirmStatusToggle}
        openModal={confirmModalOpen}
        setOpenModal={setConfirmModalOpen}
        title={
          actionType === "suspend" ? "إيقاف المستخدم" : "إعادة تفعيل المستخدم"
        }
        message={
          actionType === "suspend"
            ? "هل أنت متأكد من إيقاف هذا المستخدم؟"
            : "هل أنت متأكد من إعادة تفعيل هذا المستخدم؟"
        }
      />

      <UserEditModal
        openModal={editModalOpen}
        setOpenModal={setEditModalOpen}
        userData={selectedUser}
        setToast={() => {}} // no longer needed, but keep for compatibility; we'll ignore
        setResponse={() => {}}
        onSuccess={() => setRerender((prev) => !prev)}
      />

      <RegisterModal
        openModal={openRegisterModal}
        setOpenModal={setOpenRegisterModal}
        onSuccess={() => {
          setRerender((prev) => !prev);
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">الموظفين</h1>
            <p className="text-gray-500 text-lg mt-1">
              إدارة حسابات فريق العمل
            </p>
          </div>
          <button
            onClick={() => setOpenRegisterModal(true)}
            className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 shadow-md"
          >
            <IoAdd size={20} />
            إضافة موظف
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-100">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <IoSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full p-2.5 pr-10 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-full focus:ring-blue-500 focus:border-blue-500"
              placeholder="بحث بالاسم أو اسم المستخدم..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-40">
              <select
                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pl-8"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">كل الأدوار</option>
                <option value="manager">مدير</option>
                <option value="cashier">كاشير</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-500">
                <IoChevronDown size={14} />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-base font-medium px-2"
              >
                <IoFilterOutline />
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 text-lg">
                <tr>
                  <th className="px-6 py-4 font-semibold text-center">
                    الموظف
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    اسم المستخدم
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">الدور</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    الموبايل
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    الراتب
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    تاريخ التوظيف
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    الحالة
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      جاري التحميل...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-12 text-gray-500">
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition text-base">
                      <td className="px-6 py-4 text-right font-medium text-gray-800">
                        <div className="flex items-center justify-start gap-2">
                          <IoPersonCircleOutline className="w-8 h-8 text-gray-400" />
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {user.phone || "—"}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {user.salary} ج.م
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 text-sm">
                        {user.hiringDate?.split("T")[0] || "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {user.status === "active" ? (
                          <span className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                            <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            <span className="w-2 h-2 me-1 bg-red-500 rounded-full"></span>
                            موقوف
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="تعديل"
                          >
                            <MdModeEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user)}
                            className={`p-2 rounded-lg transition ${
                              user.status === "active"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={user.status === "active" ? "إيقاف" : "تفعيل"}
                          >
                            {user.status === "active" ? (
                              <MdBlock size={18} />
                            ) : (
                              <MdCheckCircle size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}

export default Users;
