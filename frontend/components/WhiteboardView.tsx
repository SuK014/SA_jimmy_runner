'use client';

import type { Pin } from '@/lib/types';
import { PinCard } from './PinCard';

interface WhiteboardViewProps {
  pins: Pin[];
  selectedPin: Pin | null;
  selectedDay: number;
  draggedPin: Pin | null;
  dragOverIndex: number | null;
  onPinClick: (pin: Pin) => void;
  onDeletePin: (pin: Pin) => void;
  onAddPin: () => void;
  onDragStart: (pin: Pin) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}

export function WhiteboardView({
  pins,
  selectedPin,
  selectedDay,
  draggedPin,
  dragOverIndex,
  onPinClick,
  onDeletePin,
  onAddPin,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: WhiteboardViewProps) {
  if (pins.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <div className="w-24 h-24 rounded-lg border-2 border-blue-300 bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <p className="text-blue-600 font-medium">Unnamed Pin</p>
          </div>
          <p className="text-gray-500 mb-4">No pins for Day {selectedDay}</p>
          <button
            onClick={onAddPin}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Pin
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {pins.map((pin, index) => (
        <div 
          key={pin.pin_id} 
          className="flex items-start gap-4"
          draggable
          onDragStart={() => onDragStart(pin)}
          onDragOver={(e) => onDragOver(e, index)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, index)}
        >
          {/* Connector - now shown for all pins including the first */}
          <div className="flex flex-col items-center justify-center self-stretch min-h-full">
            {/* Top line - always show for all pins */}
            <div className="w-0.5 flex-1 bg-gray-300"></div>
            {/* Circle in the middle - always centered */}
            <div className="w-3 h-3 border-2 border-gray-300 rounded-full bg-white flex-shrink-0"></div>
            {/* Bottom line - always show */}
            <div className="w-0.5 flex-1 bg-gray-300"></div>
          </div>
          <div 
            className={`flex-1 p-4 rounded-lg border-2 cursor-move transition-all relative ${
              selectedPin?.pin_id === pin.pin_id
                ? 'border-blue-500 bg-blue-100 shadow-md'
                : index === pins.length - 1 
                ? 'border-blue-400 bg-blue-50 shadow-sm hover:border-blue-500'
                : dragOverIndex === index
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
            onClick={() => onPinClick(pin)}
          >
            <PinCard pin={pin} onDelete={onDeletePin} />
          </div>
        </div>
      ))}
      <button
        onClick={onAddPin}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-gray-600"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-medium">Add Pin</span>
      </button>
    </>
  );
}
