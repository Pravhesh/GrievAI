import { useEffect } from "react";
import anime from "animejs";

export default function ToastContainer({ toasts, removeToast }) {
  useEffect(() => {
    // animate new items
    if (toasts.length > 0) {
      anime({
        targets: ".toast-item",
        translateX: [100, 0],
        opacity: [0, 1],
        easing: "easeOutExpo",
        duration: 500,
        delay: anime.stagger(100),
      });
    }
  }, [toasts]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item max-w-sm p-4 rounded shadow-lg text-white flex justify-between items-center ${
            t.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-3 text-white focus:outline-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
