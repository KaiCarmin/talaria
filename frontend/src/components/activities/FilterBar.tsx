import React from 'react';

interface FilterBarProps {
  onSearch: (value: string) => void;
  onTypeFilter: (type: string) => void;
  onClearFilters: () => void;
  activityType: string;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
  onSearch, 
  onTypeFilter, 
  onClearFilters,
  activityType 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search activities by name..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Activity Type Filter */}
        <div className="w-48">
          <select
            value={activityType}
            onChange={(e) => onTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="Run">Run</option>
            <option value="Race">Race</option>
            <option value="Workout">Workout</option>
            <option value="LongRun">Long Run</option>
            <option value="TrailRun">Trail Run</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
