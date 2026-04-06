import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import feeService from '../services/feeService';
import studentService from '../services/studentService';
import classService from '../services/classService';
import AcademicYearSelector from '../components/forms/AcademicYearSelector';
import { Search, CreditCard } from 'lucide-react';

const FeeCollectionPage = () => {
  const { user, campusId: authCampusId, defaultAcademicYearId } = useAuth();
    const campusId = authCampusId || user?.campus?.campus_id || user?.campusId;
    const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDues, setStudentDues] = useState([]);
  const [allocations, setAllocations] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Filters
  const [academicYearId, setAcademicYearId] = useState(defaultAcademicYearId || '');
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    if (defaultAcademicYearId && !academicYearId) {
      setAcademicYearId(defaultAcademicYearId);
    }
  }, [defaultAcademicYearId]);

  useEffect(() => {
    fetchClasses();
  }, [campusId]);

  const fetchClasses = async () => {
    if (!campusId) return;
    try {
      const res = await classService.getClassesByCampus(campusId);
      let classList = [];
      if (Array.isArray(res)) classList = res;
      else if (Array.isArray(res.data)) classList = res.data;
      else if (res.data?.classes && Array.isArray(res.data.classes)) classList = res.data.classes;
      setClasses(classList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    }
  };
  
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_mode: 'Cash',
    reference_number: '',
    remarks: ''
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
        if (searchTerm.length >= 1 && !selectedStudent) {
            searchStudents();
        } else if (searchTerm.length === 0) {
            setStudents([]);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, academicYearId, classId, selectedStudent]);

  const searchStudents = async () => {
      try {
          const params = { limit: 10 };
          if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
          if (academicYearId) params.academic_year_id = academicYearId;
          if (classId) params.class_id = classId;

          console.log('Searching students with params:', params);
          const res = await studentService.getAllStudents(params);
          const studentList = res.data?.students || res.students || [];
          setStudents(studentList);
          setShowDropdown(true);
      } catch (err) {
          console.error(err);
          setStudents([]);
      }
  };

  const handleManualSearch = async () => {
     if (selectedStudent) {
         fetchStudentDues(selectedStudent.username);
     } else if (searchTerm) {
         await searchStudents();
     } else {
         toast.error('Please enter a student name to search');
     }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setStudents([]); // Clear search results
    setShowDropdown(false);
    setSearchTerm(`${student.firstName} ${student.lastName}`);
    setAllocations({});
    setPaymentData(prev => ({ ...prev, amount: '' }));
    fetchStudentDues(student.username);
  };

  const fetchStudentDues = async (studentId) => {
    setLoading(true);
    try {
      const res = await feeService.getStudentDues({ student_id: studentId, campus_id: campusId });
      setStudentDues(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch dues');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    try {
      const allocationArray = Object.entries(allocations).map(([dueId, amount]) => ({
        due_id: dueId,
        amount: Number(amount)
      })).filter(a => a.amount > 0);

      await feeService.collectPayment({
        student_username: selectedStudent.username,
        total_amount_received: Number(paymentData.amount),
        payment_method: paymentData.payment_mode,
        remarks: `${paymentData.remarks} ${paymentData.reference_number ? `(Ref: ${paymentData.reference_number})` : ''}`.trim(),
        allocations: allocationArray.length > 0 ? allocationArray : undefined
      });
      toast.success('Payment collected successfully');
      setPaymentData({ amount: '', payment_mode: 'Cash', reference_number: '', remarks: '' });
      setAllocations({});
      fetchStudentDues(selectedStudent.username); // Refresh dues
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    }
  };

  const handleAllocationChange = (dueId, value, maxAmount) => {
    const val = Number(value);
    if (val < 0) return;
    
    // Allow empty string for better UX
    if (value === '') {
        setAllocations(prev => {
            const newAlloc = { ...prev };
            delete newAlloc[dueId];
            const total = Object.values(newAlloc).reduce((sum, v) => sum + v, 0);
            setPaymentData(prevData => ({ ...prevData, amount: total || '' }));
            return newAlloc;
        });
        return;
    }

    if (val > maxAmount) {
        toast.error(`Amount cannot exceed balance of ₹${maxAmount}`);
        return;
    }
    
    setAllocations(prev => {
        const newAlloc = { ...prev, [dueId]: val };
        const total = Object.values(newAlloc).reduce((sum, v) => sum + v, 0);
        setPaymentData(prevData => ({ ...prevData, amount: total }));
        return newAlloc;
    });
  };

  const handleTotalAmountChange = (e) => {
     setPaymentData({...paymentData, amount: e.target.value});
     // If user manually changes total, we could either:
     // 1. Clear allocations (waterfall mode)
     // 2. Or just warn.
     // Let's clear allocations to indicate "General Payment"
     if (Object.keys(allocations).length > 0) {
         setAllocations({});
     }
  };
  
  // Calculate total pending
  const totalPending = studentDues.reduce((sum, due) => sum + Number(due.balance_amount || 0), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Fee Collection</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Search & Student Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Select Student</h2>
            
            <div className="space-y-4 mb-6">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <AcademicYearSelector
                    campusId={campusId}
                    value={{ academic_year_id: academicYearId }}
                    onChange={(e, meta) => setAcademicYearId(meta.academicYearId)}
                    className="w-full"
                    gridClassName="grid-cols-1"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                    ))}
                  </select>
               </div>
            </div>

            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
               </div>
               <input
                 type="text"
                 placeholder="Search by name..."
                 value={searchTerm}
                 onChange={(e) => {
                   setSearchTerm(e.target.value);
                   setShowDropdown(true);
                   if (selectedStudent) setSelectedStudent(null);
                 }}
                 className="pl-10 w-full px-3 py-2 border rounded-lg"
               />
               {/* Dropdown results */}
               {showDropdown && students.length > 0 && (
                 <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                   {students.map(s => (
                     <div 
                        key={s.userId} 
                        onClick={() => handleSelectStudent(s)}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                     >
                       <p className="font-medium">{s.firstName} {s.lastName}</p>
                       <p className="text-xs text-gray-500">{s.username}</p>
                     </div>
                   ))}
                 </div>
               )}
            </div>
            
            <button 
              onClick={handleManualSearch}
              className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Search className="h-4 w-4" />
              Search & View Dues
            </button>
            
            {selectedStudent && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-900">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                <p className="text-sm text-blue-700">{selectedStudent.username}</p>
                <p className="text-sm text-blue-700 mt-1">Total Pending: <span className="font-bold">₹{totalPending}</span></p>
              </div>
            )}
          </Card>
          
          {selectedStudent && (
            <Card className="p-6">
               <h2 className="text-lg font-semibold mb-4">Collect Payment</h2>
               <form onSubmit={handlePaymentSubmit} className="space-y-4">
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                   <input
                     type="number"
                     min="1"
                     required
                     value={paymentData.amount}
                     onChange={handleTotalAmountChange}
                     className="w-full px-3 py-2 border rounded-lg font-bold text-lg"
                     placeholder="Total Amount"
                   />
                   {Object.keys(allocations).length > 0 && (
                      <p className="text-xs text-green-600 mt-1">Calculated from selected dues</p>
                   )}
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Payment Mode</label>
                   <select
                     value={paymentData.payment_mode}
                     onChange={(e) => setPaymentData({...paymentData, payment_mode: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg"
                   >
                     <option value="Cash">Cash</option>
                     <option value="Bank Transfer">Bank Transfer</option>
                     <option value="Cheque">Cheque</option>
                     <option value="Online">Online</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Reference No.</label>
                   <input
                     type="text"
                     value={paymentData.reference_number}
                     onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                   <textarea
                     value={paymentData.remarks}
                     onChange={(e) => setPaymentData({...paymentData, remarks: e.target.value})}
                     className="w-full px-3 py-2 border rounded-lg"
                     rows="2"
                   />
                 </div>
                 <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                   Process Payment
                 </button>
               </form>
            </Card>
          )}
        </div>

        {/* Right Column: Dues Details */}
        <div className="md:col-span-2">
           <Card className="p-6 h-full">
             <h2 className="text-lg font-semibold mb-4">Fee Dues Ledger</h2>
             {loading ? <LoadingSpinner /> : (
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="border-b text-left text-sm text-gray-500">
                       <th className="py-2">Fee Type</th>
                       <th className="py-2">Installment</th>
                       <th className="py-2">Due Date</th>
                       <th className="py-2 text-right">Amount</th>
                       <th className="py-2 text-right">Paid</th>
                       <th className="py-2 text-right">Balance</th>
                       <th className="py-2 w-32">Pay Amount</th>
                       <th className="py-2 text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {studentDues.map(due => (
                       <tr key={due.due_id} className="text-sm">
                         <td className="py-3 font-medium">{due.fee_type_name}</td>
                         <td className="py-3 text-gray-600">{due.installment_name}</td>
                         <td className="py-3 text-gray-600">{new Date(due.due_date).toLocaleDateString()}</td>
                         <td className="py-3 text-right">₹{Number(due.amount || 0)}</td>
                         <td className="py-3 text-right text-green-600">₹{Number(due.amount || 0) - Number(due.balance_amount || 0)}</td>
                         <td className="py-3 text-right font-bold">₹{Number(due.balance_amount || 0)}</td>
                         <td className="py-3">
                           {due.status !== 'Paid' && !due.is_paid && Number(due.balance_amount) > 0 && (
                               <div className="flex items-center gap-1">
                                   <input
                                      type="number"
                                      className="w-24 px-2 py-1 border rounded text-right"
                                      placeholder="0"
                                      min="0"
                                      max={Number(due.balance_amount || 0)}
                                      value={allocations[due.due_id] || ''}
                                      onChange={(e) => handleAllocationChange(due.due_id, e.target.value, Number(due.balance_amount || 0))}
                                   />
                               </div>
                           )}
                         </td>
                         <td className="py-3 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-xs ${
                             due.is_paid ? 'bg-green-100 text-green-700' :
                             (new Date(due.due_date) < new Date() && Number(due.balance_amount) > 0) ? 'bg-red-100 text-red-700' :
                             'bg-gray-100 text-gray-700'
                           }`}>
                             {due.is_paid ? 'Paid' : (new Date(due.due_date) < new Date() ? 'Overdue' : 'Pending')}
                           </span>
                         </td>
                       </tr>
                     ))}
                     {!selectedStudent && (
                        <tr><td colSpan="8" className="py-10 text-center text-gray-500">Select a student to view dues</td></tr>
                     )}
                     {selectedStudent && studentDues.length === 0 && (
                        <tr><td colSpan="8" className="py-10 text-center text-gray-500">No dues found for this student</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
             )}
           </Card>
        </div>
      </div>
    </div>
  );
};

export default FeeCollectionPage;
