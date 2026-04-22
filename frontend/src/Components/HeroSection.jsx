import { motion } from "framer-motion";
import React from 'react';

export default function HeroSection() {
  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#0f172a] via-[#1e293b] to-[black] text-white overflow-hidden">

      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-24 lg:pt-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          <div className="space-y-8 mx-4 sm:mx-8 lg:mx-0">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-8xl font-bold leading-none text-center lg:text-left">
              Smart Complaint<br />
              <span className="text-blue-400">Management </span>System
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-300 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              A modern platform that helps students submit complaints and track resolutions efficiently, improving transparency between students and administrators.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <a href="/signup">
                <button className="bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 px-8 py-4 rounded-full text-lg font-medium shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50 w-full sm:w-auto">
                  Get Started Now →
                </button>
              </a>
            </div>

            <div className="text-sm text-gray-400 flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start mb-8 gap-3 sm:gap-6">
              <span>🔒 Secure & Private</span>
              {/* <span>🛠 24/7 Support</span> */}
              <span>👍 Easy to Use</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="flex justify-center items-center h-full">
              <motion.img
                src="../../src/assets/images/hero.png"
                alt="Smart Complaint Management Illustration"
                className="w-full max-w-xl h-auto object-contain drop-shadow-2xl"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
