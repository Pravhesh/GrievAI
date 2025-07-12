import { useEffect } from "react";
import anime from "animejs";
import { Link } from "react-router-dom";

export default function AppRedesign() {
  useEffect(() => {
    anime({
      targets: ".fade-in",
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(80),
      duration: 600,
      easing: "easeOutQuad",
    });
  }, []);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-600 via-purple-600 to-emerald-500 text-gray-800 font-sans">
      {/* Tailwind test banner */}
      <div className="bg-amber-300 text-center text-sm font-medium py-1">Tailwind CSS Loaded ✔️</div>

      {/* NAVBAR */}
      <header className="w-full px-6 sm:px-10 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-primary">GrievAI</h1>
        <nav className="space-x-6 hidden sm:block">
          <a href="#why" className="hover:text-primary transition">Why</a>
          <a href="#how" className="hover:text-primary transition">How</a>
          <a href="#features" className="hover:text-primary transition">Features</a>
        </nav>
        <Link
          to="/app"
          className="bg-primary text-white rounded-full px-5 py-2 shadow hover:bg-primary/90 transition"
        >
          Launch App
        </Link>
      </header>

      {/* HERO */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 fade-in">
        <h2 className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight">
          Decentralised grievance <span className="text-primary">resolution</span>
        </h2>
        <p className="max-w-2xl text-lg sm:text-2xl mb-8">
          Empowering communities to raise, classify and resolve issues transparently on-chain, fuelled by AI insight.
        </p>
        <Link
          to="/app"
          className="bg-primary text-white rounded-full px-10 py-4 text-lg shadow-lg hover:bg-primary/90 transition"
        >
          Try the Beta ↗
        </Link>
      </section>

      {/* WHY */}
      <section id="why" className="py-24 px-6 fade-in">
        <h3 className="text-3xl sm:text-4xl font-bold text-center mb-12">Why GrievAI?</h3>
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            {
              title: "Transparency",
              desc: "Every complaint, vote and action is permanently recorded on Ethereum.",
              icon: "🔍",
            },
            {
              title: "Speed",
              desc: "AI triages complaints instantly – no long queues or lost paperwork.",
              icon: "⚡",
            },
            {
              title: "Democracy",
              desc: "Stakeholders vote on proposals, ensuring fair and inclusive decisions.",
              icon: "🗳️",
            },
          ].map((f, i) => (
            <div key={i} className="bg-white/70 backdrop-blur rounded-xl p-8 shadow-md">
              <span className="text-4xl">{f.icon}</span>
              <h4 className="text-xl font-semibold mt-4 mb-2">{f.title}</h4>
              <p className="text-gray-700 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-10 text-sm text-gray-600 fade-in">
        © {new Date().getFullYear()} GrievAI. Crafted with ❤️ & blockchain.
      </footer>
    </main>
  );
}
