import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  average_speed: number;
  start_date: string;
}

interface DayData {
  activities: Activity[];
  total_distance: number;
  total_time: number;
  count: number;
}

interface CalendarData {
  [date: string]: DayData;
}

interface ActivityCalendarProps {
  athleteId: number;
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ athleteId }) => {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  useEffect(() => {
    fetchCalendarData();
  }, [athleteId, year, month]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/activities/${athleteId}/calendar?year=${year}&month=${month}`
      );
      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const getIntensityClass = (distance: number) => {
    // Color coding based on distance
    if (distance === 0) return 'bg-gray-50';
    if (distance < 3000) return 'bg-green-100';
    if (distance < 8000) return 'bg-green-300';
    if (distance < 15000) return 'bg-green-500';
    return 'bg-green-700';
  };

  const getTextColorClass = (distance: number) => {
    if (distance >= 15000) return 'text-white';
    if (distance >= 8000) return 'text-gray-900';
    return 'text-gray-700';
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);

  // Generate calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ day: null, date: null });
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({ day, date: dateString });
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthName} {year}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={previousMonth}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              \u2190 Previous
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Next \u2192
            </button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((cell, index) => {
            if (!cell.day) {
              return <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded-lg"></div>;
            }

            const dayData = calendarData[cell.date!] || { activities: [], total_distance: 0, total_time: 0, count: 0 };
            const hasActivities = dayData.count > 0;
            const isToday = cell.date === new Date().toISOString().split('T')[0];
            const isSelected = cell.date === selectedDate;

            return (
              <div
                key={cell.date}
                onClick={() => hasActivities && setSelectedDate(isSelected ? null : cell.date!)}
                className={`h-24 rounded-lg p-2 cursor-pointer transition-all ${getIntensityClass(dayData.total_distance)} ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                } ${isSelected ? 'ring-2 ring-blue-700' : ''} ${hasActivities ? 'hover:opacity-80' : ''} ${
                  getTextColorClass(dayData.total_distance)
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="font-semibold text-sm">{cell.day}</div>
                  {hasActivities && (
                    <div className="flex-1 flex flex-col justify-end text-xs">
                      <div>{dayData.count} {dayData.count === 1 ? 'run' : 'runs'}</div>
                      <div className="font-medium">{formatDistance(dayData.total_distance)} km</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDate && calendarData[selectedDate] && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Close
            </button>
          </div>

          <div className="space-y-4">
            {calendarData[selectedDate].activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => navigate(`/activities/${activity.id}`)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{activity.name}</h4>
                    <p className="text-sm text-gray-500">{activity.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatDistance(activity.distance)} km</p>
                    <p className="text-sm text-gray-500">{formatDuration(activity.moving_time)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{calendarData[selectedDate].count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDistance(calendarData[selectedDate].total_distance)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(calendarData[selectedDate].total_time)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityCalendar;
