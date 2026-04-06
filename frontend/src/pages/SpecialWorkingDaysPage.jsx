import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';
import { specialWorkingDayService } from '../services/specialWorkingDayService';
import { holidayService } from '../services/holidayService';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AcademicYearSelector from '../components/forms/AcademicYearSelector';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { Calendar, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../config/permissions';

const SpecialWorkingDaysPage = () => {
  const { user, hasPermission, getCampusId } = useAuth();
  const canCreateOrUpdateSpecialDay =
    hasPermission && hasPermission(PERMISSIONS.SPECIAL_WORKING_DAY_CREATE);
  const canDeleteSpecialDay =
    hasPermission && hasPermission(PERMISSIONS.SPECIAL_WORKING_DAY_DELETE);
  const campusId = getCampusId();
  const formRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialDays, setSpecialDays] = useState([]);
  
  // Filter State
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0] 
  });

  // Admin Form State
  const [formData, setFormData] = useState({
    workDate: '',
    description: ''
  });
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [academicYearSelectorValue, setAcademicYearSelectorValue] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Conflict Confirmation Dialog State
  const [conflictDialog, setConflictDialog] = useState({
    isOpen: false,
    payload: null,
    isEdit: false
  });

  // Initial Data Fetching
  useEffect(() => {
    if (campusId) {
      fetchData();
    }
  }, [campusId]); // Initial load

  const fetchData = async () => {
    try {
      setLoading(true);
      await fetchSpecialDays();
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: 'error', text: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialDays = async () => {
    try {
      const filters = {
        startDate: dateRange.start,
        endDate: dateRange.end
      };
      
      const res = await specialWorkingDayService.getAll(campusId, filters);
      setSpecialDays(res.data || res || []);
    } catch (error) {
      console.error("Error fetching special days:", error);
      // Don't overwrite error message from fetchData if it failed there
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchSpecialDays();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAcademicYearChange = (e, validation) => {
    setAcademicYearSelectorValue(e.target.value);
    if (validation && validation.isValid && validation.academicYearId) {
      setSelectedAcademicYearId(validation.academicYearId);
    } else {
      setSelectedAcademicYearId(null);
    }
  };

  const handleEdit = async (day) => {
    setEditingId(day.id);
    setFormData({
      workDate: day.work_date.split('T')[0],
      description: day.description
    });
    
    // Handle academic year population for edit
    if (day.academic_year_ids && day.academic_year_ids.length > 0) {
       const acadYearId = day.academic_year_ids[0];
       try {
           const res = await academicService.getAcademicYearById(campusId, acadYearId);
           const ay = res.data || res;
           
           if (ay) {
               setAcademicYearSelectorValue({
                   year_name: ay.year_name,
                   year_type: ay.year_type,
                   curriculum_id: ay.curriculum_id,
                   medium: ay.medium,
                   academic_year_id: ay.academic_year_id
               });
               setSelectedAcademicYearId(ay.academic_year_id);
           }
       } catch (err) {
           console.error("Error fetching academic year details for edit:", err);
           toast.error("Could not load academic year details");
       }
    } else {
        setAcademicYearSelectorValue(null);
        setSelectedAcademicYearId(null);
    }

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ workDate: '', description: '' });
    setSelectedAcademicYearId(null);
    setAcademicYearSelectorValue(null);
  };
  
  const proceedWithSave = async (payload, isEdit) => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      if (isEdit) {
        await specialWorkingDayService.update(campusId, editingId, payload);
        setMessage({ type: 'success', text: 'Special working day updated successfully!' });
        toast.success('Special working day updated successfully');
      } else {
        await specialWorkingDayService.create(campusId, payload);
        setMessage({ type: 'success', text: 'Special working day created successfully!' });
        toast.success('Special working day created successfully');
      }
      
      setFormData({ workDate: '', description: '' });
      setSelectedAcademicYearId(null);
      setAcademicYearSelectorValue(null);
      setEditingId(null);
      setConflictDialog({ isOpen: false, payload: null, isEdit: false });
      fetchSpecialDays();

    } catch (error) {
      console.error("Error saving special day:", error);
      setMessage({ type: 'error', text: error.message || 'Failed to save special working day.' });
      toast.error(error.message || 'Failed to save special working day');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workDate || !formData.description || !selectedAcademicYearId) {
      setMessage({ type: 'error', text: 'Please fill all required fields and select a valid academic year.' });
      return;
    }

    const payload = {
        work_date: formData.workDate,
        description: formData.description,
        academic_year_ids: [selectedAcademicYearId]
    };

    // Check for conflicts with Holidays
    try {
        setSaving(true);
        // Fetch holidays that might overlap with the selected date
        // Since getHolidays usually fetches a range or all, let's fetch for the specific date if possible,
        // or just fetch all and filter client side if the list isn't huge.
        // Or better, use the existing filters support in getHolidays.
        const holidaysRes = await holidayService.getHolidays(campusId, { startDate: formData.workDate, endDate: formData.workDate });
        const holidays = holidaysRes.data || holidaysRes || [];

        const conflict = holidays.some(h => {
            // Check Date Overlap (already filtered by API hopefully, but double check)
            const hStart = new Date(h.start_date).setHours(0,0,0,0);
            const hEnd = new Date(h.end_date || h.start_date).setHours(0,0,0,0);
            const wDate = new Date(formData.workDate).setHours(0,0,0,0);
            
            if (wDate < hStart || wDate > hEnd) return false;

            // Check Academic Year Overlap
            // Holiday applies if:
            // 1. It has no academic_year_ids (Global)
            // 2. It has academic_year_ids and includes the selected one
            // Special Working Day applies if:
            // 1. We selected an academic year (required here)
            
            const holidayAcademicYears = h.academic_year_ids || [];
            const isGlobalHoliday = holidayAcademicYears.length === 0;
            
            if (isGlobalHoliday) return true; // Global holiday conflicts with any specific working day
            
            return holidayAcademicYears.includes(selectedAcademicYearId);
        });

        if (conflict) {
            setConflictDialog({
                isOpen: true,
                payload,
                isEdit: !!editingId
            });
            setSaving(false);
            return;
        }

        // No conflict, proceed
        proceedWithSave(payload, !!editingId);

    } catch (err) {
        console.error("Error checking conflicts:", err);
        // On error checking, maybe warn or just proceed? Let's proceed but log.
        // Or better, show error.
        toast.error("Failed to validate conflicts. Please try again.");
        setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this special working day?')) return;
    
    try {
      setLoading(true);
      await specialWorkingDayService.delete(campusId, id);
      setMessage({ type: 'success', text: 'Special working day deleted successfully!' });
      toast.success('Special working day deleted successfully');
      fetchSpecialDays();
    } catch (error) {
      console.error("Error deleting special day:", error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete special working day.' });
      toast.error(error.message || 'Failed to delete special working day');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Special Working Days Management
        </h1>
      </div>

      <ConfirmationDialog
        isOpen={conflictDialog.isOpen}
        onClose={() => setConflictDialog({ isOpen: false, payload: null, isEdit: false })}
        onConfirm={() => proceedWithSave(conflictDialog.payload, conflictDialog.isEdit)}
        title="Holiday Conflict"
        message="It is holiday for same day and same academic year do you still need to add it anyways?"
        confirmText="Yes, Add Anyway"
        cancelText="Cancel"
        variant="warning"
      />

      {message.text && (
        <div className={`p-4 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}

      {/* ADD/EDIT FORM */}
      {canCreateOrUpdateSpecialDay && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Special Working Day' : 'Add New Special Working Day'}</h2>
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="workDate"
                  value={formData.workDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Annual Function"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
              <div className="w-full">
                <AcademicYearSelector
                  campusId={campusId}
                  value={academicYearSelectorValue}
                  onChange={handleAcademicYearChange}
                  disabled={saving}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The special working day will be applied to the selected academic year.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <LoadingSpinner size="sm" color="white" /> : (editingId ? <Check size={16} /> : <Calendar size={16} />)}
                {editingId ? 'Update Special Day' : 'Add Special Day'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* FILTER SECTION */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">View Special Working Days</h2>
        <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="start"
              value={dateRange.start}
              onChange={handleDateRangeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="end"
              value={dateRange.end}
              onChange={handleDateRangeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 w-full md:w-auto"
          >
            Apply Filter
          </button>
        </form>
      </Card>

      {/* LIST SECTION */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Special Working Days List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                {canCreateOrUpdateSpecialDay && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicable To
                  </th>
                )}
                {canDeleteSpecialDay && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specialDays.length > 0 ? (
                specialDays.map((day) => (
                  <tr key={day.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(day.work_date), 'MMM d, yyyy (EEEE)')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.description}
                    </td>
                    {canCreateOrUpdateSpecialDay && (
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {day.academic_year_names || 'N/A'}
                      </td>
                    )}
                    {canDeleteSpecialDay && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(day)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(day.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canCreateOrUpdateSpecialDay || canDeleteSpecialDay ? 4 : 2}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No special working days found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SpecialWorkingDaysPage;
