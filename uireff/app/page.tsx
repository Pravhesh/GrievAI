"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Shield, Zap, Users, Globe } from "lucide-react"
import Link from "next/link"
import Header from "@/components/Header"
import FeatureCard from "@/components/FeatureCard"
import TestimonialCard from "@/components/TestimonialCard"
import StatsSection from "@/components/StatsSection"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "AI-Powered Classification",
      description: "Complaints are automatically categorized using advanced language models for faster resolution.",
      color: "from-yellow-400 to-orange-500",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Blockchain Transparency",
      description: "Every action is recorded on Ethereum, ensuring immutable records and complete transparency.",
      color: "from-blue-400 to-purple-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Democratic Governance",
      description: "Community-driven voting system where stakeholders decide on complaint resolutions.",
      color: "from-green-400 to-cyan-500",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Accessibility",
      description: "Access from anywhere with just a browser and wallet. No installations required.",
      color: "from-purple-400 to-pink-500",
    },
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Community Leader",
      content: "GrievAI has transformed how our community handles complaints. The transparency is incredible.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Marcus Rodriguez",
      role: "City Official",
      content: "The AI classification saves us hours of manual work. Complaints are resolved 3x faster now.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Dr. Aisha Patel",
      role: "Governance Expert",
      content: "This is the future of democratic participation. Transparent, efficient, and truly decentralized.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Decentralized
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}
                Grievance{" "}
              </span>
              Resolution
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Voice your concerns, shape better communities. Powered by blockchain transparency and AI-driven
              classification for faster, fairer resolutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/app" className="btn-primary group">
                Launch Application
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="btn-secondary">Watch Demo</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Why Choose GrievAI?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of community governance with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, transparent, and effective grievance resolution in three steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Submit Complaint",
                description:
                  "Describe your issue in natural language. Our AI automatically categorizes it for proper routing.",
              },
              {
                step: "02",
                title: "Community Review",
                description:
                  "Officials and stakeholders review and vote on proposed resolutions using blockchain governance.",
              },
              {
                step: "03",
                title: "Transparent Resolution",
                description: "Track progress in real-time. All actions are permanently recorded on the blockchain.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Movement */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Join the Movement</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Be a part of the change in grievance management. Collaborate with innovators, propose new ideas, and help us build a better future.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/community" className="btn-primary group">
              Join the Community
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-violet-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Transform Your Community?</h2>
            <p className="text-xl text-violet-100 mb-12 leading-relaxed">
              Join thousands of communities already using GrievAI for transparent, efficient grievance resolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/app"
                className="bg-white text-violet-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started Now
              </Link>
              <button className="border-2 border-white text-white hover:bg-white hover:text-violet-600 font-semibold py-4 px-8 rounded-xl transition-all duration-200">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h3 className="text-2xl font-bold mb-4">GrievAI</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering communities with transparent, AI-driven grievance resolution on the blockchain.
              </p>
              <div className="flex space-x-4">{/* Social media icons would go here */}</div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} GrievAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
