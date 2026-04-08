import { GraduationCap, Sparkles, ArrowRight } from 'lucide-react';

export default function Hero({ onDemoClick }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-accent-50 via-blue-50 to-white pt-16 pb-24 md:pt-24 md:pb-32">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-soft border border-primary-200 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-secondary-800">
              AI-Powered School Management Platform
            </span>
          </div>

          {/* Main Headline - H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-secondary-900 mb-6 leading-tight animate-slide-in">
            All-in-One School Management Software for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
              Modern Institutions
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-secondary-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Manage students, staff, payroll, and communication seamlessly across
            web and mobile apps. Empower your institution with AI-driven
            learning and real-time insights.
          </p>

          {/* CTA Button */}
          <div className="flex items-center justify-center mb-12">
            <button
              onClick={onDemoClick}
              className="group w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
            >
              Book a Free Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-secondary-600">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-success-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>100% Cloud-Based</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-accent-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-warning-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
