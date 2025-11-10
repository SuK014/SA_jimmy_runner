'use client';

import type { PlanWithDetails, Participant } from '@/lib/types';

interface DayDetailsViewProps {
  plan: PlanWithDetails;
  selectedDay: number;
  startDate: Date | null;
  endDate: Date | null;
  dayDates: Map<number, { date: Date; time: string }>;
  isEditingDates: boolean;
  participants: Participant[];
  dayParticipants: Participant[];
  dayPhotos: string[];
  user: any;
  getParticipantColor: (index: number) => string;
  getImageSrc: () => string;
  updateStartDate: (day: number, month: number, year: number) => void;
  updateEndDate: (day: number, month: number, year: number) => void;
  getSelectedDayDate: () => { day: number; month: number; year: number; time: string };
  setIsEditingDates: (value: boolean) => void;
  planId: string;
}

export function DayDetailsView({
  plan,
  selectedDay,
  startDate,
  endDate,
  dayDates,
  isEditingDates,
  participants,
  dayParticipants,
  dayPhotos,
  user,
  getParticipantColor,
  getImageSrc,
  updateStartDate,
  updateEndDate,
  getSelectedDayDate,
  setIsEditingDates,
  planId,
}: DayDetailsViewProps) {
  const selectedDayDate = getSelectedDayDate();

  return (
    <>
      {/* Main Image */}
      <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
        <img
          src={getImageSrc()}
          alt={plan.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
          }}
        />
      </div>

      {/* Place Name with Edit Icon */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          {plan.name || 'Place Name'}
        </h1>
        <button 
          onClick={() => {
            if (isEditingDates && startDate) {
              localStorage.setItem(`trip_start_date_${planId}`, startDate.toISOString().split('T')[0]);
              console.log(`Saved start date: ${startDate.toISOString().split('T')[0]}`);
            }
            setIsEditingDates(!isEditingDates);
          }}
          className={`p-1.5 rounded transition-colors ${
            isEditingDates 
              ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
              : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
          title={isEditingDates ? 'Save changes' : 'Edit dates'}
        >
          {isEditingDates ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
        </button>
      </div>

      {/* Description */}
      <div>
        <p className="text-gray-600 text-sm">
          {plan.description || 'description'}
        </p>
      </div>

      {/* Date Range Inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <div className="flex gap-1 items-center">
            <input
              type="number"
              value={startDate ? startDate.getDate() : 1}
              onChange={(e) => {
                const day = parseInt(e.target.value) || 1;
                const month = startDate ? startDate.getMonth() + 1 : 1;
                const year = startDate ? startDate.getFullYear() : 2026;
                updateStartDate(day, month, year);
              }}
              disabled={!isEditingDates}
              className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                isEditingDates 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              min="1"
              max="31"
            />
            <span className="text-gray-600">/</span>
            <input
              type="number"
              value={startDate ? startDate.getMonth() + 1 : 1}
              onChange={(e) => {
                const month = parseInt(e.target.value) || 1;
                const day = startDate ? startDate.getDate() : 1;
                const year = startDate ? startDate.getFullYear() : 2026;
                updateStartDate(day, month, year);
              }}
              disabled={!isEditingDates}
              className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                isEditingDates 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              min="1"
              max="12"
            />
            <span className="text-gray-600">/</span>
            <input
              type="number"
              value={startDate ? startDate.getFullYear() : 2026}
              onChange={(e) => {
                const year = parseInt(e.target.value) || 2026;
                const day = startDate ? startDate.getDate() : 1;
                const month = startDate ? startDate.getMonth() + 1 : 1;
                updateStartDate(day, month, year);
              }}
              disabled={!isEditingDates}
              className={`w-16 px-2 py-1.5 text-sm border-2 rounded text-center ${
                isEditingDates 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              min="2020"
              max="2100"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <div className="flex gap-1 items-center">
            <input
              type="number"
              value={endDate ? endDate.getDate() : 1}
              onChange={(e) => {
                const day = parseInt(e.target.value) || 1;
                const month = endDate ? endDate.getMonth() + 1 : 1;
                const year = endDate ? endDate.getFullYear() : 2026;
                updateEndDate(day, month, year);
              }}
              disabled={!isEditingDates}
              className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                isEditingDates 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              min={startDate ? startDate.getDate() : 1}
              max="31"
            />
            <span className="text-gray-600">/</span>
            <input
              type="number"
              value={endDate ? endDate.getMonth() + 1 : 1}
              onChange={(e) => {
                const month = parseInt(e.target.value) || 1;
                const day = endDate ? endDate.getDate() : 1;
                const year = endDate ? endDate.getFullYear() : 2026;
                updateEndDate(day, month, year);
              }}
              disabled={!isEditingDates}
              className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                isEditingDates 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              min={startDate ? startDate.getMonth() + 1 : 1}
              max="12"
            />
            <span className="text-gray-600">/</span>
            <input
              type="number"
              value={endDate ? endDate.getFullYear() : 2026}
              onChange={(e) => {
                const year = parseInt(e.target.value) || 2026;
                const day = endDate ? endDate.getDate() : 1;
                const month = endDate ? endDate.getMonth() + 1 : 1;
                updateEndDate(day, month, year);
              }}
              disabled={!isEditingDates}
              className={`w-16 px-2 py-1.5 text-sm border-2 rounded text-center ${
                isEditingDates 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              min={startDate ? startDate.getFullYear() : 2020}
              max="2100"
            />
          </div>
          {startDate && endDate && endDate < startDate && (
            <p className="mt-1 text-xs text-red-500">
              End date must be after start date
            </p>
          )}
        </div>
        
        {startDate && endDate && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            Total days: {Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} (from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()})
          </div>
        )}
        
        {/* Selected Day Date & Time */}
        <div className="pt-3 border-t border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Day {selectedDay} :</span>
            <div className="flex gap-1 items-center">
              <input
                type="number"
                value={selectedDayDate.day}
                onChange={(e) => {
                  const day = parseInt(e.target.value) || 1;
                  const month = selectedDayDate.month;
                  const year = selectedDayDate.year;
                  const newDayDate = new Date(year, month - 1, day);
                  const dayData = dayDates.get(selectedDay);
                  if (dayData) {
                    // This would need to be handled by parent
                  }
                }}
                disabled={!isEditingDates}
                className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                  isEditingDates 
                    ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                }`}
                min="1"
                max="31"
              />
              <span className="text-gray-600">/</span>
              <input
                type="number"
                value={selectedDayDate.month}
                onChange={(e) => {
                  const month = parseInt(e.target.value) || 1;
                  const day = selectedDayDate.day;
                  const year = selectedDayDate.year;
                  const newDayDate = new Date(year, month - 1, day);
                  const dayData = dayDates.get(selectedDay);
                  if (dayData) {
                    // This would need to be handled by parent
                  }
                }}
                disabled={!isEditingDates}
                className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                  isEditingDates 
                    ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                }`}
                min="1"
                max="12"
              />
              <span className="text-gray-600">/</span>
              <input
                type="number"
                value={selectedDayDate.year}
                onChange={(e) => {
                  const year = parseInt(e.target.value) || 2026;
                  const day = selectedDayDate.day;
                  const month = selectedDayDate.month;
                  const newDayDate = new Date(year, month - 1, day);
                  const dayData = dayDates.get(selectedDay);
                  if (dayData) {
                    // This would need to be handled by parent
                  }
                }}
                disabled={!isEditingDates}
                className={`w-16 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                  isEditingDates 
                    ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                }`}
                min="2020"
                max="2100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      {(dayParticipants.length > 0 || participants.length > 0) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Participate
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {participants.map((participant, index) => (
              <span
                key={participant.user_id}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  participant.user_id === user?.user_id
                    ? 'bg-purple-200 text-purple-800 border-2 border-purple-400'
                    : getParticipantColor(index)
                }`}
              >
                {participant.user_id === user?.user_id && '👤 '}
                {participant.display_name || participant.user_id}
              </span>
            ))}
            {dayParticipants
              .filter(p => !participants.some(tp => tp.user_id === p.user_id))
              .map((participant, index) => (
                <span
                  key={participant.user_id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${getParticipantColor(index + participants.length)}`}
                >
                  {participant.display_name || participant.user_id}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {dayPhotos.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Photo & log
          </label>
          <div className="flex flex-wrap gap-3">
            {dayPhotos.map((photo, index) => (
              <div key={index} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
