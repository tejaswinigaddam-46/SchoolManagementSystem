import { CheckCircle, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Setup Your School',
      description:
        'Create your institution profile, add campuses, and configure basic settings in minutes',
      icon: '🏫',
      details: ['Quick onboarding', 'Custom branding', 'Multi-campus support'],
    },
    {
      number: '02',
      title: 'Add Users & Structure',
      description:
        'Import students, teachers, and staff. Set up classes, sections, and academic curriculum',
      icon: '👥',
      details: [
        'Bulk import via Excel',
        'Role assignment',
        'Automated notifications',
      ],
    },
    {
      number: '03',
      title: 'Start Managing',
      description:
        'Begin using all features immediately. Track attendance, manage payroll, and communicate seamlessly',
      icon: '🚀',
      details: ['Instant access', 'Mobile apps ready', 'Full support included'],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Get Started in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              From setup to full operation in less than a day. No technical
              expertise required.
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line - hidden on mobile */}
            <div
              className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-accent-200 to-success-200"
              style={{ top: '6rem', marginLeft: '10%', marginRight: '10%' }}
            />

            <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Step Card */}
                  <div className="group relative bg-white rounded-2xl p-8 border-2 border-secondary-100 hover:border-primary-300 hover:shadow-medium transition-all duration-300">
                    {/* Step Number */}
                    <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {step.number}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className="text-5xl mb-4 mt-4">{step.icon}</div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-secondary-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-secondary-600 mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details */}
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm text-secondary-700"
                        >
                          <CheckCircle className="w-4 h-4 text-success-600 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow between steps - hidden on mobile, last arrow hidden */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-20 -right-6 items-center justify-center z-10">
                      <ArrowRight className="w-8 h-8 text-primary-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl border border-primary-200">
              <div className="text-left">
                <div className="font-bold text-secondary-900 text-lg mb-1">
                  Ready to get started?
                </div>
                <div className="text-sm text-secondary-600">
                  Book a free demo and see it in action
                </div>
              </div>
              <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-lg transition-all whitespace-nowrap">
                Schedule Demo →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
