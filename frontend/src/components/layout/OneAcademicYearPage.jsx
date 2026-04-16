import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import AcademicYearSelector from '../forms/AcademicYearSelector.jsx';
import { Plus } from 'lucide-react';

const OneAcademicYearPage = ({ 
  title = "Management",
  children,
  filterOptions = { academic_years: [], classes: [] },
  filters,
  setFilters,
  onFiltersChange,
  showClassFilter = true,
  showSearchFilter = true,
  searchPlaceholder = "",
  customFilters = null,
  instructions = null,
  addButtonText = "Add Item",
  onAddClick,
  canAdd = true,
  extraHeaderContent = null
}) => {
  const { getCampusName, getDefaultAcademicYearId, hasPermission } = useAuth();

  // Handle filter changes and notify parent immediately
  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // Immediately call the parent's filter change handler
    if (onFiltersChange) {
      console.log('🔄 Filter changed:', filterName, '=', value);
      console.log('📋 New filters:', newFilters);
      onFiltersChange(newFilters);
    }
  };

  // Debounced search to avoid too many API calls
  useEffect(() => {
    if (filters.search !== undefined) {
      const timeoutId = setTimeout(() => {
        if (onFiltersChange) {
          console.log('🔍 Debounced search triggered:', filters.search);
          onFiltersChange(filters);
        }
      }, 500); // 500ms delay for search

      return () => clearTimeout(timeoutId);
    }
  }, [filters.search]);

  useEffect(() => {
    const def = getDefaultAcademicYearId();
    if (def && (!filters.academic_year_id || String(filters.academic_year_id) === '')) {
      const newFilters = { ...filters, academic_year_id: String(def) };
      setFilters(newFilters);
      if (onFiltersChange) onFiltersChange(newFilters);
    }
  }, [getDefaultAcademicYearId]);

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters = { search: '', academic_year_id: '', class_id: '' };
    setFilters(clearedFilters);
    
    if (onFiltersChange) {
      console.log('🧹 Clearing all filters');
      onFiltersChange(clearedFilters);
    }
  };

  // Clear individual filter
  const clearFilter = (filterName) => {
    const newFilters = { ...filters, [filterName]: '' };
    setFilters(newFilters);
    
    if (onFiltersChange) {
      console.log('🗑️ Clearing filter:', filterName);
      onFiltersChange(newFilters);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-600 mt-1">Campus: {getCampusName()}</p>
        </div>
        <div className="flex gap-2">
          {extraHeaderContent}
          {canAdd && onAddClick && (
            <button
              onClick={onAddClick}
              className="btn-primary whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Search Filter */}
              {showSearchFilter && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`}
                    value={filters.search || ''}
                    onChange={(e) => {
                      const newFilters = { ...filters, search: e.target.value };
                      setFilters(newFilters);
                      // Don't trigger immediate search for search field - let debounce handle it
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Academic Year Filter */}
              <div className={showSearchFilter ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={filters.academic_year_id || ''}
                  onChange={(e) => handleFilterChange('academic_year_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Academic Years</option>
                  {filterOptions.academic_years?.map(year => (
                    <option key={year.academic_year_id} value={year.academic_year_id}>
                      {year.year_name} - {year.curriculum_code} - {year.medium}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Class Filter */}
              {showClassFilter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <select
                    value={filters.class_id || ''}
                    onChange={(e) => handleFilterChange('class_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {filterOptions.classes?.map(cls => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Filters */}
              {customFilters}
            </div>
            
            {/* Filter Summary */}
            {(filters.search || filters.academic_year_id || filters.class_id) && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: "{filters.search}"
                      <button
                        onClick={() => clearFilter('search')}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.academic_year_id && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Academic Year: {filterOptions.academic_years?.find(y => y.academic_year_id == filters.academic_year_id)?.year_name || 'Unknown'}
                      <button
                        onClick={() => clearFilter('academic_year_id')}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-600 hover:bg-green-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {filters.class_id && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Class: {filterOptions.classes?.find(c => c.class_id == filters.class_id)?.class_name || 'Unknown'}
                      <button
                        onClick={() => clearFilter('class_id')}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-600 hover:bg-purple-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-medium px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Content */}
      {children}
    </div>
  );
};

export default OneAcademicYearPage;
