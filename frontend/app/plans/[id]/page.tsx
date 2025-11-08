'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { planApi } from '@/lib/api';
import type { PlanWithDetails, Pin } from '@/lib/types';
import { AuthGuard } from '@/components/AuthGuard';
import { AddFriendModal } from '@/components/AddFriendModal';
import { PinCard } from '@/components/PinCard';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const [plan, setPlan] = useState<PlanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await planApi.getPlanById(planId);
      if (response.data) {
        const data = response.data as any;
        // Transform the response to match our type
        const transformedPlan: PlanWithDetails = {
          trip_id: data.trip?.trip_id || planId,
          name: data.trip?.name || '',
          description: data.trip?.description,
          image: data.trip?.image,
          whiteboards: (data.whiteboards || []).map((wb: any) => ({
            day: wb.day || 1,
            pins: wb.pins || [],
          })),
        };
        setPlan(transformedPlan);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plan details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/plans')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Plans
                </button>
                <h1 className="text-2xl font-bold text-indigo-600">Plan Details</h1>
              </div>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                + Add Friends
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-lg text-gray-600">Loading plan details...</div>
            </div>
          ) : plan ? (
            <div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{plan.name}</h2>
                {plan.description && (
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                )}
              </div>

              {plan.whiteboards.map((whiteboard, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Day {whiteboard.day}
                  </h3>
                  {whiteboard.pins.length === 0 ? (
                    <p className="text-gray-500">No pins for this day</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {whiteboard.pins.map((pin) => (
                        <PinCard key={pin.pin_id} pin={pin} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Plan not found</p>
            </div>
          )}
        </div>

        {showAddFriendModal && (
          <AddFriendModal
            planId={planId}
            onClose={() => setShowAddFriendModal(false)}
            onSuccess={() => {
              setShowAddFriendModal(false);
              fetchPlanDetails();
            }}
          />
        )}
      </div>
    </AuthGuard>
  );
}