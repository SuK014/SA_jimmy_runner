'use client';

import { useState, useRef, useEffect } from 'react';
import type { Pin } from '@/lib/types';

interface PinCardProps {
  pin: Pin;
  onDelete?: (pin: Pin) => void;
}

export function PinCard({ pin, onDelete }: PinCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(false);
    if (onDelete) {
      onDelete(pin);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative">
      {/* Dropdown Menu Button */}
      {onDelete && (
        <div className="absolute top-2 right-2 z-10" ref={dropdownRef}>
          <button
            onClick={handleMenuClick}
            className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            aria-label="More options"
          >
            <svg
              className="w-4 h-4 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-20">
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
      )}

      {pin.image && (
        <img
          src={`data:image/png;base64,${pin.image}`}
          alt={pin.name || 'Pin image'}
          className="w-full h-32 object-cover rounded mb-3"
        />
      )}
      <h4 className="font-semibold text-gray-800 mb-1">{pin.name || 'Unnamed Pin'}</h4>
      {pin.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{pin.description}</p>
      )}
      {pin.location && (
        <p className="text-xs text-gray-500">Location: {pin.location}</p>
      )}
      {pin.expenses && pin.expenses.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {pin.expenses.length} expense(s)
        </div>
      )}
    </div>
  );
}