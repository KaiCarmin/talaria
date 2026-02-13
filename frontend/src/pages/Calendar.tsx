import React from 'react';

const Calendar: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Calendar</h1>
      <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Calendar View
          </h2>
          <p className="text-gray-500">
            This page will display your activities in a calendar format.
            <br />
            <span className="text-sm">Coming in Phase 3.4</span>
          </p>
        </div>
    </div>
  );
};

export default Calendar;
