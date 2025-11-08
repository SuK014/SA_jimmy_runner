import type { Pin } from '@/lib/types';

interface PinCardProps {
  pin: Pin;
}

export function PinCard({ pin }: PinCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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