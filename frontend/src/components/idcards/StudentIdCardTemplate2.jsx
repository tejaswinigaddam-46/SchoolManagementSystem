import React from 'react';
import PhoneNumberDisplay from '../ui/PhoneNumberDisplay';

const StudentIdCardTemplate2 = ({ data }) => {
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
    <div className="w-[220px] h-[360px] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 relative print:shadow-none print:border flex flex-col">
      {/* Header with Curve - Increased height to 100px */}
      <div className="bg-emerald-600 text-white p-3 text-center relative h-[100px] rounded-b-[40px]">
        <h2 className="text-sm font-bold uppercase leading-tight pt-1">{orgName}</h2>
        <p className="text-[10px] opacity-90 italic">{branch}</p>
      </div>

      {/* Photo Overlay - Lowered to top-[70px] to clear the branch name */}
      <div className="absolute top-[60px] left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
          <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-gray-100">
            {photo ? (
              <img src={photo} alt="Student" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Adjusted pt-12 to account for the photo sitting lower */}
      <div className="flex-1 px-4 pb-4 pt-20 text-center">
        <h3 className="text-base font-bold text-gray-800 mb-0.5">{data?.name || 'Student Name'}</h3>
        <p className="text-[10px] text-emerald-600 font-semibold mb-2">{academicYear}</p>

        <div className="text-[10px] space-y-1 text-left bg-emerald-50 p-2 rounded-lg border border-emerald-100">
          <div className="flex justify-between border-b border-emerald-100 pb-1">
            <span className="text-gray-500 italic">Class/Sec:</span>
            <span className="font-semibold text-gray-700">{classSection}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-100 pb-1">
            <span className="text-gray-500 italic">Roll No:</span>
            <span className="font-semibold text-gray-700">{rollNo}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-100 pb-1">
            <span className="text-gray-500 italic">DOB:</span>
            <span className="font-semibold text-gray-700">{dob}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-100 pb-1">
            <span className="text-gray-500 italic">Blood Grp:</span>
            <span className="font-bold text-red-600">{bloodGroup}</span>
          </div>
          <div className="flex justify-between border-b border-emerald-100 pb-1">
            <span className="text-gray-500 italic">Parent:</span>
            <span className="font-semibold text-gray-700 truncate max-w-[80px]">{parentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 italic shrink-0 mr-2">Phone:</span>
            <div className="font-semibold text-gray-700 overflow-hidden">
              <PhoneNumberDisplay value={phone} showFlag={true} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent */}
      <div className="bg-emerald-600 h-2 w-full"></div>
    </div>
  );
};

export default StudentIdCardTemplate2;