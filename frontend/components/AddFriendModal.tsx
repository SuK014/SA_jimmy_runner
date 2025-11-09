'use client';

import { useState } from 'react';
import { planApi } from '@/lib/api';

interface AddFriendModalProps {
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFriendModal({ planId, onClose, onSuccess }: AddFriendModalProps) {
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Split comma-separated emails
      const emailArray = emails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emailArray.length === 0) {
        setError('Please enter at least one email address');
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emailArray.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        setError(`Invalid email format: ${invalidEmails.join(', ')}`);
        setLoading(false);
        return;
      }

      // TODO: Convert emails to user IDs
      // For now, we'll need to add a backend API endpoint to get user IDs from emails
      // Or modify the backend to accept emails directly
      // For now, assuming we have an API to get user by email
      // This is a placeholder - you'll need to implement getUserByEmail API
      const userIdArray: string[] = [];
      for (const email of emailArray) {
        try {
          // This would need a new API endpoint: getUserByEmail
          // For now, we'll need to add this to the backend
          // const user = await authApi.getUserByEmail(email);
          // userIdArray.push(user.user_id);
          
          // Temporary: If backend accepts emails, we can modify AddFriendRequest
          // For now, showing error that this needs backend support
          setError('Email lookup not yet implemented. Please use user IDs for now, or add getUserByEmail API endpoint.');
          setLoading(false);
          return;
        } catch (err: any) {
          setError(`User not found for email: ${email}`);
          setLoading(false);
          return;
        }
      }

      if (userIdArray.length === 0) {
        setError('No valid users found');
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
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-1">
              Email Addresses (comma-separated) *
            </label>
            <input
              id="emails"
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter email addresses separated by commas
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