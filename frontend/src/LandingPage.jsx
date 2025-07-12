import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import anime from "animejs";

export default function LandingPage() {
  const heroRef = useRef(null);
  const featuresRef = useRef([]);

  useEffect(() => {
    if (heroRef.current) {
      anime({
        targets: heroRef.current.querySelectorAll("h1 span"),
        translateY: [40, 0],
        opacity: [0, 1],
        delay: anime.stagger(70),
        easing: "easeOutExpo",
        duration: 800,
      });
    }
    // reveal features on scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          anime({
            targets: entry.target,
            translateY: [20, 0],
            opacity: [0, 1],
            easing: "easeOutExpo",
            duration: 600,
          });
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    featuresRef.current.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-300 via-teal-200 to-sky-300 text-gray-800 font-sans">
      {/* Hero */}
      <section ref={heroRef} className="max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6">
          {"Griev".split("").map((ch, i) => (
            <span key={i} className="inline-block">{ch}</span>
          ))}
          <span className="text-primary">AI</span>
        </h1>
        <p className="text-xl sm:text-2xl mb-10 max-w-2xl mx-auto">
          Voice your concerns, shape better communities. Powered by blockchain &amp; AI-driven justice.
        </p>
        <Link
          to="/app"
          className="inline-block bg-primary text-white px-8 py-3 rounded-full shadow-lg hover:bg-primary/90 transition"
        >
          Launch App
        </Link>
      </section>

      {/* Wave divider */}
      <svg viewBox="0 0 1440 100" className="w-full" preserveAspectRatio="none">
        <path fill="#ffffff" d="M0,32L48,42.7C96,53,192,75,288,74.7C384,75,480,53,576,64C672,75,768,117,864,138.7C960,160,1056,160,1152,154.7C1248,149,1344,139,1392,133.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
      </svg>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-2 gap-12">
        {[
          {
            title: "AI Classification",
            desc: "Complaints are automatically categorized with state-of-the-art language models for faster triage.",
            icon: "🤖",
          },
          {
            title: "Transparent Governance",
            desc: "Every action is recorded on Ethereum, ensuring immutable records and community-driven resolutions.",
            icon: "🔗",
          },
          {
            title: "Democratic Voting",
            desc: "Officials and stakeholders vote on proposals with real-time on-chain tallies and instant results.",
            icon: "🗳️",
          },
          {
            title: "Global Accessibility",
            desc: "All you need is a browser and wallet. No installs, no borders, just justice.",
            icon: "🌍",
          },
        ].map((f, idx) => (
          <div
            key={idx}
            ref={(el) => (featuresRef.current[idx] = el)}
            className="bg-white rounded-xl shadow-md p-6 flex items-start space-x-4 opacity-0 translate-y-5"
          >
            <span className="text-3xl">{f.icon}</span>
            <div>
              <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Call to action */}
      <section className="text-center py-20 bg-transparent">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Join the governance revolution</h2>
        <p className="mb-8 max-w-xl mx-auto text-gray-600">
          Whether you’re a citizen, official, or developer, GrievAI offers the tools to resolve issues transparently and efficiently.
        </p>
        <Link
          to="/app"
          className="inline-block bg-primary text-white px-10 py-3 rounded-full shadow-lg hover:bg-primary/90 transition"
        >
          Start Now
        </Link>
      </section>

      <footer className="text-center py-8 text-sm text-gray-700 bg-transparent">
        © {new Date().getFullYear()} GrievAI. All rights reserved.
      </footer>
    </div>
  );
}
