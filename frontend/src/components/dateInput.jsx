import { useState, useRef, useEffect } from "react";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";

const DateInput = ({ value, onChange, error, touched }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear() - 100,
  );
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [view, setView] = useState("year");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split("-").map(Number);
      if (year) setSelectedYear(year);
      if (month) setSelectedMonth(month - 1);
    }
  }, [value]);

  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - 100 + i,
  );
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "إبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const days = Array.from(
    { length: getDaysInMonth(selectedYear, selectedMonth) },
    (_, i) => i + 1,
  );

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setView("month");
  };

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(monthIndex);
    setView("day");
  };

  const handleDaySelect = (day) => {
    const formattedMonth = String(selectedMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateString = `${selectedYear}-${formattedMonth}-${formattedDay}`;
    onChange(dateString);
    setIsOpen(false);
    setView("year");
  };

  const formatDisplay = (dateString) => {
    if (!dateString) return "اختر التاريخ";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 border rounded-xl transition-all hover:bg-gray-100 ${error && touched ? "border-red-400" : "border-gray-200"} ${isOpen ? "ring-2 ring-blue-100 border-blue-500" : ""}`}
      >
        <div className="flex items-center gap-3">
          <FaCalendarAlt className="text-gray-400" />
          <span
            className={`text-sm ${value ? "text-gray-900" : "text-gray-400"}`}
          >
            {formatDisplay(value)}
          </span>
        </div>
        <FaChevronDown
          className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {view === "year" && "اختر السنة"}
              {view === "month" && `اختر الشهر - ${selectedYear}`}
              {view === "day" && `${months[selectedMonth]} ${selectedYear}`}
            </span>
            {view !== "year" && (
              <button
                type="button"
                onClick={() => setView(view === "day" ? "month" : "year")}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                رجوع
              </button>
            )}
          </div>

          {view === "year" && (
            <div className="p-3 grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => handleYearSelect(year)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition ${selectedYear === year ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {view === "month" && (
            <div className="p-3 grid grid-cols-3 gap-2">
              {months.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition ${selectedMonth === index ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {month}
                </button>
              ))}
            </div>
          )}

          {view === "day" && (
            <div className="p-3 grid grid-cols-7 gap-1">
              {["أح", "إث", "ثل", "أر", "خم", "جم", "سب"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs text-gray-400 py-1"
                >
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const dayOfWeek = new Date(
                  selectedYear,
                  selectedMonth,
                  day,
                ).getDay();
                const offset = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDaySelect(day)}
                    className={`py-2 rounded-lg text-sm font-medium transition ${value && value === `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                    style={day === 1 ? { gridColumnStart: offset + 1 } : {}}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-xs mt-1 text-right">{error}</div>
      )}
    </div>
  );
};

export default DateInput;
