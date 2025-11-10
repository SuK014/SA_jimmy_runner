'use client';

import { useState } from 'react';
import { planApi, authApi } from '@/lib/api';

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

      // Convert emails to user IDs
      const userIdArray: string[] = [];
      const notFoundEmails: string[] = [];
      
      for (const email of emailArray) {
        try {
          console.log(`Looking up user with email: ${email}`);
          const user = await authApi.getUserByEmail(email);
          console.log(`User found:`, user);
          
          // Handle different response formats
          const userId = user?.user_id || (user as any)?.userId || (user as any)?.UserID;
          
          if (userId) {
            userIdArray.push(userId);
            console.log(`Added user ID: ${userId} for email: ${email}`);
          } else {
            console.warn(`User found but no user_id field:`, user);
            notFoundEmails.push(email);
          }
        } catch (err: any) {
          console.error(`Failed to find user for email ${email}:`, err);
          console.error('Error details:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          
          // Check if it's a 404 or user not found
          if (err.response?.status === 404 || err.response?.status === 400) {
            notFoundEmails.push(email);
          } else {
            // For other errors, show the actual error message
            setError(`Error looking up ${email}: ${err.response?.data?.message || err.message}`);
            setLoading(false);
            return;
          }
        }
      }

      // Check if we found any users
      if (userIdArray.length === 0) {
        setError(`No users found for the provided email${emailArray.length > 1 ? 's' : ''}. Please make sure the users are registered.`);
        setLoading(false);
        return;
      }

      // Show warning if some emails weren't found
      if (notFoundEmails.length > 0 && userIdArray.length > 0) {
        setError(`Warning: Could not find users for: ${notFoundEmails.join(', ')}. Adding the users that were found.`);
        // Continue with adding the found users
      }

      // Add friends to plan
      console.log('Adding friends to plan:', { user_ids: userIdArray, trip_id: planId });
      await planApi.addFriendsToPlan({
        user_ids: userIdArray,
        trip_id: planId,
      });

      console.log('Successfully added friends to plan');
      
      // Success - close modal and refresh
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add friends:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || err.message || 'Failed to add friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Friends to Plan</h2>

        {error && (
          <div className={`mb-4 p-3 border rounded ${
            error.includes('Warning:') 
              ? 'bg-yellow-100 border-yellow-400 text-yellow-700' 
              : 'bg-red-100 border-red-400 text-red-700'
          }`}>
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
              Enter email addresses separated by commas. Users must be registered to be added.
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