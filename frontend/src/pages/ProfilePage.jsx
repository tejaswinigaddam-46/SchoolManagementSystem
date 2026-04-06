import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authService } from '../services/authService'
import Card from '../components/ui/Card'
import { User, Briefcase, GraduationCap, Building, Phone, Mail, MapPin, Calendar, CreditCard, Users, Heart, Ruler, Weight, Activity } from 'lucide-react'
import PhoneNumberDisplay from '../components/ui/PhoneNumberDisplay'

const ProfilePage = () => {
  const { tenantName, campusName } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await authService.getProfile()
        if (response.success) {
          setProfileData(response.data)
        } else {
          setError('Failed to load profile data')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('An error occurred while loading your profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (e) {
      return dateString
    }
  }

  // Format currency helper
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return ''
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount)
    } catch (e) {
      return amount
    }
  }

  const renderInfoRow = (icon, label, value) => (
    <div className="flex items-start gap-3 py-3 border-b border-secondary-100 last:border-0">
      <div className="mt-1 text-secondary-400">{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-secondary-500">{label}</p>
        <div className="text-secondary-900 font-medium min-h-[1.5rem]">{value || ''}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-error-50 text-error-700 p-4 rounded-lg border border-error-200">
          {error}
        </div>
      </div>
    )
  }

  if (!profileData) return null

  // Destructure with fallbacks
  const { student, employee, role, user } = profileData
  const userRole = role || profileData.role
  
  // Basic info from user object or top level
  const firstName = user?.first_name || profileData.first_name
  const middleName = user?.middle_name || profileData.middle_name
  const lastName = user?.last_name || profileData.last_name
  const username = user?.username || profileData.username
  const phoneNumber = user?.phone_number || profileData.phone_number
  const createdAt = user?.created_at || profileData.created_at

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Profile</h1>
          <p className="text-secondary-500">View your personal and account details</p>
        </div>
        <div className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium border border-primary-100">
          {tenantName} • {campusName}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary-600">
                  {firstName?.charAt(0)}{lastName?.charAt(0)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-secondary-900">
                {firstName} {middleName} {lastName}
              </h2>
              <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm font-medium mt-2">
                {userRole}
              </span>
            </div>

            <div className="space-y-1">
              {renderInfoRow(<User size={18} />, 'Username', username)}
              {renderInfoRow(<Phone size={18} />, 'Phone', <PhoneNumberDisplay value={phoneNumber} />)}
              {renderInfoRow(<Calendar size={18} />, 'Joined', formatDate(createdAt))}
            </div>
          </Card>

          {/* Contact Details - Always show fields even if empty */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-primary-600" />
              Contact Information
            </h3>
            <div className="space-y-1">
              {renderInfoRow(<Mail size={18} />, 'Email', student?.email || employee?.email || profileData.email)}
              {renderInfoRow(<MapPin size={18} />, 'Current Address', student?.current_address || employee?.current_address || profileData.current_address)}
              {renderInfoRow(<MapPin size={18} />, 'Permanent Address', student?.permanent_address || employee?.permanent_address || profileData.permanent_address)}
            </div>
          </Card>
        </div>

        {/* Right Column: Role Specific Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Student Specific Details */}
          {userRole === 'Student' && (
            <>
              <Card className="p-6">
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <GraduationCap size={20} className="text-primary-600" />
                  Academic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  {renderInfoRow(<Building size={18} />, 'Class', student?.class_name)}
                  {renderInfoRow(<Building size={18} />, 'Section', student?.section_name)}
                  {renderInfoRow(<Users size={18} />, 'Roll Number', student?.roll_number)}
                  {renderInfoRow(<Briefcase size={18} />, 'Admission Number', student?.admission_number)}
                  {renderInfoRow(<Calendar size={18} />, 'Date of Birth', formatDate(student?.date_of_birth))}
                  {renderInfoRow(<Users size={18} />, 'Gender', student?.gender)}
                  {renderInfoRow(<Heart size={18} />, 'Blood Group', student?.blood_group)}
                </div>
              </Card>

              {/* Physical Details */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-primary-600" />
                  Physical & Health Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                   {renderInfoRow(<Ruler size={18} />, 'Height (cm)', student?.height_cm)}
                   {renderInfoRow(<Weight size={18} />, 'Weight (kg)', student?.weight_kg)}
                   {renderInfoRow(<Activity size={18} />, 'Medical Conditions', student?.medical_conditions)}
                   {renderInfoRow(<Activity size={18} />, 'Allergies', student?.allergies)}
                </div>
              </Card>

              {/* Parent Details */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Users size={20} className="text-primary-600" />
                  Parent/Guardian Details
                </h3>
                {student?.parents && student.parents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {student.parents.map((parent, index) => (
                      <div key={index} className="bg-secondary-50 p-4 rounded-xl border border-secondary-100">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary-600 font-bold shadow-sm">
                            {parent.first_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-secondary-900">{parent.first_name} {parent.last_name}</p>
                            <p className="text-xs text-secondary-500 uppercase font-medium tracking-wider">
                              {parent.relationship_type || 'Parent'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-secondary-600">
                             <Phone size={14} />
                             <PhoneNumberDisplay value={parent.phone_number} className="text-secondary-600" />
                          </div>
                          <div className="flex items-center gap-2 text-secondary-600">
                             <Mail size={14} />
                             <span>{parent.email || ''}</span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary-600">
                             <Briefcase size={14} />
                             <span>{parent.occupation || ''}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary-500 italic">No parent details found.</p>
                )}
              </Card>
            </>
          )}

          {/* Employee/Teacher Specific Details */}
          {['Teacher', 'Employee', 'Admin'].includes(userRole) && (
            <>
            <Card className="p-6">
              <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-primary-600" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {renderInfoRow(<Building size={18} />, 'Department', employee?.department)}
                {renderInfoRow(<Briefcase size={18} />, 'Designation', employee?.designation)}
                {renderInfoRow(<Users size={18} />, 'Employee ID', employee?.employee_id)}
                {renderInfoRow(<Calendar size={18} />, 'Joining Date', formatDate(employee?.joining_date))}
                {renderInfoRow(<Briefcase size={18} />, 'Employment Type', employee?.employment_type)}
                {renderInfoRow(<CreditCard size={18} />, 'Salary', formatCurrency(employee?.salary))}
                {renderInfoRow(<Calendar size={18} />, 'Date of Birth', formatDate(employee?.date_of_birth))}
                {renderInfoRow(<Users size={18} />, 'Gender', employee?.gender)}
                {renderInfoRow(<Heart size={18} />, 'Blood Group', employee?.blood_group)}
                {renderInfoRow(<GraduationCap size={18} />, 'Qualification', employee?.qualification)}
                {renderInfoRow(<Users size={18} />, 'Marital Status', employee?.marital_status)}
              </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-primary-600" />
                  Physical & Health Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                   {renderInfoRow(<Ruler size={18} />, 'Height (cm)', employee?.height_cm)}
                   {renderInfoRow(<Weight size={18} />, 'Weight (kg)', employee?.weight_kg)}
                   {renderInfoRow(<Activity size={18} />, 'Medical Conditions', employee?.medical_conditions)}
                   {renderInfoRow(<Activity size={18} />, 'Allergies', employee?.allergies)}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
