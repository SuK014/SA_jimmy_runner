'use client';

import { useState, useRef } from 'react';
import { planApi } from '@/lib/api';
import type { Expense, Participant } from '@/lib/types';

interface CreatePinModalProps {
  whiteboardId: string;
  onClose: () => void;
  onSuccess: () => void;
  existingPin?: {
    pin_id: string;
    name?: string;
    description?: string;
    image?: string;
    location?: number;
    expenses?: Expense[];
    participants?: string[];
  } | null;
}

export function CreatePinModal({ whiteboardId, onClose, onSuccess, existingPin }: CreatePinModalProps) {
  const [name, setName] = useState(existingPin?.name || '');
  const [description, setDescription] = useState(existingPin?.description || '');
  const [location, setLocation] = useState(existingPin?.location?.toString() || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existingPin?.image || null);
  const [expenses, setExpenses] = useState<Expense[]>(existingPin?.expenses || []);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(existingPin?.participants || []);
  const [availableParticipants, setAvailableParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available participants (trip participants)
  useState(() => {
    // This would need to be passed as prop or fetched here
    // For now, we'll handle it via props or context
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setError('');
      
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

  const handleAddExpense = () => {
    setExpenses([...expenses, { name: '', expense: 0 }]);
  };

  const handleRemoveExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const handleExpenseChange = (index: number, field: 'name' | 'expense', value: string | number) => {
    const updated = [...expenses];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setExpenses(updated);
  };

  const handleToggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId));
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('=== PIN CREATION START ===');
      console.log('Whiteboard ID:', whiteboardId);
      
      // Validate whiteboard ID
      if (!whiteboardId || whiteboardId.trim() === '') {
        throw new Error('Whiteboard ID is required');
      }

      const pinData = {
        name: name || undefined,
        description: description || undefined,
        location: location ? parseFloat(location) : undefined,
        expenses: expenses.filter(e => e.name && e.expense).map(e => ({
          user_id: e.user_id,
          name: e.name,
          expense: e.expense,
        })),
        participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
      };

      console.log('Pin data to send:', JSON.stringify(pinData, null, 2));

      let pinId: string;
      
      if (existingPin) {
        // Update existing pin
        // TODO: Add updatePin API method
        throw new Error('Update pin not yet implemented');
      } else {
        // Create new pin
        console.log('Calling planApi.createPin...');
        const response = await planApi.createPin(whiteboardId, pinData);
        console.log('Raw response:', response);
        console.log('Response type:', typeof response);
        console.log('Response keys:', response ? Object.keys(response) : 'null/undefined');
        
        // The backend returns the gRPC response directly, which should have pinId field
        // But it might be wrapped in a data field by the API layer
        const responseData = response as any;
        
        // Log all possible paths
        console.log('Checking response paths:');
        console.log('  response.data?.pinId:', responseData.data?.pinId);
        console.log('  response.data?.pin_id:', responseData.data?.pin_id);
        console.log('  response.data?.PinId:', responseData.data?.PinId);
        console.log('  response.pinId:', responseData.pinId);
        console.log('  response.pin_id:', responseData.pin_id);
        console.log('  response.PinId:', responseData.PinId);
        console.log('  response.success:', responseData.success);
        
        // Try multiple possible field names (backend might use different casing)
        pinId = responseData.data?.pinId || 
                responseData.data?.pin_id || 
                responseData.data?.PinId ||
                responseData.pinId || 
                responseData.pin_id || 
                responseData.PinId;
        
        // Log the response for debugging
        if (!pinId) {
          console.error('=== PIN CREATION FAILED - No pin ID in response ===');
          console.error('Full response object:', JSON.stringify(response, null, 2));
          throw new Error('Failed to get pin ID from response. Check console for details.');
        }
        
        console.log('✅ Pin created successfully with ID:', pinId);
      }

      // Upload image if provided
      if (imageFile) {
        try {
          console.log('Uploading image for pin:', pinId);
          await planApi.uploadPinImage(pinId, imageFile);
          console.log('✅ Image uploaded successfully');
        } catch (imgError: any) {
          console.error('❌ Failed to upload image:', imgError);
          // Don't throw - pin was created successfully, just image upload failed
          setError('Pin created but image upload failed: ' + (imgError.response?.data?.message || imgError.message || 'Unknown error'));
          // Still call onSuccess since pin was created
        }
      }

      console.log('=== PIN CREATION SUCCESS - Calling onSuccess ===');
      // Only call onSuccess if pin was created successfully
      onSuccess();
    } catch (err: any) {
      console.error('=== PIN CREATION ERROR ===');
      console.error('Error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error response status:', err.response.status);
      }
      setError(err.response?.data?.message || err.message || 'Failed to create pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {existingPin ? 'Edit Pin' : 'Create New Pin'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="pin-name" className="block text-sm font-medium text-gray-700 mb-1">
              Pin Name
            </label>
            <input
              id="pin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter pin name"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="pin-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="pin-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter pin description"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="pin-location" className="block text-sm font-medium text-gray-700 mb-1">
              Location (coordinates)
            </label>
            <input
              id="pin-location"
              type="number"
              step="0.000001"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter location coordinates"
            />
          </div>

          {/* Image */}
          <div>
            <label htmlFor="pin-image" className="block text-sm font-medium text-gray-700 mb-1">
              Pin Image
            </label>
            <input
              ref={fileInputRef}
              id="pin-image"
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

          {/* Expenses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expenses
            </label>
            <div className="space-y-2">
              {expenses.map((expense, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={expense.name || ''}
                    onChange={(e) => handleExpenseChange(index, 'name', e.target.value)}
                    placeholder="Expense name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={expense.expense || 0}
                    onChange={(e) => handleExpenseChange(index, 'expense', parseFloat(e.target.value) || 0)}
                    placeholder="Amount"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddExpense}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                + Add Expense
              </button>
            </div>
          </div>

          {/* Participants - This would need to fetch available participants */}
          {/* For now, we'll use a simple text input for participant IDs */}
          <div>
            <label htmlFor="pin-participants" className="block text-sm font-medium text-gray-700 mb-1">
              Participants (comma-separated user IDs)
            </label>
            <input
              id="pin-participants"
              type="text"
              value={selectedParticipants.join(', ')}
              onChange={(e) => {
                const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id.length > 0);
                setSelectedParticipants(ids);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="user_id1, user_id2, user_id3"
            />
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
              {loading ? (existingPin ? 'Updating...' : 'Creating...') : (existingPin ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
