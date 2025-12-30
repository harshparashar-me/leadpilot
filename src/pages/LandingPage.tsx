import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { 
  Home, 
  Star, 
  Shield, 
  Zap, 
  Users, 
  TrendingUp, 
  Mail, 
  Phone, 
  MapPin,
  ChevronRight,
  Check,
  Handshake,
  BarChart3,
  Lock,
  Globe,
  BarChart,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  Target,
  Clock,
  Award,
  HeadphonesIcon
} from 'lucide-react'
import { cn } from '../lib/utils'

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navigation */}
      <nav className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300",
        scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white/80 backdrop-blur-sm"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group">
              {/* Logo - Replace with your actual logo path */}
              <div className="relative">
                <img 
                  src="/company-logo.png" 
                  alt="LeadPilot Logo" 
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    // Fallback to text logo if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center text-white font-bold text-lg shadow-lg">
                  LP
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  LeadPilot
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Enterprise CRM</p>
              </div>
            </Link>
            <div className="hidden lg:flex items-center space-x-10">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Features</a>
              <a href="#solutions" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Solutions</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Customers</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#contact" className="hidden md:block text-gray-700 hover:text-blue-600 transition-colors font-medium">
                Talk to Sales
              </a>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enterprise Level */}
      <section id="home" className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-8 border border-blue-200">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 10,000+ Businesses Across India</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              भारत का सबसे Trusted
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Enterprise CRM
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered insights, automated workflows, और seamless integrations के साथ customer relationships को transform करें। Built for Indian businesses that scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-2xl hover:shadow-blue-500/50 flex items-center gap-2 transform hover:-translate-y-1"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all duration-200 bg-white/50 backdrop-blur-sm flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">14-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">UPI / Net Banking Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 relative z-10">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Active Users", value: "50K+", icon: Users },
                { label: "Indian Companies", value: "5K+", icon: Building2 },
                { label: "Uptime", value: "99.9%", icon: Shield },
                { label: "Support (IST)", value: "24/7", icon: HeadphonesIcon }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Scale Your Business
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive CRM solution with advanced automation, AI insights, and seamless integrations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Lead Scoring",
                description: "Automatically prioritize leads with machine learning algorithms that predict conversion probability.",
                icon: TrendingUp,
                gradient: "from-blue-500 to-blue-600"
              },
              {
                title: "Advanced Analytics",
                description: "Real-time dashboards and custom reports to track performance and identify growth opportunities.",
                icon: BarChart3,
                gradient: "from-indigo-500 to-indigo-600"
              },
              {
                title: "Workflow Automation",
                description: "Automate repetitive tasks and create custom workflows to streamline your sales process.",
                icon: Zap,
                gradient: "from-purple-500 to-purple-600"
              },
              {
                title: "Contact Management",
                description: "Centralized database with 360-degree customer view and relationship tracking.",
                icon: Users,
                gradient: "from-pink-500 to-pink-600"
              },
              {
                title: "Deal Pipeline",
                description: "Visual kanban boards to manage deals through every stage of your sales cycle.",
                icon: Target,
                gradient: "from-green-500 to-green-600"
              },
              {
                title: "Secure & Compliant",
                description: "Enterprise-grade security with SOC 2, GDPR compliance, and regular security audits.",
                icon: Lock,
                gradient: "from-red-500 to-red-600"
              },
              {
                title: "Integration Ecosystem",
                description: "Connect with 500+ apps including Salesforce, HubSpot, Slack, and custom integrations.",
                icon: Globe,
                gradient: "from-cyan-500 to-cyan-600"
              },
              {
                title: "Task Management",
                description: "Smart task assignment, reminders, and collaboration tools to keep your team aligned.",
                icon: Check,
                gradient: "from-orange-500 to-orange-600"
              },
              {
                title: "Mobile Access",
                description: "Native iOS and Android apps to manage your CRM on the go, anywhere, anytime.",
                icon: Phone,
                gradient: "from-teal-500 to-teal-600"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity bg-gradient-to-br", feature.gradient)}></div>
                <div className={cn("inline-flex p-4 rounded-xl bg-gradient-to-br mb-6 shadow-lg", feature.gradient)}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Enhanced */}
      <section id="why-us" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
              Why LeadPilot?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Built for Modern
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Enterprise Teams
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Lightning Fast Performance",
                description: "Built on modern infrastructure with global CDN, ensuring sub-100ms response times and 99.9% uptime.",
                icon: Zap,
                metric: "<100ms",
                metricLabel: "Response Time"
              },
              {
                title: "Enterprise Security",
                description: "SOC 2 Type II certified, GDPR compliant, end-to-end encryption, and regular security audits.",
                icon: Shield,
                metric: "SOC 2",
                metricLabel: "Certified"
              },
              {
                title: "Dedicated Support",
                description: "24/7 priority support with dedicated account managers and comprehensive onboarding.",
                icon: HeadphonesIcon,
                metric: "24/7",
                metricLabel: "Support"
              }
            ].map((item, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow border border-gray-100">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{item.metric}</div>
                    <div className="text-sm text-gray-600">{item.metricLabel}</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
              Customer Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by India's
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Leading Businesses
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                role: "CEO",
                company: "Mumbai Real Estate Group",
                testimonial: "LeadPilot ने हमारे sales process को transform कर दिया। हमने 45% increase देखा conversion rates में और automation से 20 hours per week बचाए।",
                rating: 5,
                image: "👨‍💼"
              },
              {
                name: "Priya Sharma",
                role: "VP of Sales",
                company: "Delhi Tech Solutions",
                testimonial: "AI-powered insights game-changing रहे हैं। अब हम predict कर सकते हैं कि कौन से deals close होंगे और अपने efforts को focus कर सकते हैं।",
                rating: 5,
                image: "👩‍💼"
              },
              {
                name: "Amit Patel",
                role: "Marketing Director",
                company: "Bangalore Growth Agency",
                testimonial: "Best CRM investment जो हमने किया है। Integration ecosystem और workflow automation ने हमारे entire operation को streamline कर दिया।",
                rating: 5,
                image: "👨‍💻"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic text-lg">"{testimonial.testimonial}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Enhanced */}
      <section id="pricing" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free, upgrade as you grow. All plans include 14-day free trial.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "₹2,499",
                period: "per month",
                description: "Perfect for small teams getting started",
                features: [
                  "Up to 5 users",
                  "10,000 contacts",
                  "Basic CRM features",
                  "Email support",
                  "Mobile apps",
                  "API access",
                  "UPI / Net Banking"
                ],
                popular: false,
                cta: "Start Free Trial"
              },
              {
                name: "Professional",
                price: "₹7,999",
                period: "per month",
                description: "For growing businesses",
                features: [
                  "Up to 25 users",
                  "Unlimited contacts",
                  "Advanced analytics",
                  "Workflow automation",
                  "AI lead scoring",
                  "Priority support",
                  "Custom integrations",
                  "Dedicated account manager",
                  "GST Invoice"
                ],
                popular: true,
                cta: "Start Free Trial"
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "pricing",
                description: "For large organizations",
                features: [
                  "Unlimited users",
                  "Unlimited everything",
                  "Advanced security & compliance",
                  "Custom AI models",
                  "24/7 phone support (IST)",
                  "On-premise deployment option",
                  "Custom SLA",
                  "Dedicated infrastructure",
                  "GST Compliance"
                ],
                popular: false,
                cta: "Contact Sales"
              }
            ].map((plan, index) => (
              <div key={index} className={cn(
                "relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 transform hover:-translate-y-2",
                plan.popular 
                  ? "border-blue-500 shadow-2xl scale-105" 
                  : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
              )}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className="text-gray-600 text-lg">/{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => plan.name === "Enterprise" ? window.location.href = "#contact" : setAuthModalOpen(true)}
                  className={cn(
                    "block w-full text-center py-4 rounded-xl font-bold text-lg transition-all duration-200",
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200 border-2 border-gray-200"
                  )}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              Get In Touch
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Transform
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Your Business?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Speak with our team to learn how LeadPilot can help you achieve your goals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Email</p>
                      <a href="mailto:support@leadpilot.com" className="text-blue-600 hover:underline">support@leadpilot.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Phone</p>
                      <a href="tel:+919876543210" className="text-gray-700">+91 98765 43210</a>
                      <p className="text-sm text-gray-500 mt-1">Mon-Sat, 9 AM - 6 PM IST</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Office</p>
                      <p className="text-gray-700">123 Business Park, Sector 44<br />Gurgaon, Haryana 122009<br />India</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <form className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl border border-gray-200">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about your needs..."
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/company-logo.png" 
                  alt="LeadPilot Logo" 
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center text-white font-bold text-lg">
                  LP
                </div>
                <div>
                  <h3 className="text-xl font-bold">LeadPilot</h3>
                  <p className="text-sm text-gray-400">Enterprise CRM</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Transforming customer relationships for businesses worldwide. Built for scale, designed for success.
              </p>
              <div className="flex gap-4">
                {/* Social Media Icons - Add your social links */}
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-sm">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-sm">in</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <span className="text-sm">t</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-lg">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} LeadPilot. All rights reserved.</p>
            <div className="flex gap-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add custom animations */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}
