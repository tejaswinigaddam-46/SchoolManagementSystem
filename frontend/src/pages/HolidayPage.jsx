import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';
import { holidayService } from '../services/holidayService';
import { specialWorkingDayService } from '../services/specialWorkingDayService';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AcademicYearSelector from '../components/forms/AcademicYearSelector';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import { Edit2, Trash2, Check, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../config/permissions';

const HolidayPage = () => {
  const { user, hasPermission, getCampusId, getDefaultAcademicYearId } = useAuth();
  const canCreateOrUpdateHoliday =
    hasPermission && hasPermission(PERMISSIONS.HOLIDAY_CREATE);
  const canEditHoliday =
    hasPermission && hasPermission(PERMISSIONS.HOLIDAY_EDIT);
  const canDeleteHoliday =
    hasPermission && hasPermission(PERMISSIONS.HOLIDAY_DELETE);
  const campusId = getCampusId();
  const defaultAcademicYearId = getDefaultAcademicYearId();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allAcademicYears, setAllAcademicYears] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [uniqueYearNames, setUniqueYearNames] = useState([]);
  
  // Filter State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Form State
  const [selectedYearName, setSelectedYearName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    duration: 'full_day', // Default to full_day
    description: '',
    // selectedCurriculumIds removed
  });
  
  // New state for Academic Year Selection
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [academicYearSelectorValue, setAcademicYearSelectorValue] = useState({});

  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  // Duplicate Warning State
  const [warningDialog, setWarningDialog] = useState({
    isOpen: false,
    payload: null,
    isEdit: false
  });

  // Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!campusId) return;
      
      try {
        setLoading(true);
        
        // Load Academic Years
        const yearsRes = await academicService.getAllAcademicYears(campusId);
        const years = yearsRes.data || yearsRes || [];
        setAllAcademicYears(years);
        
        // Initialize date range
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        
        if (defaultAcademicYearId) {
          const currentYear = years.find(
            (y) => y.academic_year_id === parseInt(defaultAcademicYearId)
          );
          if (currentYear) {
            setDateRange({
              start: currentYear.start_date.split('T')[0],
              end: currentYear.end_date.split('T')[0]
            });
            await fetchHolidays(
              currentYear.start_date.split('T')[0],
              currentYear.end_date.split('T')[0]
            );
          } else {
            setDateRange({ start, end });
            await fetchHolidays(start, end);
          }
        } else {
          setDateRange({ start, end });
          await fetchHolidays(start, end);
        }
        
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [campusId, defaultAcademicYearId]);

  // Fetch holidays removed
  
  const fetchHolidays = async (startDate, endDate) => {
    try {
      setLoading(true);
      const filters = {};
      if (startDate && endDate) {
          filters.startDate = startDate;
          filters.endDate = endDate;
      }
      
      const res = await holidayService.getHolidays(campusId, filters);
      const events = res.data || res || []; 
      setHolidays(events);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
        setLoading(false);
    }
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

  const handleDateRangeChange = (e) => {
      const { name, value } = e.target;
      setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
      e.preventDefault();
      fetchHolidays(dateRange.start, dateRange.end);
  };

  const proceedWithSave = async (payload, isEdit) => {
    try {
      if (isEdit) {
        await holidayService.updateHoliday(campusId, editingId, payload);
        setMessage({ type: 'success', text: 'Holiday updated successfully!' });
        toast.success('Holiday updated successfully');
      } else {
        await holidayService.createHoliday(campusId, payload);
        setMessage({ type: 'success', text: 'Holiday created successfully!' });
        toast.success('Holiday created successfully');

        // Check if new holiday is within current view
        const newStart = payload.start_date;
        const newEnd = payload.end_date || payload.start_date;
        
        if (newStart < dateRange.start || newEnd > dateRange.end) {
            // Expand range to include new holiday
            const updatedStart = newStart < dateRange.start ? newStart : dateRange.start;
            const updatedEnd = newEnd > dateRange.end ? newEnd : dateRange.end;
            
            setDateRange({ start: updatedStart, end: updatedEnd });
            fetchHolidays(updatedStart, updatedEnd);
            
            // Reset form
            setFormData({
              title: '',
              startDate: '',
              endDate: '',
              duration: 'full_day',
              description: '',
            });
            setAcademicYearSelectorValue({});
            setSelectedAcademicYearId(null);
            setWarningDialog({ isOpen: false, payload: null, isEdit: false });
            return;
        }
      }

      // Refresh list
      fetchHolidays(dateRange.start, dateRange.end);
      
      // Reset form if creating
      if (!isEdit) {
        setFormData({
          title: '',
          startDate: '',
          endDate: '',
          duration: 'full_day',
          description: '',
        });
        setAcademicYearSelectorValue({});
        setSelectedAcademicYearId(null);
      } else {
          // If editing, exit edit mode
          setEditingId(null);
          setFormData({
              title: '',
              startDate: '',
              endDate: '',
              duration: 'full_day',
              description: '',
          });
          setAcademicYearSelectorValue({});
          setSelectedAcademicYearId(null);
      }
      
      setWarningDialog({ isOpen: false, payload: null, isEdit: false });

    } catch (error) {
      console.error("Error saving holiday:", error);
      setMessage({ type: 'error', text: error.message || 'Failed to save holiday' });
      toast.error(error.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
        setMessage({ type: 'error', text: 'Please fill all required fields.' });
        return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    const payload = {
      holiday_name: formData.title,
      start_date: formData.startDate,
      end_date: formData.endDate || formData.startDate,
      duration_category: formData.duration,
      holiday_type: formData.description,
      academic_year_ids: selectedAcademicYearId ? [selectedAcademicYearId] : [], // Send array
      is_paid: true 
    };

    try {
        // 1. Check for Special Working Day conflict (Reject)
        const specialDaysRes = await specialWorkingDayService.getAll(campusId);
        const specialDays = specialDaysRes.data || specialDaysRes || [];

        const hasSpecialDayConflict = specialDays.some(sd => {
            const sdDate = new Date(sd.work_date).setHours(0,0,0,0);
            const hStart = new Date(payload.start_date).setHours(0,0,0,0);
            const hEnd = new Date(payload.end_date).setHours(0,0,0,0);

            if (sdDate < hStart || sdDate > hEnd) return false;

            // Check Academic Year Overlap
            const sdAcademicYears = sd.academic_year_ids || [];
            const isGlobalHoliday = payload.academic_year_ids.length === 0;
            if (isGlobalHoliday) return true; 

            // If holiday has specific year, check if special day shares it
            return sdAcademicYears.some(id => payload.academic_year_ids.includes(id));
        });

        if (hasSpecialDayConflict) {
            setSaving(false);
            setMessage({ type: 'error', text: 'We cannot add holiday as it is special working day. Delete working day to add holiday.' });
            toast.error('We cannot add holiday as it is special working day. Delete working day to add holiday.');
            return;
        }

        // 2. Check for Duplicate Holiday (Warning)
        const existingHolidaysRes = await holidayService.getHolidays(campusId, { 
            startDate: payload.start_date, 
            endDate: payload.end_date 
        });
        const existingHolidays = existingHolidaysRes.data || existingHolidaysRes || [];

        const hasDuplicateHoliday = existingHolidays.some(h => {
            if (editingId && h.id === editingId) return false; // Ignore self when editing

            const hStart = new Date(h.start_date).setHours(0,0,0,0);
            const hEnd = new Date(h.end_date || h.start_date).setHours(0,0,0,0);
            const newStart = new Date(payload.start_date).setHours(0,0,0,0);
            const newEnd = new Date(payload.end_date).setHours(0,0,0,0);

            // Check overlap
            if (newEnd < hStart || newStart > hEnd) return false;

            // Check Academic Year
            const hYears = h.academic_year_ids || [];
            const newYears = payload.academic_year_ids;

            // Global vs Global -> Conflict
            if (hYears.length === 0 && newYears.length === 0) return true;
            // Global vs Specific -> Conflict
            if (hYears.length === 0 || newYears.length === 0) return true;
            
            // Specific vs Specific -> Check intersection
            return hYears.some(id => newYears.includes(id));
        });

        if (hasDuplicateHoliday) {
             setWarningDialog({
                 isOpen: true,
                 payload,
                 isEdit: !!editingId
             });
             setSaving(false);
             return;
        }

        // No conflicts
        proceedWithSave(payload, !!editingId);

    } catch (err) {
        console.error("Error checking conflicts:", err);
        toast.error("Failed to validate conflicts");
        setSaving(false);
    }
  };

  const handleEdit = async (holiday) => {
    setEditingId(holiday.id);
    setFormData({
      title: holiday.holiday_name || '',
      startDate: holiday.start_date ? holiday.start_date.split('T')[0] : '',
      endDate: holiday.end_date ? holiday.end_date.split('T')[0] : '',
      duration: holiday.duration_category || 'full_day',
      description: holiday.holiday_type || 'Holiday',
    });

    // Handle Academic Year Selector Population
    if (holiday.academic_year_ids && holiday.academic_year_ids.length > 0) {
        // Use the first one
        const ayId = holiday.academic_year_ids[0];
        try {
            // Check if we already have it in allAcademicYears
            let ay = allAcademicYears.find(y => y.academic_year_id === ayId);
            if (!ay) {
                const res = await academicService.getAcademicYearById(campusId, ayId);
                ay = res.data || res;
            }
            
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
        }
    } else {
        setAcademicYearSelectorValue({});
        setSelectedAcademicYearId(null);
    }

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    
    try {
      await holidayService.deleteHoliday(campusId, id);
      setHolidays(prev => prev.filter(h => h.id !== id));
      toast.success('Holiday deleted successfully');
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error('Failed to delete holiday');
    }
  };

  const formatDuration = (category) => {
      if (category === 'half_day') return 'Half Day';
      return 'Full Day';
  };

  const getAcademicYearNames = (ids) => {
      if (!ids || !Array.isArray(ids) || ids.length === 0) return 'Global (All)';
      
      // If we have names loaded, use them
      if (allAcademicYears.length > 0) {
          return ids.map(id => {
              const y = allAcademicYears.find(ay => ay.academic_year_id === id);
              // Format: Year (Type) - Curriculum - Medium
              return y ? `${y.year_name} (${y.year_type}) - ${y.curriculum_name || y.curriculum_code || 'N/A'} - ${y.medium}` : id;
          }).join(', ');
      }
      return ids.join(', ');
  };

  if (loading && !holidays.length) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Holidays</h1>
      </div>

      <ConfirmationDialog
        isOpen={warningDialog.isOpen}
        onClose={() => setWarningDialog({ isOpen: false, payload: null, isEdit: false })}
        onConfirm={() => proceedWithSave(warningDialog.payload, warningDialog.isEdit)}
        title="Duplicate Holiday Warning"
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

      {canCreateOrUpdateHoliday && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? 'Edit Holiday' : 'Add New Holiday'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Year Filter removed */}
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            
            {/* Academic Year Selector */}
            <div className="mb-4">
                <AcademicYearSelector 
                    campusId={campusId}
                    value={academicYearSelectorValue}
                    onChange={handleAcademicYearChange}
                    required={false} // Maybe optional implies Global? Let's keep it optional but encourage selection
                    label="Applicable Academic Year"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Select an academic year to apply this holiday to. Leave empty for Global holiday (applies to all).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Independence Day"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                 <select
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="General">General Holiday</option>
                  <option value="Restricted">Restricted Holiday</option>
                  <option value="Observance">Observance</option>
                  <option value="Season">Season Break</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Same as start date if empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="full_day">Full Day</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: '',
                      startDate: '',
                      endDate: '',
                      duration: 'full_day',
                      description: '',
                    });
                    setAcademicYearSelectorValue({});
                    setSelectedAcademicYearId(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <LoadingSpinner size="sm" color="white" /> : (editingId ? <Check size={16} /> : <Calendar size={16} />)}
                {editingId ? 'Update Holiday' : 'Add Holiday'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* FILTER SECTION */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">View Holidays</h2>
        <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input 
                    type="date" 
                    name="start"
                    value={dateRange.start} 
                    onChange={handleDateRangeChange}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-gray-500">To:</span>
                <input 
                    type="date" 
                    name="end"
                    value={dateRange.end} 
                    onChange={handleDateRangeChange}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                />
            </div>
            <button 
                type="submit" 
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-200 border border-gray-300 w-full md:w-auto"
            >
                Filter
            </button>
        </form>
        
        {loading ? (
             <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : holidays.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
                No holidays found.
            </div>
        ) : (
            <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holiday</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicable To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            {(canEditHoliday || canDeleteHoliday) && (
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {holidays.map((holiday, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {format(parseISO(holiday.start_date), 'MMM d, yyyy')}
                                    {holiday.start_date !== holiday.end_date && (
                                        <> - {format(parseISO(holiday.end_date), 'MMM d, yyyy')}</>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {holiday.holiday_name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDuration(holiday.duration_category)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {getAcademicYearNames(holiday.academic_year_ids)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {holiday.holiday_type || 'Holiday'}
                                    </span>
                                </td>
                                {(canEditHoliday || canDeleteHoliday) && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {canEditHoliday && (
                                              <button
                                                  onClick={() => handleEdit(holiday)}
                                                  className="text-blue-600 hover:text-blue-900"
                                                  title="Edit"
                                              >
                                                  <Edit2 size={16} />
                                              </button>
                                            )}
                                            {canDeleteHoliday && (
                                              <button
                                                  onClick={() => handleDelete(holiday.id)}
                                                  className="text-red-600 hover:text-red-900"
                                                  title="Delete"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </Card>
    </div>
  );
};

export default HolidayPage;
