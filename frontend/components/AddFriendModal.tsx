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

      // Add each friend to the plan (backend accepts one email at a time)
      const results: { email: string; success: boolean; error?: string }[] = [];
      
      for (const email of emailArray) {
        try {
          console.log('Adding friend:', { email, trip_id: planId });
          const requestData = {
            email: email,
            trip_id: planId,
          };
          console.log('Request data:', JSON.stringify(requestData));
          
          await planApi.addFriendsToPlan(requestData);
          console.log(`Successfully added ${email}`);
          results.push({ email, success: true });
        } catch (err: any) {
          console.error(`Failed to add ${email}:`, err);
          console.error('Error response:', err.response?.data);
          console.error('Error status:', err.response?.status);
          
          // Parse error message to provide better user feedback
          let errorMessage = err.response?.data?.message || err.message || 'Unknown error';
          
          // Check if user is already in the trip (unique constraint violation)
          if (errorMessage.includes('Unique constraint') || 
              errorMessage.includes('unique constraint') ||
              errorMessage.includes('already exists') ||
              errorMessage.includes('user_id') && errorMessage.includes('trip_id')) {
            errorMessage = `Your friend ${email} is already in the trip.`;
            // Treat as success since the user is already added
            results.push({ email, success: true, error: errorMessage });
          } else if (errorMessage.includes('FindByID') || 
                     errorMessage.includes('ErrNotFound') || 
                     errorMessage.includes('not found')) {
            // User not found
            errorMessage = `User with email ${email} not found. Please make sure the user is registered.`;
            results.push({ 
              email, 
              success: false, 
              error: errorMessage
            });
          } else {
            // Other errors
            results.push({ 
              email, 
              success: false, 
              error: errorMessage
            });
          }
        }
      }

      // Check results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      const alreadyAdded = results.filter(r => r.success && r.error?.includes('already in the trip'));

      if (successful.length === 0) {
        // All failed
        const errorMessages = failed.map(r => `${r.email}: ${r.error}`).join('; ');
        setError(`Failed to add all friends: ${errorMessages}`);
        setLoading(false);
        return;
      }

      // Build success/warning message
      const messages: string[] = [];
      const newlyAdded = successful.length - alreadyAdded.length;
      
      if (newlyAdded > 0) {
        messages.push(`Successfully added ${newlyAdded} friend${newlyAdded > 1 ? 's' : ''}`);
      }
      
      if (alreadyAdded.length > 0) {
        const alreadyAddedEmails = alreadyAdded.map(r => r.email).join(', ');
        messages.push(`${alreadyAdded.length} friend${alreadyAdded.length > 1 ? 's are' : ' is'} already in the trip: ${alreadyAddedEmails}`);
      }

      if (failed.length > 0) {
        const failedEmails = failed.map(r => r.email).join(', ');
        messages.push(`Failed to add: ${failedEmails}`);
      }

      if (messages.length > 0) {
        setError(messages.join('. ') + '.');
      }

      // If we have any success, refresh and close
      if (successful.length > 0) {
        onSuccess();
        // Only close if all were successful or already added (no real failures)
        if (failed.length === 0) {
          onClose();
        }
      } else {
        // All failed - don't close, let user see the error
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Failed to add friends:', err);
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
            error.includes('Successfully') || error.includes('already in the trip')
              ? 'bg-green-100 border-green-400 text-green-700' 
              : error.includes('Warning:') 
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