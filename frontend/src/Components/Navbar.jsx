import React, { useState, useEffect } from 'react';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        scrolled
          ? 'bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 border-b border-cyan-500/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group max-sm:gap-2 max-sm:scale-90">
          <div
            className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#1760D7] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300 max-sm:w-9 max-sm:h-9"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 max-sm:w-4 max-sm:h-4"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-white leading-none max-sm:text-sm">
              Smart Complaint
            </span>
            <span className="text-xs font-semibold text-slate-300 max-sm:text-[10px]">
              Management System
            </span>
          </div>
        </a>

        {/* Right Buttons */}
        <div className="flex items-center gap-3 max-sm:gap-2">
          {/* Login Button */}
          <a href="/login">
            <button
              className={`px-5 py-2 h-10 rounded-lg border ${
                scrolled
                  ? 'border-cyan-400/40 bg-gray-800/50 text-cyan-300 hover:bg-cyan-900/40'
                  : 'border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800/60'
              } hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer max-sm:px-3 max-sm:py-1 max-sm:h-9 max-sm:text-sm backdrop-blur-sm`}
            >
              Login
            </button>
          </a>

          {/* Signup Button */}
          <a href="/signup">
            <button
              className="px-5 py-2 h-10 rounded-lg bg-linear-to-tr from-[#3B82F6] to-[#06B6D4] text-white shadow-lg shadow-cyan-500/30 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer max-sm:px-3 max-sm:py-1 max-sm:h-9 max-sm:text-sm"
            >
              Sign Up
            </button>
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;