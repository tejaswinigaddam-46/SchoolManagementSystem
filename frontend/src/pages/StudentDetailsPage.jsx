import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import PhoneNumberDisplay from '../components/ui/PhoneNumberDisplay';

const FieldRow = ({ label, value }) => (
  <div className="mb-2 flex items-center">
    <span className="font-medium text-gray-700 mr-2">{label}:</span>
    <div className="text-gray-900">{value || '-'}</div>
  </div>
);

const StudentDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const student = location.state?.student;

  if (!student) {
    return (
      <div className="p-8 text-center text-gray-500">
        No student data found. <button className="text-blue-600 underline" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Student Details</h2>
              <button onClick={() => navigate(-1)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Back</button>
            </div>
            <div className="grid grid-cols-6 gap-6">
              {/* Section 1: Basic Information */}
              <div className="col-span-6 border-b pb-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Basic Information</h3>
                <div className="grid grid-cols-6 gap-3">
                  <FieldRow label="Admission Number" value={student.admissionNumber} />
                  <FieldRow label="First Name" value={student.firstName} />
                  <FieldRow label="Middle Name" value={student.middleName} />
                  <FieldRow label="Last Name" value={student.lastName} />
                  <FieldRow label="Date of Birth" value={student.dateOfBirth} />
                  <FieldRow label="Gender" value={student.gender} />
                </div>
              </div>
              {/* Section 2: Academic Information */}
              <div className="col-span-6 border-b pb-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Academic Information</h3>
                <div className="grid grid-cols-6 gap-3">
                  <FieldRow label="Class" value={student.enrollment?.class_name || student.enrollment?.class} />
                  <FieldRow label="Section" value={student.enrollment?.section_name || student.enrollment?.section} />
                  <FieldRow label="Roll Number" value={student.enrollment?.roll_number || student.enrollment?.rollNumber} />
                  <FieldRow label="Registration No." value={student.registrationNumber} />
                  <FieldRow label="Academic Year" value={student.enrollment?.academicYear} />
                  <FieldRow label="Admission Date" value={student.admissionDate} />
                </div>
                <div className="grid grid-cols-6 gap-3 mt-3">
                  <FieldRow label="Transport Details" value={student.enrollment?.transport_details || student.enrollment?.transportDetails} />
                  <FieldRow label="Hostel Details" value={student.enrollment?.hostel_details || student.enrollment?.hostelDetails} />
                </div>
                <div className="grid grid-cols-6 gap-3 mt-3">
                  <FieldRow label="Admission Type" value={student.admissionType} />
                  <FieldRow label="Previous School" value={student.previousSchool} />
                  <FieldRow label="TC Number" value={student.transferCertificateNumber} />
                  <FieldRow label="Transport Mode" value={student.transportMode} />
                  <FieldRow label="Hostel Required" value={student.hostelRequired} />
                </div>
              </div>
              {/* Section 3: Personal Details */}
              <div className="col-span-6 border-b pb-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Personal Details</h3>
                <div className="grid grid-cols-6 gap-3">
                  <FieldRow label="Nationality" value={student.nationality} />
                  <FieldRow label="Religion" value={student.religion} />
                  <FieldRow label="Caste" value={student.caste} />
                  <FieldRow label="Category" value={student.category} />
                  <FieldRow label="Blood Group" value={student.bloodGroup} />
                  <FieldRow label="Height (cm)" value={student.height} />
                </div>
                <div className="grid grid-cols-6 gap-3 mt-3">
                  <FieldRow label="Weight (kg)" value={student.weight} />
                  <FieldRow label="Medical Conditions" value={student.medicalConditions} />
                  <FieldRow label="Allergies" value={student.allergies} />
                  <FieldRow label="Scholarship Applied" value={student.scholarshipApplied} />
                </div>
              </div>
              {/* Section 4: Contact Information */}
              <div className="col-span-6 border-b pb-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact Information</h3>
                <div className="grid grid-cols-6 gap-3">
                  <FieldRow label="Email" value={student.email} />
                  <FieldRow 
                    label="Phone Number" 
                    value={
                      <PhoneNumberDisplay 
                        value={student.phoneNumber ? student.phoneNumber : (student.parents?.find(p => p.isEmergency)?.phone || 'Contact Admin')} 
                      />
                    } 
                  />
                  <FieldRow 
                    label="Alternate Phone" 
                    value={<PhoneNumberDisplay value={student.alternatePhoneNumber} />} 
                  />
                  <FieldRow label="City" value={student.city} />
                  <FieldRow label="State" value={student.state} />
                  <FieldRow label="Pin Code" value={student.pincode} />
                </div>
                <div className="grid grid-cols-6 gap-3 mt-3">
                  <FieldRow label="Country" value={student.country} />
                  <FieldRow label="Current Address" value={student.currentAddress} />
                  <FieldRow label="Permanent Address" value={student.permanentAddress} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDetailsPage;
