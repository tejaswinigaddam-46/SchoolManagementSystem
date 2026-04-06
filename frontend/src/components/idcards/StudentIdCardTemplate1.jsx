import React from 'react';
import PhoneNumberDisplay from '../ui/PhoneNumberDisplay';

const StudentIdCardTemplate1 = ({ data }) => {
  const {
    orgName = 'Organization Name',
    branch = 'Branch Name',
    photo,
    academicYear = '2025-2026',
    dob,
    classSection,
    rollNo,
    bloodGroup,
    parentName,
    phone,
  } = data || {};

  return (
    <div className="w-[350px] h-[220px] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 relative print:shadow-none print:border">
      {/* Header */}
      <div className="bg-blue-600 text-white p-2 text-center h-[50px]">
        <h2 className="text-sm font-bold uppercase leading-tight truncate">{orgName}</h2>
        <p className="text-xs opacity-90 truncate">{branch}</p>
      </div>

      <div className="flex p-3 gap-3 h-[170px]">
        {/* Left Column: Photo */}
        <div className="w-1/3 flex flex-col items-center justify-start pt-1">
          <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden border-2 border-blue-100 mb-2">
            {photo ? (
              <img src={photo} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="text-[10px] text-center font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
            Student
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="w-2/3 text-[10px] leading-tight space-y-1 pt-1">
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Name:</span>
            <span className="font-bold text-gray-800 col-span-2 truncate">{data?.name || 'Student Name'}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Class/Sec:</span>
            <span className="text-gray-800 col-span-2">{classSection}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Roll No:</span>
            <span className="text-gray-800 col-span-2">{rollNo}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">DOB:</span>
            <span className="text-gray-800 col-span-2">{dob}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Blood Grp:</span>
            <span className="text-gray-800 col-span-2 text-red-600 font-bold">{bloodGroup}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Parent:</span>
            <span className="text-gray-800 col-span-2 truncate">{parentName}</span>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Phone:</span>
            <div className="col-span-2 text-gray-800">
              <PhoneNumberDisplay value={phone} showFlag={true} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0.5">
            <span className="font-semibold text-gray-600 col-span-1">Year:</span>
            <span className="text-gray-800 col-span-2">{academicYear}</span>
          </div>
        </div>
      </div>
      
      {/* Footer stripe */}
      <div className="absolute bottom-0 w-full h-1 bg-blue-600"></div>
    </div>
  );
};

export default StudentIdCardTemplate1;
