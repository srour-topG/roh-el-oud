import { IoFemale, IoMale, IoPersonCircleOutline } from "react-icons/io5";
import { maskMobile } from "../utils/maskFemale";
import DebtBadge, { useCustomerDebt } from "./debtBadge";
import ImageWithAuth from "./ImageWithAuth";

export default function CustomerRow({
  row,
  getCustomerStatus,
  navigate,
  role,
}) {
  const status = getCustomerStatus(row);
  const { hasDebt } = useCustomerDebt(row.id);

  return (
    <tr
      className={` bg-white hover:bg-gray-50 transition cursor-pointer`}
      onClick={() => navigate(`/customer/${row.id}`)}
    >
      {/* Table cells – same as your previous row content */}
      <td className="px-6 py-4 font-medium text-center text-gray-900">
        #{row.id}
      </td>
      <td className="px-6 py-4 text-right text-gray-800 font-bold">
        <div className="flex items-center justify-start gap-2">
          <ImageWithAuth
            customer={row}
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            fallbackIcon={IoPersonCircleOutline}
          />
          {row.name}
          <DebtBadge customerID={row.id} size="md" variant="icon-only" />
        </div>
      </td>
      <td className="px-6 py-4 text-center text-gray-600">
        {maskMobile(row.mobile, role, row.gender)}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {row.gender === "ذكر" ? (
            <>
              <IoMale color="#3b82f6" />
              <span className="text-xs text-gray-600">ذكر</span>
            </>
          ) : (
            <>
              <IoFemale color="#ec4899" />
              <span className="text-xs text-gray-600">أنثى</span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border"
          style={{
            background: status.bg,
            color: status.color,
            borderColor: status.color + "40",
          }}
        >
          <span
            className="w-2 h-2 me-1 rounded-full"
            style={{ background: status.color }}
          />
          {status.label}
        </span>
      </td>
      <td className="px-6 py-4 text-center text-gray-500 text-sm">
        {new Date(row.createdAt).toLocaleDateString("ar-EG")}
      </td>
    </tr>
  );
}
