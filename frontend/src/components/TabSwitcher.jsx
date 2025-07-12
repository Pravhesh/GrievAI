import { useEffect, useRef } from "react";
import anime from "animejs";

export default function TabSwitcher({ active, onChange }) {
  const indicatorRef = useRef(null);

  useEffect(() => {
    if (indicatorRef.current) {
      anime({
        targets: indicatorRef.current,
        left: active === 'submit' ? '0%' : '50%',
        duration: 400,
        easing: 'easeOutExpo'
      });
    }
  }, [active]);

  return (
    <div className="relative w-full max-w-xs mx-auto my-4" role="tablist">
      {[
        { key: "submit", label: "Submit" },
        { key: "complaints", label: "Complaints" },
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            active === tab.key
              ? "bg-primary text-white shadow"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          role="tab"
          aria-selected={active === tab.key}
        >
          {tab.label}
        </button>
      ))}
          <span
        ref={indicatorRef}
        className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-primary transition-all"
      ></span>
    </div>
  );
}
