import React from 'react';
import { Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f172a] text-slate-300 py-12 border-t border-[#06B6D4]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#1760D7] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-cyan-500/30 max-sm:w-9 max-sm:h-9"
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
              <div>
                <h3 className="text-xl font-bold text-white">Smart Complaint</h3>
                <p className="text-sm text-slate-400">Management System</p>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Replace manual complaint handling with a simple, efficient digital system.
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3 text-slate-400">
              <li><a href="/" className="hover:text-[#06B6D4] transition-colors">Home</a></li>
              <li><a href="/login" className="hover:text-[#06B6D4] transition-colors">Login</a></li>
              <li><a href="/signup" className="hover:text-[#06B6D4] transition-colors">Sign Up</a></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-white">Contact Us</h4>
            <ul className="space-y-4 text-slate-400">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#06B6D4] mt-1 shrink-0" />
                <span>smartcomplain@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#06B6D4] mt-1 shrink-0" />
                <span>+91 123 456 7890</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700/50 text-center text-sm">
          <p className="text-slate-400">
            © {currentYear} Smart Complaint Management System.
          </p>
          <p className="mt-2 text-slate-500 flex items-center justify-center gap-2">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for College Project
          </p>
        </div>
      </div>
    </footer>
  );
}