'use client';

import { useState, useRef } from 'react';
import { planApi } from '@/lib/api';

interface CreatePlanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create the trip
      const createResponse = await planApi.createPlan({ 
        name, 
        description,
        startDate,
        endDate,
      });
      
      const tripId = (createResponse as any).TripId || 
                    createResponse.data?.trip_id ||
                    (createResponse as any).data?.TripId;

      if (!tripId) {
        throw new Error('Failed to get trip ID from response');
      }

      // Store start date in localStorage for date calculations
      if (startDate) {
        localStorage.setItem(`trip_start_date_${tripId}`, startDate);
        console.log(`Stored start date for trip ${tripId}: ${startDate}`);
      }

      // Upload image if provided
      if (imageFile) {
        try {
          await planApi.uploadTripImage(tripId, imageFile);
        } catch (imgError: any) {
          console.error('Failed to upload image:', imgError);
          // Don't fail the whole operation if image upload fails
          setError('Plan created but image upload failed: ' + (imgError.response?.data?.message || 'Unknown error'));
        }
      }

      // Create whiteboards for ALL days in date range if dates are provided
      if (startDate && endDate) {
        const days = calculateDays(startDate, endDate);
        console.log(`Creating whiteboards for ${days} days (date range: ${startDate} to ${endDate})`);
        
        // Backend creates day 1 whiteboard automatically
        // Create whiteboards for days 2, 3, 4, etc. up to the total days
        const whiteboardPromises = [];
        for (let day = 2; day <= days; day++) {
          whiteboardPromises.push(
            planApi.createWhiteboard(tripId, day).catch((wbError: any) => {
              console.error(`Failed to create whiteboard for day ${day}:`, wbError);
              return null; // Return null on error so Promise.all doesn't fail
            })
          );
        }
        
        // Wait for all whiteboards to be created
        await Promise.all(whiteboardPromises);
        console.log(`Finished creating whiteboards. Total days: ${days}`);
        
        // Small delay to ensure backend has processed all whiteboards
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Plan</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name *
            </label>
            <input
              id="plan-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter plan name"
            />
          </div>

          <div>
            <label htmlFor="plan-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="plan-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter plan description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="text-sm text-gray-600">
              Trip duration: {calculateDays(startDate, endDate)} day(s)
            </div>
          )}

          <div>
            <label htmlFor="plan-image" className="block text-sm font-medium text-gray-700 mb-1">
              Trip Image
            </label>
            <input
              ref={fileInputRef}
              id="plan-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {imagePreview && (
              <div className="mt-2 relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}