import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClassesSection from '../components/forms/ClassesSection';

const ClassManagement = () => {
  const { campusId, getCampusName } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl text-secondary mb-2">Class Management</h1>
        <p className="text-secondary-600">
          Campus: {getCampusName()}
        </p>
      </div>

      <ClassesSection campusId={campusId} />
    </div>
  );
};

export default ClassManagement;
