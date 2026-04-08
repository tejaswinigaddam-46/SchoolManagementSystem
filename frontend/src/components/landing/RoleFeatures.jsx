import { useState } from 'react';
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  IndianRupee,
  BarChart3,
  ClipboardCheck,
  Calendar,
  Smartphone,
  TrendingUp,
  Brain,
  FileText,
} from 'lucide-react';

export default function RoleFeatures() {
  const [activeTab, setActiveTab] = useState('admin');

  const roles = [
    { id: 'admin', label: 'Admin Panel', icon: Users },
    { id: 'teachers', label: 'Teachers', icon: UserCheck },
    { id: 'parents', label: 'Parents', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
  ];

  const features = {
    admin: [
      {
        icon: Users,
        title: 'Complete User Management',
        description:
          'Manage students, parents, teachers, and staff with role-based access control',
      },
      {
        icon: IndianRupee,
        title: 'Automated Payroll System',
        description:
          'Process salaries, track attendance, generate pay slips with full compliance',
      },
      {
        icon: BarChart3,
        title: 'Analytics Dashboard',
        description:
          'Real-time insights into attendance, performance, fees, and operations',
      },
      {
        icon: BookOpen,
        title: 'Academic Management',
        description:
          'Manage classes, sections, subjects, timetables, and exam schedules',
      },
      {
        icon: IndianRupee,
        title: 'Fee Management',
        description:
          'Configure fee structures, track payments, generate receipts automatically',
      },
      {
        icon: Calendar,
        title: 'Calendar & Events',
        description:
          'Schedule events, holidays, exams, and send automated notifications',
      },
    ],
    teachers: [
      {
        icon: ClipboardCheck,
        title: 'Quick Attendance Marking',
        description:
          'Mark student attendance in seconds with mobile or web interface',
      },
      {
        icon: BookOpen,
        title: 'Class Management',
        description:
          'Access class schedules, student lists, and subject assignments',
      },
      {
        icon: FileText,
        title: 'Grade Management',
        description:
          'Enter marks, generate report cards, and track student performance',
      },
      {
        icon: IndianRupee,
        title: 'Payroll Visibility',
        description: 'View salary slips, attendance records, and leave balance',
      },
      {
        icon: Calendar,
        title: 'Timetable Access',
        description:
          'View personal timetable, room allocations, and upcoming classes',
      },
      {
        icon: Users,
        title: 'Parent Communication',
        description: 'Send updates and announcements directly to parents',
      },
    ],
    parents: [
      {
        icon: Smartphone,
        title: 'Mobile App Access',
        description:
          'Track everything from your smartphone - Android & iOS supported',
      },
      {
        icon: TrendingUp,
        title: 'Performance Tracking',
        description:
          'Monitor student marks, grades, and academic progress in real-time',
      },
      {
        icon: ClipboardCheck,
        title: 'Attendance Monitoring',
        description:
          'Get instant notifications when your child is marked absent',
      },
      {
        icon: IndianRupee,
        title: 'Fee Management',
        description: 'View fee dues, payment history, and make online payments',
      },
      {
        icon: Calendar,
        title: 'Real-Time Updates',
        description:
          'Receive notifications about exams, events, holidays, and announcements',
      },
      {
        icon: FileText,
        title: 'Report Cards',
        description: 'Download digital report cards and performance analytics',
      },
    ],
    students: [
      {
        icon: Smartphone,
        title: 'Mobile Learning Hub',
        description:
          'Access all features through intuitive mobile app interface',
      },
      {
        icon: Brain,
        title: 'AI Tutor Assistant',
        description:
          'Get personalized help with homework and concepts using AI',
      },
      {
        icon: FileText,
        title: 'AI Quiz Generator',
        description:
          'Practice with auto-generated quizzes based on your syllabus',
      },
      {
        icon: TrendingUp,
        title: 'Performance Dashboard',
        description: 'Track your marks, attendance, and academic progress',
      },
      {
        icon: ClipboardCheck,
        title: 'Attendance View',
        description: 'Monitor your attendance percentage across all subjects',
      },
      {
        icon: Calendar,
        title: 'Exam Schedule',
        description: 'View upcoming exams, assignments, and important dates',
      },
    ],
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-accent-50 via-blue-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                Every Stakeholder
              </span>
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Powerful features tailored for admins, teachers, parents, and
              students
            </p>
          </div>

          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveTab(role.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === role.id
                    ? 'bg-primary-600 text-white shadow-medium transform scale-105'
                    : 'bg-white text-secondary-700 hover:bg-secondary-50 shadow-soft'
                }`}
              >
                <role.icon className="w-5 h-5" />
                {role.label}
              </button>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features[activeTab].map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl shadow-soft hover:shadow-medium border border-secondary-100 hover:border-primary-200 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-secondary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-secondary-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
