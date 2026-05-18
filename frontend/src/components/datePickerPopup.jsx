import { useRef, useEffect } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function DatePickerPopup({
  open,
  onClose,
  selectedDate,
  onSelect,
  period,
  setPickerView,
  pickerView,
}) {
  const ref = useRef();

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!open) return null;

  // Generate days
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i);
  const years = Array.from({ length: 12 }, (_, i) => {
    return new Date().getFullYear() - 6 + i;
  });

  return (
    <div className="absolute top-16 right-0 z-50">
      <div
        ref={ref}
        className="bg-white rounded-2xl text-gray-600 shadow-xl border border-gray-100 p-4 w-72 animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setPickerView("year")}
            className="text-sm font-bold text-gray-700"
          >
            {format(selectedDate, "yyyy", { locale: ar })}
          </button>

          <button
            onClick={() => setPickerView("month")}
            className="text-sm text-gray-500"
          >
            {format(selectedDate, "MMMM", { locale: ar })}
          </button>
        </div>

        {/* DAY VIEW */}
        {pickerView === "day" && (
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const isActive = d === selectedDate.getDate();
              return (
                <button
                  key={d}
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(d);
                    onSelect(newDate);
                    onClose();
                  }}
                  className={`h-9 rounded-lg text-sm ${
                    isActive ? "bg-emerald-500 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        )}

        {/* MONTH VIEW */}
        {pickerView === "month" && (
          <div className="grid grid-cols-3 gap-2">
            {months.map((m) => {
              const isActive = m === selectedDate.getMonth();
              return (
                <button
                  key={m}
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(m);
                    onSelect(newDate);
                    setPickerView("day");
                  }}
                  className={`py-2 rounded-lg text-sm ${
                    isActive ? "bg-blue-500 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {format(new Date(2020, m, 1), "MMM", { locale: ar })}
                </button>
              );
            })}
          </div>
        )}

        {/* YEAR VIEW */}
        {pickerView === "year" && (
          <div className="grid grid-cols-3 gap-2">
            {years.map((y) => {
              const isActive = y === selectedDate.getFullYear();
              return (
                <button
                  key={y}
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(y);
                    onSelect(newDate);
                    setPickerView("month");
                  }}
                  className={`py-2 rounded-lg text-sm ${
                    isActive ? "bg-purple-500 text-white" : "hover:bg-gray-100"
                  }`}
                >
                  {y}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
