import { useEffect, useRef } from "react";
import anime from "animejs";

export default function Spinner({ size = 48, color = "#7e22ce" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      anime({
        targets: ref.current,
        rotate: 360,
        easing: "linear",
        duration: 1000,
        loop: true,
      });
    }
  }, []);

  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-primary"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.25}
      />
    </svg>
  );
}
