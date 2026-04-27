import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';
import { holidayService } from '../services/holidayService';
import { specialWorkingDayService } from '../services/specialWorkingDayService';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx';
import Modal from '../components/ui/Modal.jsx';
import RequiredAsterisk from '../components/ui/RequiredAsterisk.jsx';
import { EditButton, DeleteButton, ActionButtonGroup } from '../components/ui/ActionButtons.jsx';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../config/permissions';
import { Calendar, Check } from 'lucide-react';

const InputField = ({ label, name, type = 'text', required = false, options = null, className = '', formData, handleInputChange, ...props }) => (
  <div className={`${className}`}>
    <label className={`block text-xs font-medium mb-1 ${type === 'date' ? 'text-blue-700' : 'text-gray-700'}`}>
      {label} {required && <RequiredAsterisk />}
    </label>
    {type === 'select' ? (
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
          type === 'date' ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-white'
        } ${type === 'date' ? 'h-10' : 'h-9'}`}
        required={required}
        {...props}
      >
        <option value="">Select</option>
        {options && options.map((option, index) => (
          <option key={`${name}-${index}`} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20 transition-all duration-200"
        required={required}
        {...props}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ${
          type === 'date' 
            ? 'border-blue-400 bg-blue-50 focus:ring-blue-300 focus:border-blue-500 shadow-sm' 
            : 'border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
        } ${type === 'date' ? 'h-10 font-mono' : 'h-9'}`}
        required={required}
        {...props}
      />
    )}
  </div>
);

