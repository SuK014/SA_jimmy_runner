'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import type { Trip } from '@/lib/types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PlanCardProps {
  plan: Trip;
  onDelete?: (tripId: string) => void;
}

export function PlanCard({ plan, onDelete }: PlanCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleImageSrc = () => {
    if (plan.image) {
      if (typeof plan.image === 'string') {
        return plan.image.startsWith('data:') 
          ? plan.image 
          : `data:image/jpeg;base64,${plan.image}`;
      }
      return plan.image;
    }
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    setShowDeleteModal(true);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
        {/* Dropdown Menu Button */}
        <div className="absolute top-2 right-2 z-10" ref={dropdownRef}>
          <button
            onClick={handleMenuClick}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="More options"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
              <div className="py-1">
                <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        <Link href={`/plans/${plan.trip_id}`}>
          <div className="cursor-pointer">
            {/* Image */}
            <div className="w-full h-48 overflow-hidden bg-gray-200">
              <img
                src={handleImageSrc()}
                alt={plan.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
                }}
              />
            </div>
            
            {/* Content */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{plan.name || 'Trip name'}</h3>
              {plan.description && (
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{plan.description}</p>
              )}
              <p className="text-gray-500 text-sm">
                {plan.dateRange || 'No dates set'}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && onDelete && (
        <DeleteConfirmModal
          planName={plan.name}
          onConfirm={() => {
            onDelete(plan.trip_id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}