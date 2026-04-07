import {
  Brain,
  Sparkles,
  Zap,
  Target,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

export default function AIFeatures() {
  const aiFeatures = [
    {
      icon: Brain,
      title: 'AI Tutor Assistant',
      description:
        'Personalized learning companion that helps students understand concepts, solve problems, and clarify doubts 24/7',
      benefits: [
        'Instant doubt resolution',
        'Step-by-step explanations',
        'Subject-wise assistance',
      ],
    },
    {
      icon: Sparkles,
      title: 'Smart Quiz Generator',
      description:
        'Automatically generates practice quizzes based on syllabus, difficulty level, and student performance',
      benefits: [
        'Adaptive difficulty',
        'Topic-wise tests',
        'Performance analytics',
      ],
    },
    {
      icon: Target,
      title: 'Personalized Learning Paths',
      description:
        'AI analyzes student performance and creates customized study plans to improve weak areas',
      benefits: [
        'Identify weak topics',
        'Customized recommendations',
        'Progress tracking',
      ],
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-secondary-900 via-primary-900 to-accent-900 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-400 rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <Zap className="w-4 h-4 text-warning-400" />
              <span className="text-sm font-semibold">
                Powered by Artificial Intelligence
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Future of Learning with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-warning-400 to-accent-400">
                AI Technology
              </span>
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Give your students a competitive edge with AI-powered tools
              designed for modern education
            </p>
          </div>

          {/* AI Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/70 mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-white/60"
                    >
                      <div className="w-1.5 h-1.5 bg-accent-400 rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* AI Demo/Highlight Section */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">See AI in Action</h3>
                <p className="text-white/70 mb-6">
                  Students can ask questions in natural language and get
                  instant, easy-to-understand explanations. The AI adapts to
                  each student's learning pace and style.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-accent-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">
                        Natural Conversations
                      </div>
                      <div className="text-sm text-white/60">
                        Ask questions like you would to a teacher
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-accent-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">
                        Curriculum Aligned
                      </div>
                      <div className="text-sm text-white/60">
                        Content matches your school's syllabus
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-accent-400 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">
                        Adaptive Learning
                      </div>
                      <div className="text-sm text-white/60">
                        Gets smarter with every interaction
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Chat Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary-600">
                        S
                      </span>
                    </div>
                    <div className="bg-secondary-100 rounded-2xl rounded-tl-none px-4 py-3">
                      <p className="text-sm text-secondary-900">
                        Can you explain photosynthesis in simple terms?
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gradient-to-br from-primary-600 to-accent-600 text-white rounded-2xl rounded-tr-none px-4 py-3">
                      <p className="text-sm">
                        Photosynthesis is how plants make food using sunlight!
                        Think of it as plants "cooking" their meal using: 🌞
                        Sunlight + 💧 Water + 🌬️ Carbon dioxide = 🍃 Glucose
                        (food) + 💨 Oxygen
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="text-xs text-secondary-500 bg-secondary-100 px-3 py-1 rounded-full">
                      AI is typing...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
