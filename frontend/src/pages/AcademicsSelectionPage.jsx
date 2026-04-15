import { useNavigate } from 'react-router-dom'
import { BookOpen, Building, GraduationCap, Home, Users } from 'lucide-react'
import Card from '../components/ui/Card'

/**
 * AcademicsSelectionPage Component
 * Intermediate page that shows options for Academic Setup and Subject Setup
 */
export default function AcademicsSelectionPage() {
  const navigate = useNavigate()

  const academicsOptions = [
    {
      id: 'academic-setup',
      title: 'Academic Setup',
      description: 'Manage academic years, classes, and curricula',
      icon: BookOpen,
      path: '/academics/setup',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'subject-setup',
      title: 'Subject Setup', 
      description: 'Manage subjects, courses, and curriculum content',
      icon: GraduationCap,
      path: '/academics/subjects',
      color: 'from-green-500 to-green-600'
    },
    {
        id: 'class-setup',
        title: 'Class Setup', 
        description: 'Manage classes and schedules for academic sessions',
        icon: Building,  
        path: '/academics/classes',
        color: 'from-purple-500 to-purple-600'
      },
      {
        id: 'building-setup',
        title: 'Building Setup', 
        description: 'Manage buildings and facilities for academic sessions',
        icon: Building,
        path: '/academics/buildings',
        color: 'from-green-500 to-green-600'
      },
    {
        id: 'campusrooms-setup',
        title: 'Campus Rooms Setup', 
        description: 'Manage rooms across campus buildings and facilities',
        icon: Home,
        path: '/academics/campusrooms',
        color: 'from-green-500 to-green-600'
      },
      {
        id: 'sections-setup',
        title: 'Sections Setup', 
        description: 'Manage sections across classes',
        icon: Home,
        path: '/academics/classsections',
        color: 'from-orange-500 to-orange-600'
      },
      {
        id: 'students-to-section',
        title: 'Students to Section', 
        description: 'Assign students to class sections',
        icon: Users,
        path: '/academics/students-to-section',
        color: 'from-indigo-500 to-indigo-600'
      },
      {
        id: 'teachers-to-section',
        title: 'Teacher Assignment',
        description: 'Assign teachers to subjects in sections',
        icon: Users,
        path: '/academics/teachers-to-section',
        color: 'from-indigo-500 to-indigo-600'
      }
  ]

  const handleOptionClick = (path) => {
    navigate(path)
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">
          Academic Management
        </h1>
        <p className="text-secondary-600 text-sm sm:base">
          Choose the academic management area you want to access
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl">
        {academicsOptions.map((option) => {
          const Icon = option.icon
          return (
            <Card
              key={option.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 border-0 bg-white"
              onClick={() => handleOptionClick(option.path)}
            >
              <div className="p-6 sm:p-8 text-center">
                {/* Icon with gradient background */}
                <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r ${option.color} mb-4 sm:mb-6`}>
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                
                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-2 sm:mb-3">
                  {option.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm sm:text-base text-secondary-600 leading-relaxed">
                  {option.description}
                </p>
                
                {/* Action indicator */}
                <div className="mt-4 sm:mt-6">
                  <span className="inline-flex items-center px-4 py-2 bg-secondary-50 text-secondary-700 rounded-full text-xs sm:text-sm font-medium">
                    Click to access →
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
