import { useMemo, useState } from 'react'
import { ClipboardList, Sparkles } from 'lucide-react'
import AIChatPage from './AIChatPage'
import TeachersFeedbackPage from './TeachersFeedbackPage'

export default function AIManagementPage() {
  const [activeTab, setActiveTab] = useState('chat')

  const tabs = useMemo(
    () => [
      {
        id: 'chat',
        name: 'AI Chat',
        icon: Sparkles,
        description: 'Student learning assistant'
      },
      {
        id: 'feedback',
        name: 'Teacher Feedback',
        icon: ClipboardList,
        description: 'Teaching insights and progress'
      }
    ],
    []
  )

  const activeMeta = tabs.find((t) => t.id === activeTab) || tabs[0]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex w-full space-x-1 bg-white p-1 rounded-xl border border-secondary-100">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive ? 'bg-primary-600 text-white shadow-sm' : 'text-secondary-700 hover:bg-secondary-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="min-h-0">
        {activeTab === 'chat' && <AIChatPage />}
        {activeTab === 'feedback' && <TeachersFeedbackPage />}
      </div>
    </div>
  )
}
