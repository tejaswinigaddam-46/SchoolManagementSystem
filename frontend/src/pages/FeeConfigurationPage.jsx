import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import feeService from '../services/feeService';
import {academicService} from '../services/academicService';
import classService from '../services/classService';
import { Plus, Edit, Trash2, Check, X, Calendar, IndianRupee, Eye } from 'lucide-react';
import AcademicYearSelector from '../components/forms/AcademicYearSelector';
import Modal from '../components/ui/Modal';
import ConsolidatedDuesList from '../components/ConsolidatedDuesList';

const FeeConfigurationPage = () => {
  const { user, campusId: authCampusId } = useAuth();
  const campusId = authCampusId || user?.campus?.campus_id || user?.campusId;
  
  const [activeTab, setActiveTab] = useState('types'); // types, structures, dues
  const [loading, setLoading] = useState(false);

  // Common Data
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);

  // Fee Types State
  const [feeTypes, setFeeTypes] = useState([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ fee_type_name: '', description: '' });

  // Fee Structures State
  const [feeStructures, setFeeStructures] = useState([]);
  const [showStructureForm, setShowStructureForm] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [viewingStructure, setViewingStructure] = useState(null);
  const [structureFormData, setStructureFormData] = useState({
    academic_year_id: '',
    class_id: '',
    fee_type_id: '',
    total_amount: 0,
    installments: [],
    _academicYearData: null
  });

  // Dues Generation State
  const [duesFormData, setDuesFormData] = useState({
    academic_year_id: '',
    class_id: '',
    _academicYearData: null
  });
  const [showDuesList, setShowDuesList] = useState(false);
  const [classDues, setClassDues] = useState([]);
  const [showConsolidatedView, setShowConsolidatedView] = useState(false);

  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger' // 'danger' | 'info'
  });

  useEffect(() => {
    fetchCommonData();
  }, [campusId]);

  useEffect(() => {
    if (activeTab === 'types') fetchFeeTypes();
    if (activeTab === 'structures') fetchFeeStructures();
  }, [activeTab]);

  const fetchCommonData = async () => {
    if (!campusId) return;
    try {
      const classesRes = await classService.getClassesByCampus(campusId);
      
      // Ensure we map whatever the structure is to a consistent array
      // Some endpoints return { success, data: { classes: [] } } or just { classes: [] } or []
      let classList = [];
      if (Array.isArray(classesRes)) {
        classList = classesRes;
      } else if (Array.isArray(classesRes.data)) {
        classList = classesRes.data;
      } else if (classesRes.data?.classes && Array.isArray(classesRes.data.classes)) {
        classList = classesRes.data.classes;
      }
      setClasses(classList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes');
    }
  };

  const fetchFeeTypes = async () => {
    try {
      setLoading(true);
      const res = await feeService.getFeeTypes({ campus_id: campusId });
      setFeeTypes(res.data || []);
    } catch (err) {
      toast.error('Failed to load fee types');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const res = await feeService.getAllFeeStructures({ campus_id: campusId });
      setFeeStructures(res.data || []);
    } catch (err) {
      toast.error('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  // Fee Type Handlers
  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingType) {
        await feeService.updateFeeType(editingType.fee_type_id, typeFormData);
        toast.success('Fee type updated');
      } else {
        await feeService.createFeeType(typeFormData);
        toast.success('Fee type created');
      }
      setShowTypeForm(false);
      setEditingType(null);
      setTypeFormData({ fee_type_name: '', description: '' });
      fetchFeeTypes();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDeleteType = async (id) => {
    setConfirmAction({
      isOpen: true,
      title: 'Delete Fee Type',
      message: 'Are you sure you want to delete this fee type? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await feeService.deleteFeeType(id);
          toast.success('Fee type deleted');
          fetchFeeTypes();
        } catch (err) {
          toast.error('Failed to delete fee type');
        }
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Fee Structure Handlers
  const handleAddInstallment = () => {
    setStructureFormData(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        { installment_name: `Installment ${prev.installments.length + 1}`, amount: 0, due_date: '', penalty_amount: 0 }
      ]
    }));
  };

  const handleRemoveInstallment = (index) => {
    setStructureFormData(prev => ({
      ...prev,
      installments: prev.installments.filter((_, i) => i !== index)
    }));
  };

  const handleInstallmentChange = (index, field, value) => {
    const newInstallments = [...structureFormData.installments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    
    // Auto calculate total
    const total = newInstallments.reduce((sum, inst) => sum + Number(inst.amount || 0), 0);
    
    setStructureFormData(prev => ({
      ...prev,
      installments: newInstallments,
      total_amount: total
    }));
  };

  const resetStructureForm = () => {
    setShowStructureForm(false);
    setEditingStructure(null);
    setStructureFormData({
      academic_year_id: '',
      class_id: '',
      fee_type_id: '',
      total_amount: 0,
      installments: [],
      _academicYearData: null
    });
  };

  const handleEditStructure = async (structure) => {
    try {
      setLoading(true);
      // Fetch full details including installments
      const fullStructure = await feeService.getFeeStructureById(structure.fee_structure_id);
      const data = fullStructure.data || fullStructure;

      // Fetch academic year details for the selector
      let ayData = null;
      if (data.academic_year_id) {
        try {
          const ayRes = await academicService.getAcademicYearById(campusId, data.academic_year_id);
          ayData = ayRes.data || ayRes;
        } catch (e) {
          console.error('Failed to fetch academic year details', e);
        }
      }

      setStructureFormData({
        academic_year_id: data.academic_year_id,
        class_id: data.class_id,
        fee_type_id: data.fee_type_id,
        total_amount: data.total_amount,
        installments: data.installments || [],
        _academicYearData: ayData
      });
      setEditingStructure(data);
      setShowStructureForm(true);
    } catch (err) {
      toast.error('Failed to load structure details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStructure = async (structure) => {
    try {
      setLoading(true);
      const fullStructure = await feeService.getFeeStructureById(structure.fee_structure_id);
      setViewingStructure(fullStructure.data || fullStructure);
    } catch (err) {
      toast.error('Failed to load structure details');
    } finally {
      setLoading(false);
    }
  };

  const handleStructureSubmit = async (e) => {
    e.preventDefault();
    if (structureFormData.installments.length === 0) {
      return toast.error('Please add at least one installment');
    }
    try {
      const payload = {
        ...structureFormData,
        installments: structureFormData.installments.map(i => ({
          ...i,
          amount: Number(i.amount),
          penalty_amount: Number(i.penalty_amount)
        }))
      };

      if (editingStructure) {
        await feeService.updateFeeStructure(editingStructure.fee_structure_id, payload);
        toast.success('Fee structure updated');
      } else {
        await feeService.createFeeStructure(payload);
        toast.success('Fee structure created');
      }
      
      resetStructureForm();
      fetchFeeStructures();
    } catch (err) {
      toast.error(err.message || `Failed to ${editingStructure ? 'update' : 'create'} fee structure`);
    }
  };

  const handleDeleteStructure = async (id) => {
    setConfirmAction({
      isOpen: true,
      title: 'Delete Fee Structure',
      message: 'Are you sure you want to delete this fee structure? This will not affect existing assigned dues.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await feeService.deleteFeeStructure(id);
          toast.success('Fee structure deleted');
          fetchFeeStructures();
        } catch (err) {
          toast.error('Failed to delete fee structure');
        }
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Dues Generation Handler
  const handleGenerateDues = async (e) => {
    e.preventDefault();
    setConfirmAction({
      isOpen: true,
      title: 'Generate Dues',
      message: 'This will assign fees to all students in the selected class. Continue?',
      type: 'info',
      onConfirm: async () => {
        try {
          setLoading(true);
          // Pass campusId explicitly as it's required
          const payload = { ...duesFormData, campus_id: campusId };
          const res = await feeService.generateDues(payload);
          toast.success(`Dues generated for ${res.data.totalAssigned} students ${JSON.stringify(payload)}`);
          setDuesFormData({ academic_year_id: '', class_id: '', _academicYearData: null });
        } catch (err) {
          toast.error(err.message || 'Failed to generate dues');
        } finally {
          setLoading(false);
          setConfirmAction(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Fee Configuration</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-secondary-100 w-fit">
        {['types', 'structures', 'dues'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'types' && 'Fee Types'}
            {tab === 'structures' && 'Fee Structures'}
            {tab === 'dues' && 'Generate Dues'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && activeTab !== 'structures' ? ( // Only show full loader if not in structures tab (where we have inline loading)
        <LoadingSpinner />
      ) : (
        <>
          {activeTab === 'types' && (
            <Card className="p-6">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold">Fee Types</h2>
                <button
                  onClick={() => { setShowTypeForm(true); setEditingType(null); setTypeFormData({ fee_type_name: '', description: '' }); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus size={16} /> Add Type
                </button>
              </div>

              {showTypeForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <form onSubmit={handleTypeSubmit} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={typeFormData.fee_type_name}
                        onChange={(e) => setTypeFormData({ ...typeFormData, fee_type_name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={typeFormData.description}
                        onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                        className="w-full px-3 py-2 text-sm border rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Check size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowTypeForm(false)}
                        className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {feeTypes.map((type) => (
                      <tr key={type.fee_type_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{type.fee_type_name}</td>
                        <td className="py-3 px-4 text-gray-600">{type.description}</td>
                        <td className="py-3 px-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingType(type);
                              setTypeFormData({ fee_type_name: type.fee_type_name, description: type.description });
                              setShowTypeForm(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteType(type.fee_type_id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {feeTypes.length === 0 && (
                      <tr>
                        <td colSpan="3" className="py-4 text-center text-gray-500">No fee types found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === 'structures' && (
            <Card className="p-6">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold">Fee Structures</h2>
                <button
                  onClick={() => setShowStructureForm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <Plus size={16} /> Create Structure
                </button>
              </div>

              {showStructureForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <form onSubmit={handleStructureSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3">
                         <AcademicYearSelector
                          campusId={campusId}
                          value={structureFormData._academicYearData || { academic_year_id: structureFormData.academic_year_id }}
                          onChange={(e, meta) => setStructureFormData(prev => ({ 
                            ...prev, 
                            academic_year_id: meta.academicYearId,
                            _academicYearData: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Class *</label>
                        <select
                          required
                          value={structureFormData.class_id}
                          onChange={(e) => setStructureFormData({ ...structureFormData, class_id: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg"
                        >
                          <option value="">Select Class</option>
                          {classes.map(c => (
                            <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Fee Type *</label>
                        <select
                          required
                          value={structureFormData.fee_type_id}
                          onChange={(e) => setStructureFormData({ ...structureFormData, fee_type_id: e.target.value })}
                          className="w-full px-3 py-2 text-sm border rounded-lg"
                        >
                          <option value="">Select Type</option>
                          {feeTypes.map(t => (
                            <option key={t.fee_type_id} value={t.fee_type_id}>{t.fee_type_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold">Installments</h3>
                        <button
                          type="button"
                          onClick={handleAddInstallment}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          + Add Installment
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {structureFormData.installments.map((inst, idx) => (
                          <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded border">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Name</label>
                              <input
                                type="text"
                                required
                                value={inst.installment_name}
                                onChange={(e) => handleInstallmentChange(idx, 'installment_name', e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs text-gray-500 mb-1">Amount</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={inst.amount}
                                onChange={(e) => handleInstallmentChange(idx, 'amount', e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div className="w-32">
                              <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                              <input
                                type="date"
                                required
                                value={inst.due_date ? String(inst.due_date).split('T')[0] : ''}
                                onChange={(e) => handleInstallmentChange(idx, 'due_date', e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs text-gray-500 mb-1">Penalty</label>
                              <input
                                type="number"
                                min="0"
                                value={inst.penalty_amount}
                                onChange={(e) => handleInstallmentChange(idx, 'penalty_amount', e.target.value)}
                                className="w-full px-2 py-1 text-sm border rounded"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveInstallment(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right text-sm font-medium">
                        Total Amount: ₹{structureFormData.total_amount}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={resetStructureForm}
                        className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        {editingStructure ? 'Update Structure' : 'Create Structure'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-gray-500">
                      <th className="py-3 px-4">Academic Year</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Fee Type</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {feeStructures.map((fs) => (
                      <tr key={fs.fee_structure_id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{fs.year_name}</td>
                        <td className="py-3 px-4">{fs.class_name}</td>
                        <td className="py-3 px-4">{fs.fee_type_name}</td>
                        <td className="py-3 px-4 font-medium">₹{fs.total_amount}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewStructure(fs)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleEditStructure(fs)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteStructure(fs.fee_structure_id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {feeStructures.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">No fee structures found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* View Structure Modal */}
              <Modal
                isOpen={!!viewingStructure}
                onClose={() => setViewingStructure(null)}
                title="Fee Structure Details"
                size="lg"
              >
                {viewingStructure && (
                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Academic Year</span>
                        <span className="font-medium">{viewingStructure.year_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Class</span>
                        <span className="font-medium">{viewingStructure.class_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Fee Type</span>
                        <span className="font-medium">{viewingStructure.fee_type_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Total Amount</span>
                        <span className="font-medium">₹{viewingStructure.total_amount}</span>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Installment</th>
                            <th className="px-4 py-2 text-right">Amount</th>
                            <th className="px-4 py-2 text-left">Due Date</th>
                            <th className="px-4 py-2 text-right">Penalty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {viewingStructure.installments?.map((inst, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2">{inst.installment_name}</td>
                              <td className="px-4 py-2 text-right">₹{inst.amount}</td>
                              <td className="px-4 py-2">{inst.due_date ? new Date(inst.due_date).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-2 text-right">₹{inst.penalty_amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Modal>
            </Card>
          )}

          {activeTab === 'dues' && (
             <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Generate Dues</h2>
                <button
                  onClick={() => setShowConsolidatedView(!showConsolidatedView)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Eye size={16} /> {showConsolidatedView ? 'Hide Consolidated Dues' : 'View Consolidated Dues'}
                </button>
              </div>
              
              <div className="max-w-xl mb-8">
                <p className="text-gray-600 mb-6">
                  Select a class and academic year to generate fee dues for all students. 
                  This process will assign all applicable fee structures to students in the selected class who haven't been assigned them yet.
                </p>
                <form onSubmit={handleGenerateDues} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <AcademicYearSelector
                      campusId={campusId}
                      value={duesFormData._academicYearData || { academic_year_id: duesFormData.academic_year_id }}
                      onChange={(e, meta) => setDuesFormData(prev => ({ 
                        ...prev, 
                        academic_year_id: meta.academicYearId,
                        _academicYearData: e.target.value 
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select
                      required
                      value={duesFormData.class_id}
                      onChange={(e) => setDuesFormData({ ...duesFormData, class_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || !duesFormData.academic_year_id || !duesFormData.class_id}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {loading ? <LoadingSpinner size="sm" /> : <IndianRupee size={18} />}
                      Generate Dues
                    </button>
                  </div>
                </form>
              </div>

              {showConsolidatedView && (
                <div className="mt-8 border-t pt-8">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Consolidated Dues Viewer</h3>
                  <ConsolidatedDuesList 
                    campusId={campusId} 
                    academicYearId={duesFormData.academic_year_id}
                    classId={duesFormData.class_id}
                  />
                </div>
              )}
            </Card>
          )}
        </>
      )}
      
      <Modal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
        title={confirmAction.title}
        size="sm"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-6">{confirmAction.message}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 text-gray-600 bg-white border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction.onConfirm}
              className={`px-4 py-2 text-white rounded-lg ${
                confirmAction.type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FeeConfigurationPage;
