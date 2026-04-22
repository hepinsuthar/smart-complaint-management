import React from 'react';
import { Shield, Clock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-20 bg-linear-to-br from-[#151c28] to-[#0f1a2f] relative overflow-hidden">

      {/* <div className="absolute inset-0 bg-gradient-radial from-[#06B6D4]/10 via-transparent to-transparent opacity-50 pointer-events-none" /> */}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-[#1a2335]/80 backdrop-blur-lg rounded-3xl p-12 md:p-16 shadow-2xl shadow-[#06B6D4]/20 border border-[#06B6D4]/10 hover:shadow-3xl hover:shadow-[#06B6D4]/30 transition-all duration-500 mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-block px-6 py-3 rounded-full bg-linear-to-r from-[#1760D7]/20 to-[#06B6D4]/20 text-[#06B6D4] font-semibold text-sm border border-[#06B6D4]/30 shadow-lg shadow-[#06B6D4]/10">
              Ready to Transform Your Institution?
            </span>

            <h2 className="mt-8 text-3xl md:text-6xl font-bold text-white leading-tight">
              Start Managing Complaints  {' '}
              <span className="bg-linear-to-r from-[#06B6D4] via-[#00ffea] to-[#06B6D4] text-transparent bg-clip-text animate-rgb-shift">
                Smarter Today
              </span> {' '}
            </h2>

            <p className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto">
              Replace manual complaint handling with a simple, efficient digital system.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#06B6D4]" />
                <span>Secure & Private</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#06B6D4]" />
                <span>24/7 Support</span>
              </div> */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#06B6D4]" />
                <span>Easy to Use</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-6">
              <Link to="/signup">
                <button className="px-7 py-4 rounded-2xl bg-linear-to-r from-[#1760D7] to-[#06B6D4] text-white font-semibold text-lg shadow-2xl shadow-[#06B6D4]/30 hover:shadow-[#06B6D4]/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                  Get Started Free →
                </button>
              </Link>

              <Link to="/login">
                <button className="px-7 py-4 rounded-2xl border-2 border-[#06B6D4] text-[#06B6D4] font-semibold text-lg hover:bg-[#06B6D4]/10 transition-all duration-300 w-full sm:w-auto">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}