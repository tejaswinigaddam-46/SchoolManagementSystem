import { createContext, useContext, useState } from 'react'

const LayoutContext = createContext()

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

export const LayoutProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isIconNavigation, setIsIconNavigation] = useState(false)

  const value = {
    sidebarOpen,
    setSidebarOpen,
    isIconNavigation,
    setIsIconNavigation,
    getSidebarWidth: () => {
      if (isIconNavigation) return '5rem' // w-20 = 80px = 5rem
      return '18rem' // w-72 = 288px = 18rem
    },
    getSidebarWidthClass: () => {
      if (isIconNavigation) return 'lg:pl-20'
      return 'lg:pl-72'
    }
  }

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}