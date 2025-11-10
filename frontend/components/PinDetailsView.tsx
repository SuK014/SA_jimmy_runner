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
  onAddFriend: () => void;
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
  onAddFriend,
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
      <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
        <img
          src={selectedPin.image 
            ? (typeof selectedPin.image === 'string' 
              ? selectedPin.image.startsWith('data:') 
                ? selectedPin.image 
                : `data:image/jpeg;base64,${selectedPin.image}`
              : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop')
            : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
          alt={selectedPin.name || 'Pin'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
          }}
        />
      </div>

      {/* Pin Name with Edit Icon */}
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

      {/* Participants */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Participate
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {selectedPin.participants && selectedPin.participants.length > 0 ? (
            selectedPin.participants.map((participantId: string, index: number) => {
              const participant = participants.find(p => p.user_id === participantId) || {
                user_id: participantId,
                display_name: participantId,
              };
              return (
                <span
                  key={participantId}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    participant.user_id === user?.user_id
                      ? 'bg-purple-200 text-purple-800 border-2 border-purple-400'
                      : getParticipantColor(index)
                  }`}
                >
                  {participant.user_id === user?.user_id && '👤 '}
                  {participant.display_name || participantId}
                </span>
              );
            })
          ) : (
            <span className="text-sm text-gray-500">No participants</span>
          )}
          <button
            onClick={onAddFriend}
            className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center hover:bg-blue-300 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Photo & Log */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Photo & log
        </label>
        <div className="flex flex-wrap gap-3">
          {selectedPin.image && (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shadow-sm relative group">
              <img
                src={typeof selectedPin.image === 'string' 
                  ? selectedPin.image.startsWith('data:') 
                    ? selectedPin.image 
                    : `data:image/jpeg;base64,${selectedPin.image}`
                  : 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop'}
                alt="Pin photo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop';
                }}
              />
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
