import React from 'react';
import PhoneNumberDisplay from '../ui/PhoneNumberDisplay';

const EmployeeIdCardTemplate2 = ({ data }) => {
  const {
    orgName = 'Organization Name',
    branch = 'Branch Name',
    photo,
    empId,
    dob,
    bloodGroup,
    department,
    doj,
    phone,
  } = data || {};

  return (
    <div className="w-[220px] h-[350px] bg-white rounded-none shadow-lg overflow-hidden border border-gray-300 relative print:shadow-none print:border flex flex-col">
      {/* Top Section - Increased height and adjusted padding */}
      <div className="h-[140px] bg-indigo-900 relative">
        <div className="absolute inset-0 bg-indigo-800 opacity-50 pattern-dots"></div>
        
        {/* Adjusted Text: Added more top padding so the photo doesn't touch the branch name */}
        <div className="relative z-10 pt-4 px-3 text-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
            {orgName}
          </h2>
          <p className="text-[10px] text-indigo-200 mt-1 italic">
            {branch}
          </p>
        </div>
        
        {/* Photo Circle - Positioned slightly lower to create breathing room */}
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
                {photo ? (
                <img src={photo} alt="Employee" className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                )}
            </div>
        </div>
      </div>

      {/* Middle Section - Increased top padding (pt-14) to accommodate the lowered photo */}
      <div className="pt-14 px-4 pb-4 flex-1 text-center bg-white">
        <h3 className="text-base font-bold text-gray-900 leading-tight">
            {data?.name || 'Employee Name'}
        </h3>
        <p className="text-xs text-indigo-600 font-semibold mb-1 uppercase">
            {department}
        </p>

        <div className="text-[10px] text-left space-y-1.5 border-t border-gray-100 pt-3">
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">ID No:</span>
                <span className="text-gray-800 font-mono font-bold">{empId}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Joined:</span>
                <span className="text-gray-800">{doj}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">DOB:</span>
                <span className="text-gray-800">{dob}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Blood:</span>
                <span className="text-red-600 font-bold">{bloodGroup}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium shrink-0 mr-2">Phone:</span>
                <div className="text-gray-800">
                    <PhoneNumberDisplay value={phone} showFlag={true} />
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-2 bg-indigo-900 w-full"></div>
    </div>
  );
};

export default EmployeeIdCardTemplate2;