import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import feeService from '../services/feeService';
import { studentService } from '../services/studentService';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Calendar, IndianRupee, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../config/permissions';

const StudentFeePage = () => {
  const { 
    isStudent,
    isParent,
    getUserName,
    getCampusId,
    hasPermission
  } = useAuth();
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChildUsername, setSelectedChildUsername] = useState('');

  const canViewFees = hasPermission(PERMISSIONS.FEE_STUDENT_DUES_READ);

  useEffect(() => {
    if (!canViewFees) {
      setLoading(false);
      return;
    }

    if (isStudent()) {
      fetchDues();
      return;
    }

    if (isParent()) {
      loadChildren();
      return;
    }

    setLoading(false);
  }, [canViewFees, isStudent, isParent]);
  
  const loadChildren = async () => {
    try {
      setLoading(true);
      const parentUsername = getUserName();
      if (!parentUsername) {
        toast.error('Parent username not available');
        setLoading(false);
        return;
      }

      const res = await studentService.getParentStudents(parentUsername);
      const students = res.data?.students || res.data?.data || res.students || res;
      const list = Array.isArray(students) ? students : [];
      setChildren(list);

      if (list.length > 0) {
        const first = list[0];
        setSelectedChildUsername(first.username);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load children list');
    } finally {
      setLoading(false);
    }
  };

  const fetchDues = async (overrideStudentUsername = null) => {
    try {
      setLoading(true);
      // If user is student, fetch their dues. 
      // Note: This assumes the API infers student_id from token if not provided, 
      // OR we need to pass it. The controller uses req.query.student_id.
      // If the user is a student, we should pass their ID.
      // If the user is Admin/Teacher viewing this page, they should probably be redirected or see a selector (not handled here).
      
      const filters = {};
      if (isStudent()) {
        const username = getUserName();
        if (!username) {
          toast.error('Student username not available');
          return;
        }
        filters.student_id = username;
      } else if (isParent()) {
        const targetUsername = overrideStudentUsername || selectedChildUsername;
        if (!targetUsername) {
          toast.error('Please select a child to view fees');
          return;
        }
        filters.student_id = targetUsername;
      }
      const campusId = getCampusId();
      if (campusId) {
        filters.campus_id = campusId;
      }
      
      const res = await feeService.getStudentDues(filters);
      setDues(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load fee dues');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50 border-green-200';
      case 'Partial': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Overdue': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircle size={16} />;
      case 'Overdue': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  useEffect(() => {
    if (isParent() && selectedChildUsername) {
      fetchDues(selectedChildUsername);
    }
  }, [isParent, selectedChildUsername]);

  if (loading) return <LoadingSpinner />;

  if (!canViewFees || (!isStudent() && !isParent())) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">My Fee Ledger</h1>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
          You do not have access to view this fee ledger.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Fee Ledger</h1>

      {isParent() && (
        <div className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="font-medium text-gray-700">Select Child:</span>
          <select
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={selectedChildUsername}
            onChange={(e) => setSelectedChildUsername(e.target.value)}
          >
            {children.map((child) => (
              <option key={child.username} value={child.username}>
                {child.fullName || `${child.firstName} ${child.lastName}` || child.username}
              </option>
            ))}
            {children.length === 0 && (
              <option value="">No linked students found</option>
            )}
          </select>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {dues.map((due) => (
          <Card key={due.student_fee_id} className="p-5 border-l-4 border-l-primary-500">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{due.fee_type_name}</h3>
                <p className="text-sm text-gray-500">{due.installment_name}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(due.status)}`}>
                {getStatusIcon(due.status)}
                {due.status}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Due:</span>
                <span className="font-medium">${due.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid Amount:</span>
                <span className="font-medium text-green-600">${due.paid_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remaining:</span>
                <span className="font-bold text-primary-600">${due.amount - due.paid_amount}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar size={14} /> Due Date:
                </span>
                <span>{new Date(due.due_date).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        ))}
        
        {dues.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
            No fee dues found.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeePage;