const HolidayPage = () => {
  const { hasPermission, getCampusId, getDefaultAcademicYearId } = useAuth();
  const canCreateOrUpdateHoliday = hasPermission && hasPermission(PERMISSIONS.HOLIDAY_CREATE);
  const canEditHoliday = hasPermission && hasPermission(PERMISSIONS.HOLIDAY_EDIT);
  const canDeleteHoliday = hasPermission && hasPermission(PERMISSIONS.HOLIDAY_DELETE);
  const campusId = getCampusId();
  const defaultAcademicYearId = getDefaultAcademicYearId();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allAcademicYears, setAllAcademicYears] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [hasFetchedHolidays, setHasFetchedHolidays] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    academic_year_id: defaultAcademicYearId || '',
    search: ''
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    duration: 'full_day',
    description: 'General',
    academic_year_id: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    academic_years: [],
    classes: []
  });

  // Duplicate Warning State (kept for future re-enabling ConfirmationDialog)

  const getUtcDateInputString = (date) => date.toISOString().slice(0, 10);

  // Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!campusId) return;
      try {
        setLoading(true);
        const yearsRes = await academicService.getAllAcademicYears(campusId);
        const years = yearsRes.data || yearsRes || [];
        setAllAcademicYears(years);
        setFilterOptions(prev => ({ ...prev, academic_years: years }));
        
        const now = new Date();
        const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const utcMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const start = getUtcDateInputString(utcMonthStart);
        const end = getUtcDateInputString(utcToday);

        setDateRange({ start, end });
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [campusId, defaultAcademicYearId]);

  const fetchHolidays = async (startDate, endDate) => {
    try {
      setLoading(true);
      const res = await holidayService.getHolidays(campusId, { startDate, endDate });
      setHolidays(res.data || res || []);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setHolidays([]);
    setHasFetchedHolidays(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      startDate: '',
      endDate: '',
      duration: 'full_day',
      description: 'General',
      academic_year_id: filters.academic_year_id || ''
    });
    setEditingId(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const proceedWithSave = async (payload, isEdit) => {
    try {
      setSaving(true);
      if (isEdit) {
        await holidayService.updateHoliday(campusId, editingId, payload);
        toast.success('Holiday updated successfully');
      } else {
        await holidayService.createHoliday(campusId, payload);
        toast.success('Holiday created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchHolidays(dateRange.start, dateRange.end);
    } catch (error) {
      console.error("Error saving holiday:", error);
      toast.error(error.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      toast.error('Please fill all required fields.');
      return;
    }

    const payload = {
      holiday_name: formData.title,
      start_date: formData.startDate,
      end_date: formData.endDate || formData.startDate,
      duration_category: formData.duration,
      holiday_type: formData.description,
      academic_year_ids: formData.academic_year_id ? [parseInt(formData.academic_year_id)] : [],
      is_paid: true 
    };

    try {
      setSaving(true);
      // 1. Check for Special Working Day conflict
      const specialDaysRes = await specialWorkingDayService.getAll(campusId);
      const specialDays = specialDaysRes.data || specialDaysRes || [];
      const hasSpecialDayConflict = specialDays.some(sd => {
        const sdDate = new Date(sd.work_date).setHours(0,0,0,0);
        const hStart = new Date(payload.start_date).setHours(0,0,0,0);
        const hEnd = new Date(payload.end_date).setHours(0,0,0,0);
        if (sdDate < hStart || sdDate > hEnd) return false;
        const sdAcademicYears = sd.academic_year_ids || [];
        if (payload.academic_year_ids.length === 0) return true; 
        return sdAcademicYears.some(id => payload.academic_year_ids.includes(id));
      });

      if (hasSpecialDayConflict) {
        toast.error('Cannot add holiday on a special working day. Delete working day first.');
        setSaving(false);
        return;
      }

      // 2. Check for Duplicate Holiday
      const existingHolidaysRes = await holidayService.getHolidays(campusId, { 
        startDate: payload.start_date, 
        endDate: payload.end_date 
      });
      const existingHolidays = existingHolidaysRes.data || existingHolidaysRes || [];
      const hasDuplicateHoliday = existingHolidays.some(h => {
        if (editingId && h.id === editingId) return false;
        const hStart = new Date(h.start_date).setHours(0,0,0,0);
        const hEnd = new Date(h.end_date || h.start_date).setHours(0,0,0,0);
        const newStart = new Date(payload.start_date).setHours(0,0,0,0);
        const newEnd = new Date(payload.end_date).setHours(0,0,0,0);
        if (newEnd < hStart || newStart > hEnd) return false;
        const hYears = h.academic_year_ids || [];
        const newYears = payload.academic_year_ids;
        if (hYears.length === 0 && newYears.length === 0) return true;
        if (hYears.length === 0 || newYears.length === 0) return true;
        return hYears.some(id => newYears.includes(id));
      });

      if (hasDuplicateHoliday) {
        toast('Duplicate holiday exists for this date range/academic year. Saving anyway.', { icon: 'ℹ️' });
      }

      proceedWithSave(payload, !!editingId);
    } catch (err) {
      console.error("Error checking conflicts:", err);
      toast.error("Failed to validate conflicts");
      setSaving(false);
    }
  };

  const handleEdit = (holiday) => {
    setEditingId(holiday.id);
    setFormData({
      title: holiday.holiday_name || '',
      startDate: holiday.start_date ? holiday.start_date.split('T')[0] : '',
      endDate: holiday.end_date ? holiday.end_date.split('T')[0] : '',
      duration: holiday.duration_category || 'full_day',
      description: holiday.holiday_type || 'General',
      academic_year_id: holiday.academic_year_ids && holiday.academic_year_ids.length > 0 ? holiday.academic_year_ids[0].toString() : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await holidayService.deleteHoliday(campusId, id);
      setHolidays(prev => prev.filter(h => h.id !== id));
      toast.success('Holiday deleted successfully');
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error('Failed to delete holiday');
    }
  };

  const getAcademicYearNames = (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return 'Global (All)';
    return ids.map(id => {
      const y = allAcademicYears.find(ay => ay.academic_year_id === id);
      return y ? `${y.year_name} (${y.year_type}) - ${y.curriculum_code || 'N/A'}` : id;
    }).join(', ');
  };

  const customFilters = (
    <div className="md:col-span-2">
      <div className="flex flex-col sm:flex-row gap-4 items-end justify-end">
        <InputField
          label="Start Date"
          name="start"
          type="date"
          formData={dateRange}
          handleInputChange={handleDateRangeChange}
          className="flex-1 min-w-[160px]"
        />
        <InputField
          label="End Date"
          name="end"
          type="date"
          formData={dateRange}
          handleInputChange={handleDateRangeChange}
          className="flex-1 min-w-[160px]"
        />
        <button
          type="button"
          onClick={() => {
            fetchHolidays(dateRange.start, dateRange.end);
            setHasFetchedHolidays(true);
          }}
          className="btn-primary whitespace-nowrap h-10 px-6 w-full sm:w-auto"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Holidays'}
        </button>
      </div>
    </div>
  );

  return (
    <OneAcademicYearPage
      title="Manage Holidays"
      filterOptions={filterOptions}
      filters={filters}
      setFilters={setFilters}
      onFiltersChange={(newFilters) => {
        setFilters(newFilters);
        setHolidays([]);
        setHasFetchedHolidays(false);
      }}
      showClassFilter={false}
      showSearchFilter={false}
      customFilters={customFilters}
      addButtonText="Add Holiday"
      onAddClick={handleAddClick}
      canAdd={canCreateOrUpdateHoliday}
    >
      <div className="space-y-6">
        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : !hasFetchedHolidays ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border border-gray-300">
              Select filters and click Get Holidays to view results.
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              No holidays found for the selected range.
            </div>
          ) : (
            <div className="overflow-x-auto border border-secondary-200 rounded-xl">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Holiday Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider text-center">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-secondary-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {holidays.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-secondary-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 font-medium">
                        {format(parseISO(holiday.start_date), 'MMM d, yyyy')}
                        {holiday.start_date !== holiday.end_date && (
                          <span className="text-secondary-400 font-normal"> - {format(parseISO(holiday.end_date), 'MMM d, yyyy')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-900 font-bold">
                        {holiday.holiday_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${holiday.duration_category === 'full_day' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                          {holiday.duration_category === 'full_day' ? 'Full Day' : 'Half Day'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-secondary-100 text-secondary-700 uppercase tracking-wider">
                          {holiday.holiday_type || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <ActionButtonGroup className="justify-end">
                          {canEditHoliday && (
                            <EditButton onClick={() => handleEdit(holiday)} title="Edit holiday" />
                          )}
                          {canDeleteHoliday && (
                            <DeleteButton 
                              onClick={() => handleDelete(holiday.id)} 
                              title="Delete holiday"
                              confirmMessage={`Are you sure you want to delete "${holiday.holiday_name}"?`}
                            />
                          )}
                        </ActionButtonGroup>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Holiday' : 'Add New Holiday'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Holiday Title"
              name="title"
              required
              formData={formData}
              handleInputChange={handleInputChange}
              placeholder="e.g. Independence Day"
              className="md:col-span-1"
            />
            <InputField
              label="Type"
              name="description"
              type="select"
              options={[
                { label: 'General Holiday', value: 'General' },
                { label: 'Restricted Holiday', value: 'Restricted' },
                { label: 'Observance', value: 'Observance' },
                { label: 'Season Break', value: 'Season' }
              ]}
              formData={formData}
              handleInputChange={handleInputChange}
              className="md:col-span-1"
            />
            
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Start Date"
                name="startDate"
                type="date"
                required
                formData={formData}
                handleInputChange={handleInputChange}
              />
              <InputField
                label="End Date"
                name="endDate"
                type="date"
                formData={formData}
                handleInputChange={handleInputChange}
              />
              <InputField
                label="Duration"
                name="duration"
                type="select"
                options={[
                  { label: 'Full Day', value: 'full_day' },
                  { label: 'Half Day', value: 'half_day' }
                ]}
                formData={formData}
                handleInputChange={handleInputChange}
              />
            </div>

            <InputField
              label="Academic Year"
              name="academic_year_id"
              type="select"
              options={allAcademicYears.map(y => ({
                label: `${y.year_name} - ${(y.curriculum_code || y.curriculum_name || 'N/A')} - ${y.medium || 'N/A'}`,
                value: y.academic_year_id
              }))}
              formData={formData}
              handleInputChange={handleInputChange}
              className="md:col-span-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-secondary-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 text-secondary-600 font-medium border border-secondary-300 rounded-xl hover:bg-secondary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-200 disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" color="white" /> : (editingId ? <Calendar size={18} /> : <Calendar size={18} />)}
              {editingId ? 'Update Holiday' : 'Save Holiday'}
            </button>
          </div>
        </form>
      </Modal>

      {/* <ConfirmationDialog
        isOpen={warningDialog.isOpen}
        onClose={() => setWarningDialog({ isOpen: false, payload: null, isEdit: false })}
        onConfirm={() => proceedWithSave(warningDialog.payload, warningDialog.isEdit)}
        title="Duplicate Holiday Warning"
        message="A holiday already exists for this date range and academic year. Do you still want to add it?"
        confirmText="Yes, Add Anyway"
        cancelText="Cancel"
        variant="warning"
      /> */}
    </OneAcademicYearPage>
  );
};

export default HolidayPage;
