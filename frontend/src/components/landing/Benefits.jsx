import {
  Clock,
  TrendingDown,
  Users,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: Clock,
      title: 'Save 10+ Hours Weekly',
      description:
        'Automate repetitive tasks like attendance, fee collection, and report generation',
      metric: '70% faster',
      color: 'primary',
    },
    {
      icon: TrendingDown,
      title: 'Reduce Manual Errors',
      description:
        'Eliminate data entry mistakes with automated systems and validation',
      metric: '95% accuracy',
      color: 'success',
    },
    {
      icon: Users,
      title: 'Better Communication',
      description:
        'Keep parents informed with instant notifications and real-time updates',
      metric: '3x engagement',
      color: 'accent',
    },
    {
      icon: BarChart3,
      title: 'Data-Driven Decisions',
      description:
        'Make informed choices with comprehensive analytics and insights',
      metric: 'Real-time insights',
      color: 'warning',
    },
    {
      icon: Shield,
      title: 'Enhanced Security',
      description:
        'Protect sensitive data with bank-grade encryption and access controls',
      metric: '100% secure',
      color: 'error',
    },
    {
      icon: Zap,
      title: 'Instant Performance Tracking',
      description:
        'Monitor student progress and identify improvement areas quickly',
      metric: 'Live tracking',
      color: 'pink',
    },
  ];

  const colorClasses = {
    primary: {
      bg: 'bg-primary-50',
      icon: 'bg-primary-100 text-primary-600',
      badge: 'bg-primary-600 text-white',
      border: 'border-primary-200',
    },
    success: {
      bg: 'bg-success-50',
      icon: 'bg-success-100 text-success-600',
      badge: 'bg-success-600 text-white',
      border: 'border-success-200',
    },
    accent: {
      bg: 'bg-accent-50',
      icon: 'bg-accent-100 text-accent-600',
      badge: 'bg-accent-600 text-white',
      border: 'border-accent-200',
    },
    warning: {
      bg: 'bg-warning-50',
      icon: 'bg-warning-100 text-warning-600',
      badge: 'bg-warning-600 text-white',
      border: 'border-warning-200',
    },
    error: {
      bg: 'bg-error-50',
      icon: 'bg-error-100 text-error-600',
      badge: 'bg-error-600 text-white',
      border: 'border-error-200',
    },
    pink: {
      bg: 'bg-pink-50',
      icon: 'bg-pink-100 text-pink-600',
      badge: 'bg-pink-600 text-white',
      border: 'border-pink-200',
    },
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-secondary-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Real Benefits for Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                Institution
              </span>
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              See measurable improvements in efficiency, accuracy, and
              stakeholder satisfaction
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className={`group p-6 ${colorClasses[benefit.color].bg} rounded-2xl border-2 ${colorClasses[benefit.color].border} hover:shadow-medium transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-12 h-12 ${colorClasses[benefit.color].icon} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 ${colorClasses[benefit.color].badge} rounded-full`}
                  >
                    {benefit.metric}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-secondary-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-secondary-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white rounded-2xl shadow-soft border border-secondary-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                500+
              </div>
              <div className="text-sm text-secondary-600">Active Schools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600 mb-2">
                50K+
              </div>
              <div className="text-sm text-secondary-600">
                Students Enrolled
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                99.9%
              </div>
              <div className="text-sm text-secondary-600">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 mb-2">
                24/7
              </div>
              <div className="text-sm text-secondary-600">
                Support Available
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
