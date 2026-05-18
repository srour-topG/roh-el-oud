export function LoadingSpinner({ size = "md", fullPage = false }) {
  const dim = size === "xl" ? 48 : size === "lg" ? 36 : size === "sm" ? 20 : 28;
  const stroke = size === "xl" ? 4 : size === "sm" ? 2.5 : 3;

  const spinner = (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 48 48"
      fill="none"
      style={{ animation: "spin 0.85s linear infinite" }}
    >
      <circle cx="24" cy="24" r="20" stroke="#e5e7eb" strokeWidth={stroke} />
      <path
        d="M44 24a20 20 0 0 0-20-20"
        stroke="#1e3a8a"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}