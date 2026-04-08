import { Smartphone, Apple, Bell, TrendingUp } from 'lucide-react';

export default function MobileAppSection() {
  const features = [
    {
      icon: Bell,
      title: 'Real-Time Notifications',
      description:
        'Instant alerts for attendance, exams, and important updates',
    },
    {
      icon: TrendingUp,
      title: 'Performance Tracking',
      description: 'Monitor student progress with detailed analytics',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block px-4 py-2 bg-white rounded-full shadow-soft border border-primary-200 mb-6">
                <span className="text-sm font-semibold text-primary-600">
                  Mobile-First Experience
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">
                Stay Connected with Our{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                  Mobile Apps
                </span>
              </h2>

              <p className="text-lg text-secondary-600 mb-8">
                Empower parents and students with 24/7 access to academic data,
                attendance, fees, and more through our intuitive mobile
                applications.
              </p>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* App Store Badges */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-secondary-900 text-white rounded-xl shadow-medium hover:shadow-lg transition-all cursor-pointer group">
                  <Apple className="w-6 h-6" />
                  <div className="text-left">
                    <div className="text-xs opacity-80">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-secondary-900 text-white rounded-xl shadow-medium hover:shadow-lg transition-all cursor-pointer group">
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-80">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image/Mockup */}
            <div className="relative">
              <div className="relative z-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 space-y-6">
                  {/* Mobile UI Preview */}
                  <div className="flex items-center justify-between pb-4 border-b border-secondary-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <Smartphone className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-secondary-900">
                          Student Dashboard
                        </div>
                        <div className="text-sm text-secondary-600">
                          Welcome back!
                        </div>
                      </div>
                    </div>
                    <Bell className="w-5 h-5 text-secondary-600" />
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-success-50 rounded-xl border border-success-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-secondary-900">
                          Attendance
                        </span>
                        <span className="text-sm font-bold text-success-600">
                          95%
                        </span>
                      </div>
                      <div className="h-2 bg-success-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success-600 rounded-full"
                          style={{ width: '95%' }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-accent-50 rounded-xl border border-accent-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-secondary-900">
                          Average Score
                        </span>
                        <span className="text-sm font-bold text-accent-600">
                          87/100
                        </span>
                      </div>
                      <div className="h-2 bg-accent-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-600 rounded-full"
                          style={{ width: '87%' }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-secondary-900">
                          Next Exam
                        </span>
                        <span className="text-sm font-bold text-primary-600">
                          Mathematics
                        </span>
                      </div>
                      <div className="text-xs text-secondary-600 mt-1">
                        Tomorrow, 10:00 AM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70" />
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-300 rounded-full mix-blend-multiply filter blur-2xl opacity-70" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
