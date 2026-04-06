import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';
import { useReactToPrint } from 'react-to-print';
import { Printer, Download, User, Users, CreditCard } from 'lucide-react';
import StudentIdCardTemplate1 from '../components/idcards/StudentIdCardTemplate1';
import StudentIdCardTemplate2 from '../components/idcards/StudentIdCardTemplate2';
import EmployeeIdCardTemplate1 from '../components/idcards/EmployeeIdCardTemplate1';
import EmployeeIdCardTemplate2 from '../components/idcards/EmployeeIdCardTemplate2';
import Card from '../components/ui/Card';
import PhoneInput from '../components/ui/PhoneInput';

const IdCardGeneratorPage = () => {
  const { getTenantName, getCampusName, getCampusId, getDefaultAcademicYearId } = useAuth();
  const [activeTab, setActiveTab] = useState('student');
  const [selectedTemplate, setSelectedTemplate] = useState(1);

  // Refs for printing
  const studentCardRef = useRef();
  const employeeCardRef = useRef();

  useEffect(() => {
    const fetchDynamicValues = async () => {
      const orgName = getTenantName() || 'SPRINGFIELD HIGH SCHOOL';
      const branch = getCampusName() || 'Main Campus';
      const campusId = getCampusId();
      const academicYearId = getDefaultAcademicYearId();

      let academicYear = '2025-2026';

      if (campusId && academicYearId) {
        try {
          const response = await academicService.getAcademicYearById(campusId, academicYearId);
          if (response && response.name) {
            academicYear = response.name;
          }
        } catch (error) {
          console.error('Error fetching academic year:', error);
        }
      }

      setStudentData(prev => ({
        ...prev,
        orgName,
        branch,
        academicYear
      }));

      setEmployeeData(prev => ({
        ...prev,
        orgName,
        branch,
        academicYear
      }));
    };

    fetchDynamicValues();
  }, [getTenantName, getCampusName, getCampusId, getDefaultAcademicYearId]);

  const [studentData, setStudentData] = useState({
    orgName: 'SPRINGFIELD HIGH SCHOOL',
    branch: 'Main Campus',
    name: 'John Doe',
    academicYear: '2025-2026',
    dob: '2010-05-15',
    classSection: '10/A',
    rollNo: 'S-2025-001',
    bloodGroup: 'O+',
    parentName: 'Robert Doe',
    phone: '+919876543210',
    photo: null
  });

  const [employeeData, setEmployeeData] = useState({
    orgName: 'SPRINGFIELD HIGH SCHOOL',
    branch: 'Main Campus',
    name: 'Jane Smith',
    empId: 'EMP-0056',
    dob: '1985-08-20',
    bloodGroup: 'A+',
    department: 'Mathematics',
    doj: '2018-06-01',
    phone: '+919123456780',
    designation: 'Senior Teacher',
    photo: null
  });

  const handleStudentChange = (e) => {
    const { name, value } = e.target;
    setStudentData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmployeeChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'student') {
          setStudentData(prev => ({ ...prev, photo: reader.result }));
        } else {
          setEmployeeData(prev => ({ ...prev, photo: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area');
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print ID Card</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                justify-content: center;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page { size: auto; margin: 0mm; }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const renderTemplate = () => {
    if (activeTab === 'student') {
      if (selectedTemplate === 1) return <StudentIdCardTemplate1 data={studentData} />;
      if (selectedTemplate === 2) return <StudentIdCardTemplate2 data={studentData} />;
    } else {
      if (selectedTemplate === 1) return <EmployeeIdCardTemplate1 data={employeeData} />;
      if (selectedTemplate === 2) return <EmployeeIdCardTemplate2 data={employeeData} />;
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">ID Card Generator</h1>
        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={18} />
            <span>Print Card</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-0 overflow-hidden">
            <div className="flex border-b">
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === 'student' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('student')}
              >
                <Users size={18} />
                Student ID
              </button>
              <button
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === 'employee' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('employee')}
              >
                <User size={18} />
                Employee ID
              </button>
            </div>

            <div className="p-6">
              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                <div className="flex gap-4">
                  <div
                    onClick={() => setSelectedTemplate(1)}
                    className={`cursor-pointer border-2 rounded-lg p-3 w-32 text-center transition-all ${
                      selectedTemplate === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="h-16 bg-gray-200 rounded mb-2 mx-auto w-24"></div>
                    <span className="text-sm font-medium">Landscape</span>
                  </div>
                  <div
                    onClick={() => setSelectedTemplate(2)}
                    className={`cursor-pointer border-2 rounded-lg p-3 w-32 text-center transition-all ${
                      selectedTemplate === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="h-16 bg-gray-200 rounded mb-2 mx-auto w-10"></div>
                    <span className="text-sm font-medium">Portrait</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'student' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                      <input
                        type="text"
                        name="orgName"
                        value={studentData.orgName}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                      <input
                        type="text"
                        name="branch"
                        value={studentData.branch}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                      <input
                        type="text"
                        name="name"
                        value={studentData.name}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <input
                        type="text"
                        name="academicYear"
                        value={studentData.academicYear}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class/Section</label>
                      <input
                        type="text"
                        name="classSection"
                        value={studentData.classSection}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roll No</label>
                      <input
                        type="text"
                        name="rollNo"
                        value={studentData.rollNo}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={studentData.dob}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                      <select
                        name="bloodGroup"
                        value={studentData.bloodGroup}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                      <input
                        type="text"
                        name="parentName"
                        value={studentData.parentName}
                        onChange={handleStudentChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <PhoneInput
                        label="Phone Number"
                        name="phone"
                        value={studentData.phone}
                        onChange={handleStudentChange}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'student')}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                      <input
                        type="text"
                        name="orgName"
                        value={employeeData.orgName}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                      <input
                        type="text"
                        name="branch"
                        value={employeeData.branch}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                      <input
                        type="text"
                        name="name"
                        value={employeeData.name}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        name="empId"
                        value={employeeData.empId}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={employeeData.department}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        name="designation"
                        value={employeeData.designation}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={employeeData.dob}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                      <input
                        type="date"
                        name="doj"
                        value={employeeData.doj}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                      <select
                        name="bloodGroup"
                        value={employeeData.bloodGroup}
                        onChange={handleEmployeeChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <PhoneInput
                        label="Phone Number"
                        name="phone"
                        value={employeeData.phone}
                        onChange={handleEmployeeChange}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e, 'employee')}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">Live Preview</h2>
              <p className="text-sm text-gray-500">See how your ID card looks</p>
            </div>
            <div className="p-6 flex flex-col items-center justify-center min-h-[400px] bg-gray-50">
              <div id="print-area" className="transform scale-90 sm:scale-100 transition-transform origin-top">
                {renderTemplate()}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IdCardGeneratorPage;
