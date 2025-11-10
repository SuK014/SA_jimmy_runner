'use client';

import type { Pin, Participant } from '@/lib/types';

interface PinDetailsViewProps {
    selectedPin: Pin;
    selectedDay: number;
    participants: Participant[];
    user: any;
    getParticipantColor: (index: number) => string;
    onBack: () => void;
    onEdit: (pin: Pin) => void;
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    imageInputRef: React.RefObject<HTMLInputElement>;
    isUploadingImage: boolean;
  }

  export function PinDetailsView({
    selectedPin,
    selectedDay,
    participants,
    user,
    getParticipantColor,
    onBack,
    onEdit,
    onImageUpload,
    imageInputRef,
    isUploadingImage,
  }: PinDetailsViewProps) {
  return (
    <>
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
      >
        ← Back to Day {selectedDay}
      </button>
      
           {/* Main Image */}
      <div 
        className="w-full h-64 rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center relative group cursor-pointer"
        onClick={() => !isUploadingImage && imageInputRef.current?.click()}
      >
        {selectedPin.image ? (
          <>
            <img
              src={typeof selectedPin.image === 'string' 
                ? selectedPin.image.startsWith('data:') 
                  ? selectedPin.image 
                  : `data:image/jpeg;base64,${selectedPin.image}`
                : ''}
              alt={selectedPin.name || 'Pin'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Edit overlay on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center">
                <svg className="w-12 h-12 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-white text-sm font-medium">Click to change image</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-gray-400">
            <svg className="w-24 h-24 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-500">Click to add image</p>
          </div>
        )}
        {isUploadingImage && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white text-sm">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Pin Name with Edit Icon and Invite Friend Button */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          {selectedPin.name || 'Unnamed Pin'}
        </h1>
        <button 
          onClick={() => onEdit(selectedPin)}
          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <div>
        <p className="text-gray-600 text-sm">
          {selectedPin.description || 'description'}
        </p>
      </div>

      {/* Location */}
      {selectedPin.location && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
          <p className="text-gray-600 text-sm">{selectedPin.location}</p>
        </div>
      )}

      {/* Expenses */}
      {selectedPin.expenses && selectedPin.expenses.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Expenses</label>
          <div className="space-y-2">
            {selectedPin.expenses.map((expense, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{expense.name}</span>
                <span className="text-gray-600">${expense.expense?.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants - Display names only, no add button */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Participate
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {selectedPin.participants && selectedPin.participants.length > 0 ? (
            selectedPin.participants.map((participantId: string, index: number) => {
              // Find participant from the participants list (trip participants from userTrip)
              const participant = participants.find(p => p.user_id === participantId);
              
              // Display name from userTrip - prioritize display_name, never show UUID if name exists
              const displayName = participant?.display_name || participantId;
              
              // Only show UUID if display_name is truly missing (shouldn't happen if fetchParticipants works)
              // Don't show email format - only show name or user_id as last resort
              const isEmail = displayName.includes('@');
              const finalDisplayName = isEmail ? (participant?.display_name || participantId) : displayName;
              
              return (
                <span
                  key={participantId}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    participantId === user?.user_id
                      ? 'bg-purple-200 text-purple-800 border-2 border-purple-400'
                      : getParticipantColor(index)
                  }`}
                >
                  {participantId === user?.user_id && '👤 '}
                  {finalDisplayName}
                </span>
              );
            })
          ) : (
            <span className="text-sm text-gray-500">No participants</span>
          )}
        </div>
      </div>

      {/* Photo & Log */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Photo & log
        </label>
        <div className="flex flex-wrap gap-3">
          {selectedPin.image ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shadow-sm relative group">
              <img
                src={typeof selectedPin.image === 'string' 
                  ? selectedPin.image.startsWith('data:') 
                    ? selectedPin.image 
                    : `data:image/jpeg;base64,${selectedPin.image}`
                  : ''}
                alt="Pin photo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Hide image on error and show icon instead
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                    parent.innerHTML = `
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    `;
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            disabled={isUploadingImage}
          />
          <button 
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingImage ? (
              <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
