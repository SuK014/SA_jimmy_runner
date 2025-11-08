'use client';

import { useState } from 'react';
import { planApi } from '@/lib/api';

interface AddFriendModalProps {
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFriendModal({ planId, onClose, onSuccess }: AddFriendModalProps) {
  const [userIds, setUserIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Split comma-separated user IDs
      const userIdArray = userIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

      if (userIdArray.length === 0) {
        setError('Please enter at least one user ID');
        setLoading(false);
        return;
      }

      await planApi.addFriendsToPlan({
        user_ids: userIdArray,
        trip_id: planId,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add friends');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Friends to Plan</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-ids" className="block text-sm font-medium text-gray-700 mb-1">
              User IDs (comma-separated) *
            </label>
            <input
              id="user-ids"
              type="text"
              value={userIds}
              onChange={(e) => setUserIds(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="user_id1, user_id2, user_id3"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter user IDs separated by commas
            </p>
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
              {loading ? 'Adding...' : 'Add Friends'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}