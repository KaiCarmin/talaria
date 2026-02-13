import React from 'react';
import { useAuth } from '../context/AuthContext';
import ActivitiesTable from '../components/activities/ActivitiesTable';

const Activities: React.FC = () => {
  const { athlete } = useAuth();

  if (!athlete) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Please log in to view activities.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
        <p className="mt-2 text-gray-600">
          View and manage all your running activities
        </p>
      </div>
      
      <ActivitiesTable athleteId={athlete.id} />
    </div>
  );
};

export default Activities;
