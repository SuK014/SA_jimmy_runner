import Link from 'next/link';
import type { Trip } from '@/lib/types';

interface PlanCardProps {
  plan: Trip;
}

export function PlanCard({ plan }: PlanCardProps) {
  return (
    <Link href={`/plans/${plan.trip_id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{plan.description}</p>
        )}
        <div className="flex items-center text-sm text-gray-500">
          <span>{plan.whiteboards?.length || 0} day(s)</span>
        </div>
      </div>
    </Link>
  );
}