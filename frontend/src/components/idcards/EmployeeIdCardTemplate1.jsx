import React from 'react';
import PhoneNumberDisplay from '../ui/PhoneNumberDisplay';

const EmployeeIdCardTemplate1 = ({ data }) => {
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
    <div className="w-[350px] h-[220px] bg-slate-50 rounded-lg shadow-lg overflow-hidden border border-slate-300 relative print:shadow-none print:border">
      {/* Sidebar Stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-6 bg-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
        <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
        <div className="text-white -rotate-90 text-[10px] tracking-widest font-bold whitespace-nowrap w-4 h-24 flex items-center justify-center">STAFF</div>
        <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
        <div className="w-1 h-1 bg-white rounded-full opacity-50"></div>
      </div>

      <div className="ml-6 p-4 h-full flex flex-col">
        {/* Header */}
        <div className="border-b-2 border-slate-200 pb-2 mb-2">
          <h2 className="text-base font-bold text-slate-800 uppercase leading-none">{orgName}</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">{branch}</p>
        </div>

        <div className="flex gap-4 flex-1">
          {/* Photo */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-20 h-24 bg-slate-200 rounded overflow-hidden shadow-inner">
              {photo ? (
                <img src={photo} alt="Employee" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              {data?.designation || 'Employee'}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-1.5 pt-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{data?.name || 'Employee Name'}</h3>
              <p className="text-[10px] text-slate-500 font-medium">{department}</p>
            </div>
            
            <div className="text-[10px] space-y-1 pt-1">
              <div className="flex">
                <span className="w-16 text-slate-500 font-medium">Emp ID:</span>
                <span className="text-slate-800 font-mono font-bold">{empId}</span>
              </div>
              <div className="flex">
                <span className="w-16 text-slate-500 font-medium">DOB:</span>
                <span className="text-slate-800">{dob}</span>
              </div>
              <div className="flex">
                <span className="w-16 text-slate-500 font-medium">Blood Grp:</span>
                <span className="text-red-700 font-bold">{bloodGroup}</span>
              </div>
              <div className="flex">
                <span className="w-16 text-slate-500 font-medium">DOJ:</span>
                <span className="text-slate-800">{doj}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 text-slate-500 font-medium shrink-0">Phone:</span>
                <div className="text-slate-800">
                  <PhoneNumberDisplay value={phone} showFlag={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeIdCardTemplate1;
