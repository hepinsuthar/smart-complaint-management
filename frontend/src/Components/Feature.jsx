import React from 'react';
import { 
  FileText, 
  Clock, 
  Shield, 
  Users, 
  Lock, 
  Bell, 
  BarChart3, 
  Smartphone 
} from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: "Easy Complaint Submission",
      desc: "Students can quickly submit complaints with category selection and file attachments.",
      gradient: "from-[#1760D7] to-[#06B6D4]"
    },
    {
      icon: Clock,
      title: "Real-Time Tracking",
      desc: "Track complaint status in real time with instant updates and progress monitoring.",
      gradient: "from-teal-400 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      desc: "Role-based access and data protection ensure confidentiality and secure complaint handling.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Users,
      title: "Multi-Role Support",
      desc: "Separate dashboards for students and administrators with controlled permissions.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Lock,
      title: "Data Protection",
      desc: "Secure storage and encryption protect user data and complaint records.",
      gradient: "from-[#1760D7] to-[#06B6D4]"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      desc: "Automated email and dashboard notifications keep users informed of updates.",
      gradient: "from-red-500 to-[#06B6D4]"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      desc: "Visual reports help administrators analyze complaint trends and performance.",
      gradient: "from-[#1760D7] to-[#06B6D4]"
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      desc: "Fully responsive interface works smoothly on desktop and mobile devices.",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section className="py-20 bg-[#151c28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-5 py-2 rounded-full bg-linear-to-r from-[#1760D7]/20 to-[#06B6D4]/20 text-[#06B6D4] font-bold text-base border border-[#06B6D4]/30">
            Powerful Features
          </span>
          <h2 className="mt-6 text-4xl md:text-5xl font-extrabold text-white">
            Everything You Need for Efficient<br className="hidden md:block" />Complaint Management
          </h2>
          <p className="mt-5 text-base text-slate-300 max-w-3xl mx-auto">
            Our comprehensive platform provides all the tools and features needed to streamline complaint resolution and improve communication between students and administrators.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-[#343d49] rounded-3xl p-6 shadow-xl border border-transparent hover:border-[#06B6D4]/40 hover:shadow-2xl hover:shadow-[#06B6D4]/20 hover:-translate-y-3 transition-all duration-500 flex flex-col"
            >
              <div className={`w-16 h-16 mb-5 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-lg font-bold text-[#06B6D4] group-hover:text-white transition-colors mb-2">
                {feature.title}
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}