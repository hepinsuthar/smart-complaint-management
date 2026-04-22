import React from 'react';
import { 
  UserPlus, 
  FilePenLine, 
  BellRing, 
  CheckCircle2 
} from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: UserPlus,
      title: "Create an Account",
      desc: "Sign up with your email and basic information to get started with our secure platform."
    },
    {
      icon: FilePenLine,
      title: "Submit Your Complaint",
      desc: "Fill out our intuitive complaint form with relevant details, attachments, and category selection."
    },
    {
      icon: BellRing,
      title: "Track Progress",
      desc: "Monitor real-time updates as administrators work on your case with detailed status tracking."
    },
    {
      icon: CheckCircle2,
      title: "Resolution Complete",
      desc: "Receive notifications when your complaint is resolved and provide feedback on the solution."
    }
  ];

  return (
    <section className="py-20 bg-[#151c28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full bg-linear-to-r from-[#1760D7]/20 to-[#06B6D4]/20 text-[#06B6D4] font-bold text-base border border-[#06B6D4]/30">
            Simple Process
          </span>
          <h2 className="mt-6 text-4xl md:text-5xl font-extrabold text-white">
            How It Works
          </h2>
          <p className="mt-5 text-base text-slate-300 max-w-3xl mx-auto">
            Our streamlined 4-step process makes complaint submission and tracking simple, efficient, and transparent for everyone.
          </p>
        </div>

        {/* Grid with connecting lines */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="group relative bg-[#343d49] rounded-3xl p-6 shadow-xl border border-transparent hover:border-[#06B6D4]/40 hover:shadow-2xl hover:shadow-[#06B6D4]/20 hover:-translate-y-3 transition-all duration-500 flex flex-col"
              >
                {/* Icon */}
                <div className="w-16 h-16 mb-6 rounded-2xl bg-linear-to-br from-[#1760D7] to-[#06B6D4] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-10 h-10 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#06B6D4] group-hover:text-white transition-colors mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-300 text-sm leading-relaxed flex-1">
                  {step.desc}
                </p>

                {/* Small STEP label at bottom */}
                <span className="mt-6 text-xs font-extrabold text-[#06B6D4]/70 text-center">
                  STEP {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}