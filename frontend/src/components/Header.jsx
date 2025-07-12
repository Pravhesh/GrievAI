import anime from "animejs";
import { useEffect } from "react";

export default function Header({ account, connectWallet }) {
  useEffect(() => {
    anime({ targets: "header", translateY: [-20, 0], opacity: [0, 1], duration: 600, easing: "easeOutExpo" });
  }, []);

  return (
    <header className="bg-primary text-white px-6 py-4 shadow-lg flex justify-between items-center">
      <h1 className="text-2xl font-semibold tracking-wide">GrievAI</h1>
      {account ? (
        <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-mono">{account.slice(0, 6)}…{account.slice(-4)}</span>
      ) : (
        <button
          onClick={connectWallet}
          className="bg-white text-primary font-semibold px-4 py-2 rounded hover:bg-white/90 transition"
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
}
