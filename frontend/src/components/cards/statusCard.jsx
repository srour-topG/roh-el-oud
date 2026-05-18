import { Link } from "react-router-dom";
import { MdTrendingUp, MdTrendingDown, MdTrendingFlat } from "react-icons/md";

export function StatCard({
  label = "",
  value = "—",
  icon = null,
  iconBg = "#f3f4f6",
  iconColor = "#6b7280",
  accentColor = "#4f6ef7",
  badge = null,
  badgeColor = "#fee2e2",
  badgeTextColor = "#dc2626",
  link = null,
  linkLabel = "عرض القائمة كاملة",
  trend = null,
  trendValue = null,
  loading = false,
  className = "",
}) {
  const TrendIcon =
    trend === "up"
      ? MdTrendingUp
      : trend === "down"
        ? MdTrendingDown
        : MdTrendingFlat;

  const isUp = trend === "up";
  const isDown = trend === "down";

  const trendBgColor = isUp ? "#dcfce7" : isDown ? "#fee2e2" : "#f3f4f6";
  const trendTextColor = isUp ? "#166534" : isDown ? "#991b1b" : "#4b5563";

  return (
    <div
      dir="rtl"
      className={`relative  rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 border  border-r-4 group hover:shadow-lg ${className}`}
      style={{
        borderRightColor: accentColor,
        backgroundColor: "#ffffff",
        // Subtle background tint on hover matching the accent color (very low opacity)
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${accentColor}08`; // 08 is ~5% opacity
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#ffffff";
      }}
    >
      {/* Top Section: Badge (Left) & Icon (Right) */}
      <div className="flex items-start justify-between relative z-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>

        {badge && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm"
            style={{ background: badgeColor, color: badgeTextColor }}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Middle Section: Content */}
      <div className="mt-6 relative z-10">
        <p className="text-s font-semibold text-gray-400 uppercase tracking-wider mb-1">
          {label}
        </p>

        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="h-9 w-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-4 w-16 bg-gray-50 rounded animate-pulse" />
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold text-gray-800 tracking-tight">
                {typeof value === "number"
                  ? value.toLocaleString("ar-EG")
                  : value}
              </span>

              {trend && trendValue && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
                  style={{ background: trendBgColor, color: trendTextColor }}
                >
                  <TrendIcon size={12} />
                  {trendValue}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Link */}
      {link && !loading && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <Link
            to={link}
            className="inline-flex items-center text-xs font-bold hover:underline underline-offset-4 transition-colors"
            style={{ color: accentColor }}
          >
            {linkLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
