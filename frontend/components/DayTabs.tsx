'use client';

interface DayTabsProps {
  days: number[];
  selectedDay: number;
  onDayClick: (day: number) => void;
  hasWhiteboard: (day: number) => boolean;
}

export function DayTabs({ days, selectedDay, onDayClick, hasWhiteboard }: DayTabsProps) {
  return (
    <div className="border-b-2 border-gray-200 bg-white flex-shrink-0">
      <div className="flex gap-1 px-4 py-3 overflow-x-auto">
        {days.map((day) => {
          const hasWb = hasWhiteboard(day);
          return (
            <button
              key={day}
              onClick={() => onDayClick(day)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap border-2 ${
                selectedDay === day
                  ? 'bg-green-100 text-green-800 border-black shadow-sm'
                  : hasWb
                  ? 'text-gray-700 hover:bg-gray-50 border-transparent'
                  : 'text-gray-400 hover:bg-gray-50 border-transparent'
              }`}
            >
              Day {day}
              {selectedDay === day && (
                <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
