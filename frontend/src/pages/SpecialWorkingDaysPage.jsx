import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';
import { specialWorkingDayService } from '../services/specialWorkingDayService';
import { holidayService } from '../services/holidayService';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import OneAcademicYearPage from '../components/layout/OneAcademicYearPage.jsx';
import Modal from '../components/ui/Modal.jsx';
import RequiredAsterisk from '../components/ui/RequiredAsterisk.jsx';
import { ActionButtonGroup, DeleteButton, EditButton } from '../components/ui/ActionButtons.jsx';
import { Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../config/permissions';

const InputField = ({
  label,
  name,
  type = 'text',
  required = false,
  options = null,
  className = '',
  formData,
  handleInputChange,
  ...props
}) => (
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
        {options &&
          options.map((option, index) => (
            <option key={`${name}-${index}`} value={option.value ?? option}>
              {option.label ?? option}
            </option>
          ))}
      </select>
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

const SpecialWorkingDaysPage = () => {
  const { hasPermission, getCampusId, getDefaultAcademicYearId } = useAuth();
  const canCreateSpecialDay = hasPermission && hasPermission(PERMISSIONS.SPECIAL_WORKING_DAY_CREATE);
  const canEditSpecialDay = hasPermission && hasPermission(PERMISSIONS.SPECIAL_WORKING_DAY_EDIT);
  const canDeleteSpecialDay = hasPermission && hasPermission(PERMISSIONS.SPECIAL_WORKING_DAY_DELETE);
  const campusId = getCampusId();
  const defaultAcademicYearId = getDefaultAcademicYearId();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [allAcademicYears, setAllAcademicYears] = useState([]);
  const [specialDays, setSpecialDays] = useState([]);
  const [hasFetchedSpecialDays, setHasFetchedSpecialDays] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Filter State
  const [filters, setFilters] = useState({
    academic_year_id: defaultAcademicYearId || ''
  });
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Admin Form State
  const [formData, setFormData] = useState({
    workDate: '',
    description: '',
    academic_year_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  // Conflict Confirmation Dialog State
  const [conflictDialog, setConflictDialog] = useState({
    isOpen: false,
    payload: null,
    isEdit: false
  });

  const getUtcDateInputString = (date) => date.toISOString().slice(0, 10);

  // Initial Data Fetching
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!campusId) return;
        setLoading(true);

        const yearsRes = await academicService.getAllAcademicYears(campusId);
        const years = yearsRes.data || yearsRes || [];
        setAllAcademicYears(years);

        const now = new Date();
        const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const utcMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        setDateRange({ start: getUtcDateInputString(utcMonthStart), end: getUtcDateInputString(utcToday) });
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load academic years');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [campusId, defaultAcademicYearId]);

  const fetchSpecialDays = async (startDate, endDate) => {
    try {
      setLoading(true);
      const res = await specialWorkingDayService.getAll(campusId, { startDate, endDate });
      const rawDays = res.data || res || [];
      const academicYearId = filters.academic_year_id ? parseInt(filters.academic_year_id, 10) : null;
      const filteredDays = academicYearId
        ? rawDays.filter(d => Array.isArray(d.academic_year_ids) && d.academic_year_ids.includes(academicYearId))
        : rawDays;

      filteredDays.sort((a, b) => new Date(a.work_date).getTime() - new Date(b.work_date).getTime());
      setSpecialDays(filteredDays);
    } catch (error) {
      console.error('Error fetching special working days:', error);
      toast.error('Failed to load special working days');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setSpecialDays([]);
    setHasFetchedSpecialDays(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      workDate: '',
      description: '',
      academic_year_id: filters.academic_year_id || defaultAcademicYearId || ''
    });
    setEditingId(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (day) => {
    setEditingId(day.id);
    setFormData({
      workDate: day.work_date.split('T')[0],
      description: day.description || '',
      academic_year_id:
        day.academic_year_ids && day.academic_year_ids.length > 0 ? String(day.academic_year_ids[0]) : ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };
  
  const proceedWithSave = async (payload, isEdit) => {
    try {
      setSaving(true);
      if (isEdit) {
        await specialWorkingDayService.update(campusId, editingId, payload);
        toast.success('Special working day updated successfully');
      } else {
        await specialWorkingDayService.create(campusId, payload);
        toast.success('Special working day created successfully');
      }
      
      closeModal();
      setConflictDialog({ isOpen: false, payload: null, isEdit: false });
      if (hasFetchedSpecialDays) {
        fetchSpecialDays(dateRange.start, dateRange.end);
      }

    } catch (error) {
      console.error("Error saving special day:", error);
      toast.error(error.message || 'Failed to save special working day');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.workDate || !formData.description || !formData.academic_year_id) {
      toast.error('Please fill all required fields.');
      return;
    }

    const payload = {
        work_date: formData.workDate,
        description: formData.description,
        academic_year_ids: [parseInt(formData.academic_year_id, 10)]
    };

    // Check for conflicts with Holidays
    try {
        const holidaysRes = await holidayService.getHolidays(campusId, { startDate: formData.workDate, endDate: formData.workDate });
        const holidays = holidaysRes.data || holidaysRes || [];

        const selectedAcademicYearId = parseInt(formData.academic_year_id, 10);
        const conflict = holidays.some(h => {
            const hStart = new Date(h.start_date).setHours(0,0,0,0);
            const hEnd = new Date(h.end_date || h.start_date).setHours(0,0,0,0);
            const wDate = new Date(formData.workDate).setHours(0,0,0,0);
            
            if (wDate < hStart || wDate > hEnd) return false;

            const holidayAcademicYears = h.academic_year_ids || [];
            const isGlobalHoliday = holidayAcademicYears.length === 0;
            
            if (isGlobalHoliday) return true;
            
            return holidayAcademicYears.includes(selectedAcademicYearId);
        });

        if (conflict) {
            setConflictDialog({
                isOpen: true,
                payload,
                isEdit: !!editingId
            });
            return;
        }

        proceedWithSave(payload, !!editingId);

    } catch (err) {
        console.error("Error checking conflicts:", err);
        toast.error("Failed to validate conflicts. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await specialWorkingDayService.delete(campusId, id);
      toast.success('Special working day deleted successfully');
      setSpecialDays(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting special day:", error);
      toast.error(error.message || 'Failed to delete special working day');
    } finally {
      setDeletingId(null);
    }
  };

  const getAcademicYearNames = (ids) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) return 'N/A';
    return ids
      .map(id => {
        const y = allAcademicYears.find(ay => ay.academic_year_id === id);
        return y ? `${y.year_name} (${y.year_type}) - ${y.curriculum_code || 'N/A'}` : id;
      })
      .join(', ');
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
            fetchSpecialDays(dateRange.start, dateRange.end);
            setHasFetchedSpecialDays(true);
          }}
          className="btn-primary whitespace-nowrap h-10 px-6 w-full sm:w-auto"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Special Working Days'}
        </button>
      </div>
    </div>
  );

  return (
    <OneAcademicYearPage
      title="Manage Special Working Days"
      filterOptions={{ academic_years: allAcademicYears, classes: [] }}
      filters={filters}
      setFilters={setFilters}
      onFiltersChange={(newFilters) => {
        setFilters(newFilters);
        setSpecialDays([]);
        setHasFetchedSpecialDays(false);
      }}
      showClassFilter={false}
      showSearchFilter={false}
      customFilters={customFilters}
      addButtonText="Add Special Working Day"
      onAddClick={handleAddClick}
      canAdd={canCreateSpecialDay}
    >
      <ConfirmationDialog
        isOpen={conflictDialog.isOpen}
        onClose={() => setConflictDialog({ isOpen: false, payload: null, isEdit: false })}
        onConfirm={() => proceedWithSave(conflictDialog.payload, conflictDialog.isEdit)}
        title="Holiday Conflict"
        message="A holiday exists on the same date and academic year. Do you want to add this special working day anyway?"
        confirmText="Yes, Add Anyway"
        cancelText="Cancel"
        variant="warning"
        isLoading={saving}
      />

      <div className="space-y-6">
        <Card className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !hasFetchedSpecialDays ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border border-gray-300">
              Select filters and click Get Special Working Days to view results.
            </div>
          ) : specialDays.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              No special working days found for the selected range.
            </div>
          ) : (
            <div className="overflow-x-auto border border-secondary-200 rounded-xl">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary-600 uppercase tracking-wider">Academic Year</th>
                    {(canEditSpecialDay || canDeleteSpecialDay) && (
                      <th className="px-6 py-4 text-right text-xs font-bold text-secondary-600 uppercase tracking-wider">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {specialDays.map((day) => (
                    <tr key={day.id} className="hover:bg-secondary-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900 font-medium">
                        {format(parseISO(day.work_date), 'MMM d, yyyy')}
                        <span className="text-secondary-400 font-normal"> ({format(parseISO(day.work_date), 'EEEE')})</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-900 font-bold">{day.description}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">
                        {day.academic_year_names || getAcademicYearNames(day.academic_year_ids)}
                      </td>
                      {(canEditSpecialDay || canDeleteSpecialDay) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <ActionButtonGroup className="justify-end">
                            {canEditSpecialDay && (
                              <EditButton onClick={() => handleEdit(day)} title="Edit special working day" />
                            )}
                            {canDeleteSpecialDay && (
                              <DeleteButton
                                onClick={() => handleDelete(day.id)}
                                isDeleting={deletingId === day.id}
                                title="Delete special working day"
                                confirmMessage="Are you sure you want to delete this special working day?"
                              />
                            )}
                          </ActionButtonGroup>
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

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Edit Special Working Day' : 'Add Special Working Day'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Work Date"
              name="workDate"
              type="date"
              required
              formData={formData}
              handleInputChange={handleInputChange}
            />
            <InputField
              label="Academic Year"
              name="academic_year_id"
              type="select"
              required
              options={allAcademicYears.map(y => ({
                label: `${y.year_name} - ${(y.curriculum_code || y.curriculum_name || 'N/A')} - ${y.medium || 'N/A'}`,
                value: y.academic_year_id
              }))}
              formData={formData}
              handleInputChange={handleInputChange}
            />
            <InputField
              label="Description"
              name="description"
              required
              formData={formData}
              handleInputChange={handleInputChange}
              placeholder="e.g. Annual Function"
              className="md:col-span-2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-secondary-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 text-secondary-600 font-medium border border-secondary-300 rounded-xl hover:bg-secondary-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-200 disabled:opacity-50"
            >
              {saving ? <LoadingSpinner size="sm" color="white" /> : <Calendar size={18} />}
              {editingId ? 'Update Special Working Day' : 'Save Special Working Day'}
            </button>
          </div>
        </form>
      </Modal>
    </OneAcademicYearPage>
  );
};

export default SpecialWorkingDaysPage;
