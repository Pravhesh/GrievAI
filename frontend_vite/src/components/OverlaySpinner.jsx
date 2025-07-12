import Spinner from "./Spinner";

export default function OverlaySpinner({ show }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50">
      <Spinner size={64} color="#4f46e5" />
    </div>
  );
}
