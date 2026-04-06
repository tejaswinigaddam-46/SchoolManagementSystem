import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { weekendPolicyService } from '../services/weekendPolicyService';
import { academicService } from '../services/academicService';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AcademicYearSelector from '../components/forms/AcademicYearSelector';
import { Trash2, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PERMISSIONS } from '../config/permissions';

const WeekendPolicyPage = () => {
  const { hasPermission, getCampusId } = useAuth();
  const canCreateOrUpdatePolicy =
    hasPermission && hasPermission(PERMISSIONS.WEEKEND_POLICY_CREATE);
  const canDeletePolicy =
    hasPermission && hasPermission(PERMISSIONS.WEEKEND_POLICY_DELETE);
  const campusId = getCampusId();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [allAcademicYears, setAllAcademicYears] = useState([]);
  
  // Form State
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(null);
  const [academicYearSelectorValue, setAcademicYearSelectorValue] = useState(null);
  const [formData, setFormData] = useState({
    is_sunday_holiday: true,
    saturday_rule: 'holiday' // 'holiday', 'half_day', 'working'
  });

  const formRef = useRef(null);

  useEffect(() => {
    if (campusId) {
      fetchData();
    }
  }, [campusId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policiesRes, yearsRes] = await Promise.all([
        weekendPolicyService.getAll(campusId),
        academicService.getAllAcademicYears(campusId)
      ]);
      
      setPolicies(policiesRes.data || policiesRes || []);
      setAllAcademicYears(yearsRes.data || yearsRes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load weekend policies");
    } finally {
      setLoading(false);
    }
  };

  const handleAcademicYearChange = (e, validation) => {
    setAcademicYearSelectorValue(e.target.value);
    if (validation && validation.isValid && validation.academicYearId) {
      setSelectedAcademicYearId(validation.academicYearId);
    } else {
      setSelectedAcademicYearId(null);
    }
  };

  const handleSaturdayChange = (e) => {
    setFormData(prev => ({ ...prev, saturday_rule: e.target.value }));
  };

  const handleSundayChange = (e) => {
    setFormData(prev => ({ ...prev, is_sunday_holiday: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAcademicYearId) {
      toast.error("Please select an academic year");
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        academic_year_id: selectedAcademicYearId,
        is_sunday_holiday: formData.is_sunday_holiday,
        is_saturday_holiday: formData.saturday_rule === 'holiday',
        is_saturday_half_day: formData.saturday_rule === 'half_day'
      };

      await weekendPolicyService.save(campusId, payload);
      toast.success("Weekend policy saved successfully");
      
      // Reset form
      setSelectedAcademicYearId(null);
      setAcademicYearSelectorValue(null);
      setFormData({
        is_sunday_holiday: true,
        saturday_rule: 'holiday'
      });
      
      fetchData();
    } catch (error) {
      console.error("Error saving policy:", error);
      toast.error(error.message || "Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    
    try {
      await weekendPolicyService.delete(campusId, id);
      toast.success("Policy deleted successfully");
      setPolicies(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting policy:", error);
      toast.error("Failed to delete policy");
    }
  };

  const getAcademicYearDetails = (academicYearId) => {
    const y = allAcademicYears.find(ay => ay.academic_year_id === academicYearId);
    if (!y) return 'Unknown Academic Year';
    return `${y.year_name} (${y.year_type}) - ${y.curriculum_name || y.curriculum_code || 'N/A'} - ${y.medium}`;
  };

  const getSaturdayStatus = (policy) => {
    if (policy.is_saturday_holiday) return <span className="text-red-600 font-medium">Holiday</span>;
    if (policy.is_saturday_half_day) return <span className="text-orange-600 font-medium">Half Day</span>;
    return <span className="text-green-600 font-medium">Working Day</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekend Policies</h1>
          <p className="text-sm text-gray-500">Configure weekly holidays and working hours</p>
        </div>
      </div>

      {canCreateOrUpdatePolicy && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Add/Update Policy</h2>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <AcademicYearSelector 
                    campusId={campusId}
                    value={academicYearSelectorValue}
                    onChange={handleAcademicYearChange}
                    required={true}
                    label="Applicable Academic Year"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Select the academic year to apply this policy to.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Weekend Rules</label>
                
                <div className="flex items-center space-x-3 p-3 border rounded-md bg-gray-50">
                  <input
                    type="checkbox"
                    id="sunday"
                    checked={formData.is_sunday_holiday}
                    onChange={handleSundayChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sunday" className="text-sm text-gray-700 font-medium">
                    Sunday is a Holiday
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-700 font-medium">Saturday Status:</p>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="saturday"
                        value="holiday"
                        checked={formData.saturday_rule === 'holiday'}
                        onChange={handleSaturdayChange}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Holiday</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="saturday"
                        value="half_day"
                        checked={formData.saturday_rule === 'half_day'}
                        onChange={handleSaturdayChange}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Half Day</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="saturday"
                        value="working"
                        checked={formData.saturday_rule === 'working'}
                        onChange={handleSaturdayChange}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Working Day</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {saving ? 'Saving...' : 'Save Policy'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p>No weekend policies configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicable To</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Sunday</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Saturday</th>
                  {canDeletePolicy && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {policies.map((policy) => (
                  <tr key={policy.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getAcademicYearDetails(policy.academic_year_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {policy.is_sunday_holiday ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Holiday
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Working
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {getSaturdayStatus(policy)}
                    </td>
                    {canDeletePolicy && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
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

export default WeekendPolicyPage;
