import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ProblemSolution() {
  const problems = [
    {
      icon: AlertCircle,
      title: 'Manual Data Management',
      description: 'Hours wasted on paperwork and spreadsheets',
    },
    {
      icon: AlertCircle,
      title: 'Poor Communication',
      description: 'Disconnected parents and delayed updates',
    },
    {
      icon: AlertCircle,
      title: 'Payroll Complexity',
      description: 'Error-prone salary calculations and processing',
    },
    {
      icon: AlertCircle,
      title: 'No Performance Visibility',
      description: 'Difficult to track student progress effectively',
    },
  ];

  const solutions = [
    {
      icon: CheckCircle2,
      title: 'Automated Systems',
      description: 'Digital records with instant access from anywhere',
    },
    {
      icon: CheckCircle2,
      title: 'Real-Time Updates',
      description: 'Instant notifications to parents via mobile app',
    },
    {
      icon: CheckCircle2,
      title: 'Smart Payroll',
      description: 'Automated calculations with compliance tracking',
    },
    {
      icon: CheckCircle2,
      title: 'Analytics Dashboard',
      description: 'Comprehensive insights into student performance',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Schools Need a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                Unified Platform
              </span>
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Traditional management methods create bottlenecks. We solve them
              with one integrated solution.
            </p>
          </div>

          {/* Problems vs Solutions Grid */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Problems Column */}
            <div>
              <div className="inline-block px-4 py-2 bg-error-100 text-error-700 rounded-lg font-semibold text-sm mb-6">
                Common Challenges
              </div>
              <div className="space-y-4">
                {problems.map((problem, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-secondary-50 rounded-xl border border-secondary-100 hover:border-error-200 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-error-100 rounded-lg flex items-center justify-center">
                      <problem.icon className="w-5 h-5 text-error-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-1">
                        {problem.title}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {problem.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions Column */}
            <div>
              <div className="inline-block px-4 py-2 bg-success-100 text-success-700 rounded-lg font-semibold text-sm mb-6">
                Our Solution
              </div>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-success-50 rounded-xl border border-success-100 hover:border-success-300 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                      <solution.icon className="w-5 h-5 text-success-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 mb-1">
                        {solution.title}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl shadow-medium">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">
                One Platform. All Solutions.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
