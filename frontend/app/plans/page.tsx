'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { planApi } from '@/lib/api';
import type { Trip } from '@/lib/types';
import { AuthGuard } from '@/components/AuthGuard';
import { CreatePlanModal } from '@/components/CreatePlanModal';
import { PlanCard } from '@/components/PlanCard';

export default function PlansPage() {
  const [plans, setPlans] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const trips = await planApi.getAllPlans();
      setPlans(trips);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await logout();
    router.push('/login');
  };

  const handleDeletePlan = async (tripId: string) => {
    try {
      setDeletingTripId(tripId);
      await planApi.deletePlan(tripId);
      // Remove the plan from the list immediately
      setPlans(plans.filter(plan => plan.trip_id !== tripId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete plan');
    } finally {
      setDeletingTripId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <nav className="bg-blue-100 shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo Box */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Jimmy Runner
                </h1>
              </div>
              
              {/* Icons */}
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-700 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                {/* User Icon with Dropdown */}
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="p-2 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                          <p className="font-medium">{user?.name || user?.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* New Trip Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors font-medium"
            >
              new trip
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Loading plans...</div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No plans yet. Create your first plan!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <PlanCard 
                  key={plan.trip_id} 
                  plan={plan}
                  onDelete={handleDeletePlan}
                />
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={async () => {
              setShowCreateModal(false);
              // Add a small delay to ensure backend has processed the user-trip association
              await new Promise(resolve => setTimeout(resolve, 500));
              fetchPlans();
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}