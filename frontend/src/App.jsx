import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PERMISSIONS } from './config/permissions';

// Layout components test
import Layout from './components/layout/Layout';
import LoginAuthLayout from './components/layout/LoginAuthLayout';

// Page components
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MobileLogin from './pages/MobileLogin';
import TenantRegistration from './pages/TenantRegistration';
// Error boundary and loading components
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import CampusManagementPage from './pages/CampusManagementPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import AcademicManagementPage from './pages/AcademicManagementPage';
import SubjectManagementPage from './pages/SubjectManagementPage';
import AcademicsSelectionPage from './pages/AcademicsSelectionPage';
import ClassManagementPage from './pages/ClassManagementPage';
import BuildingManagementPage from './pages/BuildingManagementPage';
import CampusRoomsManagementPage from './pages/CampusRoomsManagementPage';
import SectionManagementPage from './pages/SectionManagementPage';
import StudentsToSectionPage from './pages/StudentsToSectionPage';
import EmployeeManagementPage from './pages/EmployeeManagementPage';
import TeacherToSectionPage from './pages/TeacherToSectionPage';
import TimetablePage from './pages/TimetablePage';
import CalendarEventsPage from './pages/CalendarEventsPage';
import AttendancePage from './pages/AttendancePage';
import AttendanceEntryPage from './pages/AttendanceEntryPage';
import UserAttendancePage from './pages/UserAttendancePage';
import ConsolidatedAttendancePage from './pages/ConsolidatedAttendancePage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import HolidayPage from './pages/HolidayPage';
import SpecialWorkingDaysPage from './pages/SpecialWorkingDaysPage';
import WeekendPolicyPage from './pages/WeekendPolicyPage';
import PayrollPage from './pages/PayrollPage';
import FeesDashboardPage from './pages/FeesDashboardPage';
import FeeConfigurationPage from './pages/FeeConfigurationPage';
import FeeCollectionPage from './pages/FeeCollectionPage';
import StudentFeePage from './pages/StudentFeePage';
import ExamsPage from './pages/ExamsPage';
import IdCardGeneratorPage from './pages/IdCardGeneratorPage';
import ProfilePage from './pages/ProfilePage';
import MyAttendancePage from './pages/MyAttendancePage';
import MyPayrollPage from './pages/MyPayrollPage';
import PayrollDashboardPage from './pages/PayrollDashboardPage';

// Landing Page
import LandingPage from './components/landing/LandingPage';

