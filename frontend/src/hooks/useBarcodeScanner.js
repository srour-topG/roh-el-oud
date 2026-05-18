import { useEffect, useRef, useCallback } from "react";

export default function useBarcodeScanner(onScan, options = {}) {
  const { minLength = 1, timeout = 100, cooldown = 1000 } = options;

  const buffer = useRef("");
  const lastTime = useRef(0);
  const lastScanTime = useRef(0);

  const stableOnScan = useCallback(onScan, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
      ) {
        return;
      }

      const now = Date.now();

      if (now - lastTime.current > timeout) {
        buffer.current = "";
      }
      lastTime.current = now;

      if (e.key === "Enter") {
        const code = buffer.current;
        if (code.length >= minLength) {
          if (now - lastScanTime.current < cooldown) {
            buffer.current = "";
            return;
          }
          lastScanTime.current = now;
          stableOnScan(code);
        }
        buffer.current = "";
      } else if (e.key.length === 1) {
        buffer.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stableOnScan, minLength, timeout, cooldown]);
}
