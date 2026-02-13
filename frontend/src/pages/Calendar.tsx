import React from 'react';
import { useAuth } from '../context/AuthContext';
import ActivityCalendar from '../components/calendar/ActivityCalendar';

const Calendar: React.FC = () => {
  const { athlete } = useAuth();

  if (!athlete) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Please log in to view your calendar.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Calendar</h1>
        <p className="mt-2 text-gray-600">
          View your running activities in calendar format
        </p>
      </div>
      
      <ActivityCalendar athleteId={athlete.id} />
    </div>
  );
};

export default Calendar;
