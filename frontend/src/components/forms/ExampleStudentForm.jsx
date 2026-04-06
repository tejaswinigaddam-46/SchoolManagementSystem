import React, { useState } from 'react';
import AcademicYearSelector from './AcademicYearSelector.jsx';
import { toast } from 'react-hot-toast';

const ExampleStudentForm = ({ campusId }) => {
  const [formData, setFormData] = useState({
    student_name: '',
    academic_year_data: {
      year_name: '',
      curriculum_id: '',
      medium: '',
      academic_year_id: null
    }
  });

  const [validationState, setValidationState] = useState({
    isValid: null,
    academicYearId: null,
    message: ''
  });

  const [errors, setErrors] = useState({});

  const handleAcademicYearChange = (event, additionalData) => {
    const academicYearData = event.target.value;
    
    setFormData(prev => ({
      ...prev,
      academic_year_data: academicYearData
    }));

    // Clear academic year related errors
    if (errors.academic_year) {
      setErrors(prev => ({
        ...prev,
        academic_year: null
      }));
    }
  };

  const handleValidationChange = (validation) => {
    setValidationState(validation);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validate student name
    if (!formData.student_name.trim()) {
      newErrors.student_name = 'Student name is required';
    }

    // Validate academic year selection
    if (!validationState.isValid) {
      newErrors.academic_year = 'Please select a valid academic year combination';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const submissionData = {
      student_name: formData.student_name,
      academic_year_id: validationState.academicYearId,
      // Include individual fields for reference
      year_name: formData.academic_year_data.year_name,
      curriculum_id: formData.academic_year_data.curriculum_id,
      medium: formData.academic_year_data.medium
    };

    console.log('Submitting student data:', submissionData);
    
    try {
      // Here you would call your student creation API
      // const response = await studentService.createStudent(campusId, submissionData);
      
      toast.success('Student created successfully!');
      
      // Reset form
      setFormData({
        student_name: '',
        academic_year_data: {
          year_name: '',
          curriculum_id: '',
          medium: '',
          academic_year_id: null
        }
      });
      setValidationState({
        isValid: null,
        academicYearId: null,
        message: ''
      });
      setErrors({});
      
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Error creating student. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Student</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Name Input */}
        <div>
          <label htmlFor="student_name" className="block text-sm font-medium text-gray-700 mb-2">
            Student Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="student_name"
            name="student_name"
            value={formData.student_name}
            onChange={handleInputChange}
            className={`
              w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.student_name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            `}
            placeholder="Enter student name"
          />
          {errors.student_name && (
            <p className="mt-1 text-sm text-red-600">{errors.student_name}</p>
          )}
        </div>

        {/* Academic Year Selector */}
        <AcademicYearSelector
          campusId={campusId}
          value={formData.academic_year_data}
          onChange={handleAcademicYearChange}
          onValidationChange={handleValidationChange}
          name="academic_year_selector"
          label="Academic Year Information"
          required={true}
          error={errors.academic_year}
          className="border rounded-lg p-4 bg-gray-50"
        />

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                student_name: '',
                academic_year_data: {
                  year_name: '',
                  curriculum_id: '',
                  medium: '',
                  academic_year_id: null
                }
              });
              setValidationState({
                isValid: null,
                academicYearId: null,
                message: ''
              });
              setErrors({});
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
          
          <button
            type="submit"
            disabled={!validationState.isValid}
            className={`
              px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${validationState.isValid 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            Create Student
          </button>
        </div>
      </form>

      {/* Debug Information */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information:</h3>
        <pre className="text-xs text-gray-600 overflow-auto">
          {JSON.stringify({
            formData,
            validationState,
            errors
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ExampleStudentForm;