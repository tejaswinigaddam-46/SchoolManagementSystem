import React, { useState, useEffect } from 'react';
import feeService from '../services/feeService';
import LoadingSpinner from './ui/LoadingSpinner';

const ConsolidatedDuesList = ({ campusId, academicYearId, classId }) => {
  const [loading, setLoading] = useState(false);
  const [processedData, setProcessedData] = useState([]);
  const [feeTypes, setFeeTypes] = useState(new Set());

  useEffect(() => {
    if (campusId && academicYearId && classId) {
      fetchDues();
    } else {
        setProcessedData([]);
        setFeeTypes(new Set());
    }
  }, [campusId, academicYearId, classId]);

  const fetchDues = async () => {
    if (!academicYearId || !classId) return;
    
    setLoading(true);
    try {
      const res = await feeService.getStudentDues({
        campus_id: campusId,
        academic_year_id: academicYearId,
        class_id: classId
      });
      
      processData(res.data || res);
    } catch (err) {
      console.error('Failed to fetch dues', err);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data) => {
    if (!Array.isArray(data)) return;

    // 1. Identify all unique fee types
    const types = new Set();
    data.forEach(d => types.add(d.fee_type_name));
    setFeeTypes(types);

    // 2. Group by student
    const studentMap = {};
    
    data.forEach(d => {
      if (!studentMap[d.student_id]) {
        studentMap[d.student_id] = {
          student_id: d.student_id,
          student_name: d.student_name,
          admission_number: d.admission_number,
          username: d.username,
          total_due: 0,
          fee_details: {} 
        };
      }
      
      const student = studentMap[d.student_id];
      const key = d.fee_type_name;
      
      if (!student.fee_details[key]) {
        student.fee_details[key] = [];
      }
      
      student.fee_details[key].push({
        due_date: d.due_date,
        amount: d.amount,
        balance: d.balance_amount,
        status: d.is_paid ? 'Paid' : (d.balance_amount > 0 ? 'Pending' : 'Cleared')
      });

      if (!d.is_paid) {
        student.total_due += Number(d.balance_amount);
      }
    });

    setProcessedData(Object.values(studentMap));
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-8">
            <LoadingSpinner />
        </div>
      ) : processedData.length > 0 ? (
        <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 border-b">Student Name</th>
                <th className="px-4 py-3 border-b">Admission No</th>
                {[...feeTypes].sort().map(type => (
                  <th key={type} className="px-4 py-3 border-b">{type}</th>
                ))}
                <th className="px-4 py-3 border-b text-right">Total Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {processedData.map(student => (
                <tr key={student.student_id} className="hover:bg-gray-50 bg-white">
                  <td className="px-4 py-3 font-medium">{student.student_name}</td>
                  <td className="px-4 py-3 text-gray-500">{student.admission_number}</td>
                  {[...feeTypes].sort().map(type => {
                    const details = student.fee_details[type];
                    return (
                      <td key={type} className="px-4 py-3 min-w-[200px] border-l border-gray-100">
                        {details ? (
                          <div className="space-y-1">
                            {details.map((d, i) => (
                              <div key={i} className="text-xs">
                                <span className={d.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                  Due: {new Date(d.due_date).toLocaleDateString()}
                                </span>
                                {d.balance > 0 && <span className="ml-1 text-gray-500">(₹{d.balance})</span>}
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-gray-300 text-xs">-</span>}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right font-bold text-red-600 border-l border-gray-100">
                    ₹{student.total_due.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
         <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
           {!academicYearId || !classId ? 'Please select Academic Year and Class above to view consolidated dues.' : 'No dues found for the selected criteria.'}
        </div>
      )}
    </div>
  );
};

export default ConsolidatedDuesList;
