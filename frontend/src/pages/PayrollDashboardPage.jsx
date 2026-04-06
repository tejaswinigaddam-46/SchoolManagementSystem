import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import { PERMISSIONS } from '../config/permissions'

const PayrollDashboardPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const menuItems = [
    {
      title: 'Employee Payroll',
      description: 'View payroll report for employees based on attendance.',
      icon: CreditCard,
      path: '/payroll/employee',
      permission: PERMISSIONS.PAYROLL_REPORT_READ,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'My Payroll',
      description: 'View your own payroll summary and payable days.',
      icon: CreditCard,
      path: '/payroll/my',
      permission: PERMISSIONS.MY_PAYROLL_READ,
      color: 'bg-green-50 text-green-600'
    }
  ]

  const filteredItems = menuItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission)
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map(item => {
          const Icon = item.icon
          return (
            <Card
              key={item.path}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow border border-secondary-100"
              onClick={() => navigate(item.path)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            You do not have access to any payroll modules.
          </div>
        )}
      </div>
    </div>
  )
}

export default PayrollDashboardPage