function App() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  console.log('🔍 App Debug:', {
    user,
    isAuthenticated,
    authLoading,
    pathname: window.location.pathname,
    href: window.location.href,
  });

  // Show loading spinner while initializing
  if (authLoading) {
    console.log('⏳ Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-secondary-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LayoutProvider>
        <div className="min-h-screen bg-secondary-50">
          <Routes>
            {/* Public Landing Page Route */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/home" replace />
                ) : (
                  <LandingPage />
                )
              }
            />

            {/* Public routes */}
            <Route
              path="/mobile-login"
              element={
                isAuthenticated ? (
                  <Navigate to="/home" replace />
                ) : (
                  <MobileLogin />
                )
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/home" replace />
                ) : (
                  <LoginAuthLayout>
                    {' '}
                    <Login />{' '}
                  </LoginAuthLayout>
                )
              }
            />

            {/* Registration route */}
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to="/home" replace />
                ) : (
                  <TenantRegistration />
                )
              }
            />

            {/* Protected routes - wrap individual routes with ProtectedRoute */}
            <Route
              element={
                <ProtectedRoute>
                  {' '}
                  <Layout />{' '}
                </ProtectedRoute>
              }
            >
              {/* Child routes that will render inside Layout's <Outlet /> */}
              <Route path="home" element={<Home />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="campus"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.CAMPUS_LIST_READ]}
                  >
                    <CampusManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.STUDENT_LIST_READ]}
                  >
                    <StudentManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="students/:studentId"
                element={<StudentDetailsPage />}
              />
              <Route
                path="id-cards"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.ID_CARD_MANAGE]}
                  >
                    <IdCardGeneratorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.ACADEMIC_CURRICULA_LIST_READ,
                    ]}
                  >
                    <AcademicsSelectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/setup"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.ACADEMIC_CURRICULA_LIST_READ,
                    ]}
                  >
                    <AcademicManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/subjects"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.SUBJECT_LIST_READ]}
                  >
                    <SubjectManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/classes"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.CLASS_LIST_READ]}
                  >
                    <ClassManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/buildings"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.BUILDING_LIST_READ]}
                  >
                    <BuildingManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/campusrooms"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.ROOM_LIST_READ]}
                  >
                    <CampusRoomsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/classsections"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.SECTION_LIST_READ]}
                  >
                    <SectionManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/students-to-section"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.STUDENT_BY_FILTERS_READ,
                      PERMISSIONS.STUDENT_LIST_READ,
                    ]}
                  >
                    <StudentsToSectionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="academics/teachers-to-section"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.SECTION_SUBJECT_LIST_READ,
                      PERMISSIONS.SECTION_LIST_READ,
                    ]}
                  >
                    <TeacherToSectionPage />
                  </ProtectedRoute>
                }
              />
              <Route path="timetable" element={<TimetablePage />} />
              <Route
                path="calendar-events"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.EVENT_LIST_READ]}
                  >
                    <CalendarEventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.ATTENDANCE_LIST_READ]}
                  >
                    <AttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance/entry"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.ATTENDANCE_SAVE_CREATE]}
                  >
                    <AttendanceEntryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance/user"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.USER_ATTENDANCE_DAILY_READ,
                    ]}
                  >
                    <UserAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance/consolidated"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.CONSOLIDATED_ATTENDANCE_DAILY_READ,
                    ]}
                  >
                    <ConsolidatedAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="attendance/my-attendance"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.MY_ATTENDANCE_READ]}
                  >
                    <MyAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.EMPLOYEE_LIST_READ]}
                  >
                    <EmployeeManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="leave-management"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.LEAVE_MY_LIST_READ,
                      PERMISSIONS.LEAVE_PENDING_LIST_READ,
                    ]}
                  >
                    <LeaveManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="holidays"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.HOLIDAY_LIST_READ]}
                  >
                    <HolidayPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="special-working-days"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.SPECIAL_WORKING_DAY_LIST_READ,
                    ]}
                  >
                    <SpecialWorkingDaysPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="weekend-policies"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.WEEKEND_POLICY_LIST_READ]}
                  >
                    <WeekendPolicyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.PAYROLL_REPORT_READ,
                      PERMISSIONS.MY_PAYROLL_READ,
                    ]}
                  >
                    <PayrollDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll/employee"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.PAYROLL_REPORT_READ]}
                  >
                    <PayrollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payroll/my"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.MY_PAYROLL_READ]}
                  >
                    <MyPayrollPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="exams"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.EXAM_LIST_READ]}
                  >
                    <ExamsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fees"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.FEE_STUDENT_DUES_READ]}
                  >
                    <FeesDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fees/configuration"
                element={
                  <ProtectedRoute
                    requiredPermissions={[PERMISSIONS.FEE_STRUCTURE_LIST_READ]}
                  >
                    <FeeConfigurationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="fees/collection"
                element={
                  <ProtectedRoute
                    requiredPermissions={[
                      PERMISSIONS.FEE_PAYMENTS_COLLECT_CREATE,
                    ]}
                  >
                    <FeeCollectionPage />
                  </ProtectedRoute>
                }
              />
              <Route path="fees/my-fees" element={<StudentFeePage />} />
            </Route>

            {/* Catch-all handler for unmatched routes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </LayoutProvider>
    </ErrorBoundary>
  );
}

export default App;
