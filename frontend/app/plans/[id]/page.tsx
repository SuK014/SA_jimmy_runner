'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { planApi } from '@/lib/api';
import type { PlanWithDetails, Pin, Participant } from '@/lib/types';
import { AuthGuard } from '@/components/AuthGuard';
import { AddFriendModal } from '@/components/AddFriendModal';
import { CreatePinModal } from '@/components/CreatePinModal';
import { DayDetailsView } from '@/components/DayDetailsView';
import { PinDetailsView } from '@/components/PinDetailsView';
import { WhiteboardView } from '@/components/WhiteboardView';
import { DayTabs } from '@/components/DayTabs';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const [plan, setPlan] = useState<PlanWithDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showCreatePinModal, setShowCreatePinModal] = useState(false);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'pin'>('day'); // 'day' or 'pin'
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dayDates, setDayDates] = useState<Map<number, { date: Date; time: string }>>(new Map());
  const [isEditingDates, setIsEditingDates] = useState(false);
  const isCreatingWhiteboardsRef = useRef(false); // Add this ref
  const { user } = useAuth();
  const [pinToDelete, setPinToDelete] = useState<Pin | null>(null);
  const [isDeletingPin, setIsDeletingPin] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isWhiteboardLoading, setIsWhiteboardLoading] = useState(false);

  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
      fetchParticipants();
    }
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await planApi.getPlanById(planId);
      if (response.data) {
        const data = response.data as any;
        
        // Get whiteboard IDs from trip response
        const whiteboardIds = data.trip?.whiteboards || [];
        
        // Map whiteboard IDs to days
        const whiteboardMap = new Map<string, number>();
        const whiteboardsData = data.whiteboards?.whiteboards || [];
        
        // Create mapping: whiteboard ID -> day number
        whiteboardIds.forEach((wbId: string, index: number) => {
          const wbData = whiteboardsData.find((wb: any) => {
            // We need to match by index since we don't have whiteboard_id in the response
            return whiteboardsData.indexOf(wb) === index;
          });
          if (wbData) {
            whiteboardMap.set(wbId, wbData.day || index + 1);
          }
        });
        
        // Fetch full pin details for each whiteboard with better error handling
        // Process in batches to avoid overwhelming the server
        const batchSize = 5; // Process 5 pins at a time
        const whiteboardsWithPins = await Promise.all(
          whiteboardsData.map(async (wb: any, index: number) => {
            // Handle both cases: pins as array of objects (GetPinResponse) or array of strings (pin IDs)
            let pinIds: string[] = [];
            if (wb.pins && Array.isArray(wb.pins)) {
              if (wb.pins.length > 0) {
                // Check if first element is an object (GetPinResponse) or a string (pin ID)
                if (typeof wb.pins[0] === 'object' && wb.pins[0] !== null) {
                  // Extract pin IDs from GetPinResponse objects
                  pinIds = wb.pins.map((pin: any) => pin.pinId || pin.pin_id || pin.PinId || '').filter((id: string) => id);
                } else {
                  // Already an array of pin ID strings
                  pinIds = wb.pins;
                }
              }
            }
            
            // Process pins in batches
            const pins: Pin[] = [];
            for (let i = 0; i < pinIds.length; i += batchSize) {
              const batch = pinIds.slice(i, i + batchSize);
              const batchPins = await Promise.all(
                batch.map(async (pinId: string) => {
                  // Validate pinId is a valid ObjectID format (24 hex characters)
                  if (!pinId || typeof pinId !== 'string' || pinId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(pinId)) {
                    console.warn(`Invalid pin ID format: ${pinId}`, typeof pinId, pinId?.length);
                    // Return null to filter out invalid pins
                    return null;
                  }
                  
                  try {
                    const pinResponse = await planApi.getPinById(pinId);
                    if (pinResponse.data) {
                      const pinData = pinResponse.data as any;
                      return {
                        pin_id: pinId, // Use the pinId from the array
                        name: pinData.name,
                        description: pinData.description,
                        image: pinData.image,
                        location: pinData.location,
                        expenses: pinData.expense || pinData.expenses,
                        participants: pinData.participant || pinData.participants,
                        parents: pinData.parents,
                      } as Pin;
                    }
                  } catch (error: any) {
                    console.error(`Failed to fetch pin ${pinId}:`, error);
                    // Check if it's an auth error
                    if (error.response?.status === 401 || error.response?.status === 403) {
                      console.error('Authentication error when fetching pin. Token may be expired.');
                    }
                    // Return null to filter out failed pins
                    return null;
                  }
                  // Fallback - return null
                  return null;
                })
              );
              // Filter out null values (invalid or failed pins)
              const validPins = batchPins.filter((pin): pin is Pin => pin !== null);
              pins.push(...validPins);
              
              // Small delay between batches to avoid overwhelming the server
              if (i + batchSize < pinIds.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            // Sort pins based on parent relationships
            // Pins are ordered: first pin has no parent, each subsequent pin has the previous pin as parent
            const sortedPins = sortPinsByParents(pins);
            
            return {
              day: wb.day || index + 1,
              pins: sortedPins,
              whiteboard_id: whiteboardIds[index] || '',
            };
          })
        );
        
        const transformedPlan: PlanWithDetails = {
          trip_id: data.trip?.trip_id || planId,
          name: data.trip?.name || '',
          description: data.trip?.description,
          image: data.trip?.image,
          whiteboards: whiteboardsWithPins,
        };
        setPlan(transformedPlan);
        if (transformedPlan.whiteboards.length > 0) {
          setSelectedDay(transformedPlan.whiteboards[0].day);
        }
        
        // Get start date from localStorage (stored when plan was created)
        const storedStartDate = localStorage.getItem(`trip_start_date_${planId}`);
        let initialStartDate: Date;
        let initialEndDate: Date;
        
        // Calculate total days from whiteboards (this is the source of truth)
        const totalDays = transformedPlan.whiteboards.length > 0
          ? Math.max(...transformedPlan.whiteboards.map(wb => wb.day))
          : 1;
        
        console.log(`Plan has ${transformedPlan.whiteboards.length} whiteboards, max day: ${totalDays}`);
        
        if (storedStartDate) {
          try {
            initialStartDate = new Date(storedStartDate);
            // Validate date
            if (isNaN(initialStartDate.getTime())) {
              throw new Error('Invalid date');
            }
            // Calculate end date from start date + number of days from whiteboards
            initialEndDate = new Date(initialStartDate);
            initialEndDate.setDate(initialStartDate.getDate() + (totalDays - 1));
            console.log(`Using stored start date: ${initialStartDate.toISOString()}, calculated end date: ${initialEndDate.toISOString()}, total days: ${totalDays}`);
          } catch (e) {
            console.error('Failed to parse stored start date:', e);
            // Fallback: use today's date
            initialStartDate = new Date();
            initialEndDate = new Date();
            initialEndDate.setDate(initialStartDate.getDate() + (totalDays - 1));
          }
        } else {
          // Fallback: calculate from whiteboards (use today as start)
          initialStartDate = new Date();
          initialEndDate = new Date();
          initialEndDate.setDate(initialStartDate.getDate() + (totalDays - 1));
          console.log(`No stored start date, using today. Total days from whiteboards: ${totalDays}`);
        }
        
        setStartDate(initialStartDate);
        setEndDate(initialEndDate);
        initializeDayDates(initialStartDate, initialEndDate);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch plan details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate days from date range
  const calculateDaysFromRange = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  };

  // Initialize dates for all days based on date range
  const initializeDayDates = (start: Date, end: Date) => {
    const dates = new Map<number, { date: Date; time: string }>();
    const totalDays = calculateDaysFromRange(start, end);
    
    for (let day = 1; day <= totalDays; day++) {
      const dayDate = new Date(start);
      dayDate.setDate(start.getDate() + (day - 1));
      dates.set(day, {
        date: dayDate,
        time: day === 1 ? '13:00' : '09:00',
      });
    }
    setDayDates(dates);
  };

  // Update start date and recalculate all days
  const updateStartDate = (day: number, month: number, year: number) => {
    const newStartDate = new Date(year, month - 1, day);
    
    if (endDate && newStartDate > endDate) {
      // If start date is after end date, adjust end date to be start + 1 day minimum
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newStartDate.getDate() + 1);
      setEndDate(newEndDate);
      setStartDate(newStartDate);
      initializeDayDates(newStartDate, newEndDate);
    } else {
      setStartDate(newStartDate);
      if (endDate) {
        initializeDayDates(newStartDate, endDate);
      } else {
        // If no end date, set it to start date + 1 day
        const defaultEndDate = new Date(newStartDate);
        defaultEndDate.setDate(newStartDate.getDate() + 1);
        setEndDate(defaultEndDate);
        initializeDayDates(newStartDate, defaultEndDate);
      }
    }
  };

  // Update end date and recalculate all days
  const updateEndDate = (day: number, month: number, year: number) => {
    const newEndDate = new Date(year, month - 1, day);
    
    // Ensure end date is not before start date
    if (startDate && newEndDate < startDate) {
      // If end date is before start date, adjust start date to be end - 1 day minimum
      const newStartDate = new Date(newEndDate);
      newStartDate.setDate(newEndDate.getDate() - 1);
      // Ensure we don't go to a date before today (optional validation)
      if (newStartDate < new Date(new Date().setHours(0, 0, 0, 0))) {
        // If adjusted start would be in the past, set end to start + 1
        const adjustedEndDate = new Date(startDate);
        adjustedEndDate.setDate(startDate.getDate() + 1);
        setEndDate(adjustedEndDate);
        initializeDayDates(startDate, adjustedEndDate);
        return;
      }
      setStartDate(newStartDate);
      setEndDate(newEndDate);
      initializeDayDates(newStartDate, newEndDate);
    } else {
      setEndDate(newEndDate);
      if (startDate) {
        initializeDayDates(startDate, newEndDate);
      } else {
        // If no start date, set it to end date - 1 day
        const defaultStartDate = new Date(newEndDate);
        defaultStartDate.setDate(newEndDate.getDate() - 1);
        setStartDate(defaultStartDate);
        initializeDayDates(defaultStartDate, newEndDate);
      }
    }
  };

  const fetchParticipants = async () => {
    try {
      // Add owner (current user) immediately
      const ownerParticipant: Participant = {
        user_id: user?.user_id || '',
        display_name: user?.name || user?.email || 'You',
        profile: user?.profile,
      };
      
      const response = await planApi.getTripParticipants(planId);
      if (response.data?.data?.users) {
        const otherParticipants = response.data.data.users.map((u: any) => ({
          user_id: u.userId || u.user_id,
          display_name: u.displayName || u.name,
          profile: u.profile,
        }));
        
        // Combine owner with other participants, avoiding duplicates
        const allParticipants = [ownerParticipant];
        otherParticipants.forEach((p: Participant) => {
          if (p.user_id !== ownerParticipant.user_id) {
            allParticipants.push(p);
          }
        });
        
        setParticipants(allParticipants);
      } else {
        // If no other participants, still show owner
        setParticipants([ownerParticipant]);
      }
    } catch (err: any) {
      console.error('Failed to fetch participants:', err);
      // Even if fetch fails, show owner
      if (user) {
        setParticipants([{
          user_id: user.user_id || '',
          display_name: user.name || user.email || 'You',
          profile: user.profile,
        }]);
      }
    }
  };

  const handlePinClick = async (pin: Pin) => {
    // Validate pin has a pin_id
    if (!pin.pin_id) {
      console.error('Pin missing pin_id:', pin);
      alert('Pin data is invalid. Please refresh the page.');
      return;
    }

    // Validate pin_id format - but don't block if it's close (might be a display issue)
    const pinIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!pinIdRegex.test(pin.pin_id)) {
      console.warn('Pin ID format validation failed:', {
        pin_id: pin.pin_id,
        type: typeof pin.pin_id,
        length: pin.pin_id?.length,
        pin: pin
      });
      // Still allow clicking, but warn - the API call will fail if it's truly invalid
      // This allows us to see what the actual value is
    }

    setSelectedPin(pin);
    setViewMode('pin');
    // Optionally fetch full pin details
    try {
      const response = await planApi.getPinById(pin.pin_id);
      if (response.data) {
        // response.data is already the Pin object (from ApiResponse<Pin>)
        // But backend response uses different field names, so cast to any
        const pinData = response.data as any;
        setSelectedPin({
          pin_id: pin.pin_id, // Always use the original pin_id from the pin object
          name: pinData.name,
          description: pinData.description,
          image: pinData.image,
          location: pinData.location,
          expenses: pinData.expense || pinData.expenses, // Backend uses 'expense' (singular)
          participants: pinData.participant || pinData.participants, // Backend uses 'participant' (singular)
          parents: pinData.parents,
        } as Pin);
      }
    } catch (err: any) {
      console.error('Failed to fetch pin details:', err);
      // If it's an invalid ID error, show a helpful message
      if (err.response?.data?.message?.includes('invalid pinID') || 
          err.response?.data?.message?.includes('ObjectID')) {
        console.error('Invalid pin ID detected:', pin.pin_id);
        alert(`Invalid pin ID format: ${pin.pin_id}. This pin may need to be recreated.`);
      }
      // Keep the pin we already have - it should have a valid pin_id
    }
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setSelectedPin(null);
    setViewMode('day');
  };

  const handleAddPin = async () => {
    const whiteboard = getWhiteboardForDay(selectedDay);
    if (!whiteboard) {
      // Create whiteboard first if it doesn't exist
      try {
        await planApi.createWhiteboard(planId, selectedDay);
        // Add a small delay to ensure backend has processed
        await new Promise(resolve => setTimeout(resolve, 300));
        // Refresh plan details
        await fetchPlanDetails();
      } catch (error) {
        console.error('Failed to create whiteboard:', error);
        alert('Failed to create whiteboard. Please try again.');
        return;
      }
    }
    
    // Verify whiteboard exists after creation
    const updatedWhiteboard = getWhiteboardForDay(selectedDay);
    if (!updatedWhiteboard || !updatedWhiteboard.whiteboard_id) {
      console.error('Whiteboard not found or missing whiteboard_id');
      alert('Whiteboard is not ready. Please try again.');
      return;
    }
    
    // Open create pin modal
    setEditingPin(null);
    setShowCreatePinModal(true);
  };

  const handleEditPin = (pin: Pin) => {
    setEditingPin(pin);
    setShowCreatePinModal(true);
  };

  // Helper function to get the last pin in the whiteboard
  const getLastPinId = useCallback((whiteboard: ReturnType<typeof getWhiteboardForDay>): string | undefined => {
    if (!whiteboard || !whiteboard.pins || whiteboard.pins.length === 0) {
      return undefined;
    }
    // The last pin in the array is the last pin
    return whiteboard.pins[whiteboard.pins.length - 1]?.pin_id;
  }, []);

  // Function to reorder pins and update parent relationships
  const handlePinReorder = useCallback(async (newOrder: Pin[]) => {
    const whiteboard = getWhiteboardForDay(selectedDay);
    if (!whiteboard) return;

    setIsWhiteboardLoading(true);
    try {
      // Update parent relationships based on new order
      // Each pin's parent should be the previous pin in the order
      const updatePromises = newOrder.map((pin, index) => {
        const parentId = index > 0 ? newOrder[index - 1].pin_id : undefined;
        const parents = parentId ? [parentId] : undefined;
        
        return planApi.updatePin(pin.pin_id, {
          parents: parents,
        });
      });

      await Promise.all(updatePromises);
      
      // Update local state with new parent relationships without showing loading
      if (plan) {
        const updatedPlan = { ...plan };
        const whiteboardIndex = updatedPlan.whiteboards.findIndex(wb => wb.day === selectedDay);
        if (whiteboardIndex !== -1) {
          // Update pins with new parent relationships
          const updatedPins = newOrder.map((pin, index) => ({
            ...pin,
            parents: index > 0 ? [newOrder[index - 1].pin_id] : undefined,
          }));
          
          updatedPlan.whiteboards[whiteboardIndex] = {
            ...updatedPlan.whiteboards[whiteboardIndex],
            pins: updatedPins,
          };
          setPlan(updatedPlan);
        }
      }
    } catch (error) {
      console.error('Failed to reorder pins:', error);
      alert('Failed to reorder pins. Please try again.');
      // Revert by refreshing if update fails
      await fetchPlanDetails();
    } finally {
      setIsWhiteboardLoading(false);
    }
  }, [selectedDay, plan]);

  // Drag and drop state
  const [draggedPin, setDraggedPin] = useState<Pin | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (pin: Pin) => {
    setDraggedPin(pin);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedPin) return;
    
    const whiteboard = getWhiteboardForDay(selectedDay);
    if (!whiteboard) return;

    const currentPins = [...whiteboard.pins];
    const draggedIndex = currentPins.findIndex(p => p.pin_id === draggedPin.pin_id);

    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedPin(null);
      return;
    }

    // Reorder pins array
    const [removed] = currentPins.splice(draggedIndex, 1);
    currentPins.splice(dropIndex, 0, removed);

    // Optimistically update the plan state for immediate visual feedback
    if (plan) {
      const updatedPlan = { ...plan };
      const whiteboardIndex = updatedPlan.whiteboards.findIndex(wb => wb.day === selectedDay);
      if (whiteboardIndex !== -1) {
        updatedPlan.whiteboards[whiteboardIndex] = {
          ...updatedPlan.whiteboards[whiteboardIndex],
          pins: currentPins,
        };
        setPlan(updatedPlan);
      }
    }

    // Update parent relationships in the background
    try {
      await handlePinReorder(currentPins);
    } catch (error) {
      // If update fails, revert by refreshing
      await fetchPlanDetails();
    }
    
    setDraggedPin(null);
  };

  const handleDeletePin = (pin: Pin) => {
    setPinToDelete(pin);
  };

  const confirmDeletePin = async () => {
    if (!pinToDelete || !selectedWhiteboard) return;

    setIsDeletingPin(true);
    setIsWhiteboardLoading(true);
    
    // Optimistically remove pin from local state
    if (plan) {
      const updatedPlan = { ...plan };
      const whiteboardIndex = updatedPlan.whiteboards.findIndex(wb => wb.day === selectedDay);
      if (whiteboardIndex !== -1) {
        updatedPlan.whiteboards[whiteboardIndex] = {
          ...updatedPlan.whiteboards[whiteboardIndex],
          pins: updatedPlan.whiteboards[whiteboardIndex].pins.filter(
            p => p.pin_id !== pinToDelete.pin_id
          ),
        };
        setPlan(updatedPlan);
      }
    }
    
    // Clear selected pin if it was deleted
    if (selectedPin?.pin_id === pinToDelete.pin_id) {
      setSelectedPin(null);
      setViewMode('day');
    }
    
    try {
      await planApi.deletePin(pinToDelete.pin_id, selectedWhiteboard.whiteboard_id || '');
      setPinToDelete(null);
    } catch (error) {
      console.error('Failed to delete pin:', error);
      alert('Failed to delete pin. Please try again.');
      // Revert by refreshing if delete fails
      await fetchPlanDetails();
    } finally {
      setIsDeletingPin(false);
      setIsWhiteboardLoading(false);
    }
  };

  const getImageSrc = () => {
    if (plan?.image) {
      if (typeof plan.image === 'string') {
        return plan.image.startsWith('data:') 
          ? plan.image 
          : `data:image/jpeg;base64,${plan.image}`;
      }
      return plan.image;
    }
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
  };

  const getParticipantColor = (index: number) => {
    const colors = ['bg-green-200 text-green-800', 'bg-blue-200 text-blue-800', 'bg-pink-200 text-pink-800', 'bg-yellow-200 text-yellow-800', 'bg-purple-200 text-purple-800'];
    return colors[index % colors.length];
  };

  // Calculate total days - prioritize date range when dates are set
  const calculateTotalDays = useMemo(() => {
    // Primary: use date range if both dates are set
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalDays = diffDays + 1; // Include both start and end days
      console.log(`Calculating total days from date range: ${totalDays} (from ${startDate.toISOString()} to ${endDate.toISOString()})`);
      return totalDays;
    }
    // Fallback: use whiteboards to determine number of days
    if (plan && plan.whiteboards && plan.whiteboards.length > 0) {
      const maxDay = Math.max(...plan.whiteboards.map(wb => wb.day));
      console.log(`Calculating total days from whiteboards: max day = ${maxDay}`);
      return maxDay;
    }
    return 1;
  }, [startDate, endDate, plan]);

  // Generate array of day numbers from 1 to totalDays - use useMemo
  const dayTabs = useMemo(() => {
    const totalDays = calculateTotalDays;
    console.log('Generating day tabs:', totalDays); // Debug log
    return Array.from({ length: totalDays }, (_, i) => i + 1);
  }, [calculateTotalDays]);

  // Create/delete whiteboards when date range changes (only when dates actually change, not when toggling edit mode)
  useEffect(() => {
    if (!plan || !planId || !startDate || !endDate) {
      return; // Don't manage whiteboards if dates aren't set
    }

    // Only manage whiteboards when in edit mode AND dates have actually changed
    if (!isEditingDates) {
      return; // Don't manage whiteboards when not editing
    }

    // Prevent multiple simultaneous whiteboard operations
    if (isCreatingWhiteboardsRef.current) {
      return;
    }

    const totalDays = calculateTotalDays;
    const syncWhiteboards = async () => {
      // Prevent concurrent executions
      if (isCreatingWhiteboardsRef.current) {
        return;
      }
      
      isCreatingWhiteboardsRef.current = true;
      
      try {
        // Re-fetch plan to get latest whiteboard state
        const response = await planApi.getPlanById(planId);
        if (!response.data) {
          isCreatingWhiteboardsRef.current = false;
          return;
        }
        
        const data = response.data as any;
        const whiteboardsData = data.whiteboards?.whiteboards || [];
        const whiteboardIds = data.trip?.whiteboards || [];
        
        const currentWhiteboards = whiteboardsData.map((wb: any, index: number) => ({
          day: wb.day || index + 1,
          whiteboard_id: whiteboardIds[index] || '',
        }));
        
        // Check which whiteboards exist
        const existingDays = new Set(currentWhiteboards.map((wb: any) => wb.day));
        
        // Find missing days (need to create)
        const missingDays = [];
        for (let day = 1; day <= totalDays; day++) {
          if (!existingDays.has(day)) {
            missingDays.push(day);
          }
        }
        
        // Find extra days (need to delete) - whiteboards with day > totalDays
        const extraWhiteboards = currentWhiteboards.filter((wb: any) => wb.day > totalDays);
        
        // Delete extra whiteboards first
        for (const whiteboard of extraWhiteboards) {
          if (whiteboard.whiteboard_id) {
            try {
              await planApi.deleteWhiteboard(whiteboard.whiteboard_id, planId);
              console.log(`Deleted whiteboard for day ${whiteboard.day}`);
            } catch (err) {
              console.error(`Failed to delete whiteboard for day ${whiteboard.day}:`, err);
              // Continue deleting other whiteboards even if one fails
            }
          }
        }
        
        // Create missing whiteboards
        for (const day of missingDays) {
          try {
            await planApi.createWhiteboard(planId, day);
            console.log(`Created whiteboard for day ${day}`);
          } catch (err) {
            console.error(`Failed to create whiteboard for day ${day}:`, err);
            // Continue creating other whiteboards even if one fails
          }
        }
        
        // Only refresh if we actually made changes
        if (missingDays.length > 0 || extraWhiteboards.length > 0) {
          // Refresh plan details to get updated whiteboards
          await fetchPlanDetails();
        }
      } catch (err) {
        console.error('Failed to sync whiteboards:', err);
      } finally {
        isCreatingWhiteboardsRef.current = false;
      }
    };

    // Debounce to avoid creating/deleting whiteboards on every keystroke
    // Use date timestamps to detect actual date changes
    const timeoutId = setTimeout(() => {
      syncWhiteboards();
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => {
      clearTimeout(timeoutId);
      isCreatingWhiteboardsRef.current = false;
    };
  }, [startDate?.getTime(), endDate?.getTime(), calculateTotalDays, planId, isEditingDates]); // Use getTime() to compare dates

  // Get whiteboard for a specific day
  const getWhiteboardForDay = (day: number) => {
    return plan?.whiteboards.find(wb => wb.day === day);
  };

  // Get date for selected day
  const getSelectedDayDate = () => {
    const dayData = dayDates.get(selectedDay);
    if (dayData) {
      return {
        day: dayData.date.getDate(),
        month: dayData.date.getMonth() + 1,
        year: dayData.date.getFullYear(),
        time: dayData.time,
      };
    }
    const fallbackDate = startDate ? new Date(startDate) : new Date();
    fallbackDate.setDate(fallbackDate.getDate() + (selectedDay - 1));
    return {
      day: fallbackDate.getDate(),
      month: fallbackDate.getMonth() + 1,
      year: fallbackDate.getFullYear(),
      time: '13:00',
    };
  };

  const selectedWhiteboard = getWhiteboardForDay(selectedDay);
  const selectedDayDate = getSelectedDayDate();
  const [hour, minute] = selectedDayDate.time.split(':').map(Number);

  // Collect all participants from all pins in the selected day
  const dayParticipants = useMemo(() => {
    if (!selectedWhiteboard || !selectedWhiteboard.pins) {
      return [];
    }

    const participantMap = new Map<string, Participant>();
    
    // Collect all participant IDs from all pins in the selected day
    selectedWhiteboard.pins.forEach((pin) => {
      if (pin.participants && Array.isArray(pin.participants)) {
        pin.participants.forEach((participantId: string) => {
          if (!participantMap.has(participantId)) {
            // Try to find participant details from trip participants
            const tripParticipant = participants.find(p => p.user_id === participantId);
            if (tripParticipant) {
              participantMap.set(participantId, tripParticipant);
            } else {
              // If not found in trip participants, create a basic entry
              participantMap.set(participantId, {
                user_id: participantId,
                display_name: participantId,
                profile: undefined,
              });
            }
          }
        });
      }
    });
    
    return Array.from(participantMap.values());
  }, [selectedWhiteboard, participants]);

  // Collect all images/photos from all pins in the selected day
  const dayPhotos = useMemo(() => {
    if (!selectedWhiteboard || !selectedWhiteboard.pins) {
      return [];
    }

    const photos: string[] = [];
    
    selectedWhiteboard.pins.forEach((pin) => {
      if (pin.image) {
        let imageUrl: string;
        if (typeof pin.image === 'string') {
          imageUrl = pin.image.startsWith('data:') 
            ? pin.image 
            : `data:image/jpeg;base64,${pin.image}`;
        } else {
          imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
        }
        photos.push(imageUrl);
      }
    });
    
    return photos;
  }, [selectedWhiteboard]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPin || !event.target.files || event.target.files.length === 0) return;

    // Validate pin_id before proceeding
    if (!selectedPin.pin_id) {
      alert('Pin ID is missing. Please refresh the page and try again.');
      return;
    }

    // Validate pin_id is a valid MongoDB ObjectID format (24 hex characters)
    const pinIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!pinIdRegex.test(selectedPin.pin_id)) {
      console.error('Invalid pin ID format:', selectedPin.pin_id);
      alert('Invalid pin ID. Please refresh the page and try again.');
      return;
    }

    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (e.g., max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Image file is too large. Please select an image smaller than 10MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      console.log('Uploading image for pin:', selectedPin.pin_id, 'File:', file.name, 'Size:', file.size);
      await planApi.uploadPinImage(selectedPin.pin_id, file);
      
      // Refresh pin details to show the new image
      await handlePinClick(selectedPin);
      
      // Reset file input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      
      // Provide more specific error message
      let errorMessage = 'Failed to upload image. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddImageClick = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  // Helper function to sort pins based on parent relationships
  const sortPinsByParents = (pins: Pin[]): Pin[] => {
    if (pins.length <= 1) return pins;
    
    // Create a map of pin_id -> pin for quick lookup
    const pinMap = new Map<string, Pin>();
    pins.forEach(pin => {
      pinMap.set(pin.pin_id, pin);
    });
    
    // Find the root pin (pin with no parents or empty parents array)
    const rootPin = pins.find(pin => 
      !pin.parents || pin.parents.length === 0
    );
    
    if (!rootPin) {
      // If no root pin found, return original order
      console.warn('No root pin found, returning original order');
      return pins;
    }
    
    // Build ordered array by following parent chain
    const ordered: Pin[] = [rootPin];
    const visited = new Set<string>([rootPin.pin_id]);
    
    // Follow the chain: each pin's parent should be the previous pin
    let currentPin = rootPin;
    while (ordered.length < pins.length) {
      // Find the next pin that has currentPin as parent
      const nextPin = pins.find(pin => 
        !visited.has(pin.pin_id) && 
        pin.parents && 
        pin.parents.length > 0 && 
        pin.parents[0] === currentPin.pin_id
      );
      
      if (!nextPin) {
        // No more pins in chain, add remaining pins
        const remaining = pins.filter(pin => !visited.has(pin.pin_id));
        ordered.push(...remaining);
        break;
      }
      
      ordered.push(nextPin);
      visited.add(nextPin.pin_id);
      currentPin = nextPin;
    }
    
    return ordered;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b z-10">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/plans')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
                  aria-label="Back to Plans"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {error && (
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex-1 text-center py-12">
            <div className="text-lg text-gray-600">Loading plan details...</div>
          </div>
        ) : plan ? (
          <div className="flex-1 flex overflow-hidden">
            {/* PART 1: Left Sidebar */}
            <div className="w-80 bg-amber-50 border-r-2 border-gray-300 overflow-y-auto flex-shrink-0">
              <div className="p-6 space-y-6">
                {viewMode === 'pin' && selectedPin ? (
                  <PinDetailsView
                    selectedPin={selectedPin}
                    selectedDay={selectedDay}
                    participants={participants}
                    user={user}
                    getParticipantColor={getParticipantColor}
                    onBack={() => setViewMode('day')}
                    onEdit={handleEditPin}
                    onAddFriend={() => setShowAddFriendModal(true)}
                    onImageUpload={handleImageUpload}
                    imageInputRef={imageInputRef}
                    isUploadingImage={isUploadingImage}
                  />
                ) : (
                  <DayDetailsView
                    plan={plan}
                    selectedDay={selectedDay}
                    startDate={startDate}
                    endDate={endDate}
                    dayDates={dayDates}
                    isEditingDates={isEditingDates}
                    participants={participants}
                    dayParticipants={dayParticipants}
                    dayPhotos={dayPhotos}
                    user={user}
                    getParticipantColor={getParticipantColor}
                    getImageSrc={getImageSrc}
                    updateStartDate={updateStartDate}
                    updateEndDate={updateEndDate}
                    getSelectedDayDate={getSelectedDayDate}
                    setIsEditingDates={setIsEditingDates}
                    planId={planId}
                  />
                )}
              </div>
            </div>

            {/* PART 2: Right Column */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <DayTabs
                  days={dayTabs}
                  selectedDay={selectedDay}
                  onDayClick={handleDayClick}
                  hasWhiteboard={(day) => !!getWhiteboardForDay(day)}
                />

                {/* Whiteboard Content */}
                <div className="flex-1 p-6 overflow-y-auto bg-white border-l-4 border-green-200 relative">
                  {isWhiteboardLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                      <div className="flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm text-gray-600">Updating...</p>
                      </div>
                    </div>
                  )}
                  {selectedWhiteboard ? (
                    <div className="space-y-4">
                      <WhiteboardView
                        pins={selectedWhiteboard.pins}
                        selectedPin={selectedPin}
                        selectedDay={selectedDay}
                        draggedPin={draggedPin}
                        dragOverIndex={dragOverIndex}
                        onPinClick={handlePinClick}
                        onDeletePin={handleDeletePin}
                        onAddPin={handleAddPin}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-lg border-2 border-blue-300 bg-blue-50 flex items-center justify-center mx-auto mb-4">
                          <p className="text-blue-600 font-medium">Unnamed Pin</p>
                        </div>
                        <p className="text-gray-500 mb-4">No whiteboard for Day {selectedDay}</p>
                        <button
                          onClick={handleAddPin}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          + Create Whiteboard
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Map Section - keep as is */}
              <div className="h-64 bg-blue-900 flex-shrink-0 border-t-4 border-blue-800">
                <div className="flex-1 flex items-center justify-between px-8 py-6 h-full">
                  <h2 className="text-5xl font-bold text-white">location</h2>
                  <div className="flex-1 max-w-5xl h-full bg-gray-200 rounded-lg overflow-hidden ml-8 shadow-xl">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-100">
                      <div className="text-center">
                        <svg className="w-20 h-20 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-lg font-medium">Map View</p>
                        <p className="text-sm mt-1">Integrate Google Maps or Mapbox here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center py-12">
            <p className="text-gray-600">Plan not found</p>
          </div>
        )}

        {showAddFriendModal && (
          <AddFriendModal
            planId={planId}
            onClose={() => setShowAddFriendModal(false)}
            onSuccess={() => {
              setShowAddFriendModal(false);
              fetchParticipants();
            }}
          />
        )}

        {showCreatePinModal && selectedWhiteboard && (
          <CreatePinModal
            whiteboardId={selectedWhiteboard.whiteboard_id || ''}
            lastPinId={getLastPinId(selectedWhiteboard)}
            onClose={() => {
              setShowCreatePinModal(false);
              setEditingPin(null);
            }}
            onSuccess={async () => {
              setShowCreatePinModal(false);
              const wasEditing = !!editingPin;
              const editedPinId = editingPin?.pin_id;
              setEditingPin(null);
              
              setIsWhiteboardLoading(true);
              
              if (wasEditing && editedPinId) {
                // For edits, just refresh the specific pin
                try {
                  const response = await planApi.getPinById(editedPinId);
                  if (response.data) {
                    const pinData = response.data as any;
                    const updatedPin = {
                      pin_id: editedPinId,
                      name: pinData.name,
                      description: pinData.description,
                      image: pinData.image,
                      location: pinData.location,
                      expenses: pinData.expense || pinData.expenses,
                      participants: pinData.participant || pinData.participants,
                      parents: pinData.parents,
                    } as Pin;
                    
                    // Update local state
                    if (plan) {
                      const updatedPlan = { ...plan };
                      const whiteboardIndex = updatedPlan.whiteboards.findIndex(wb => wb.day === selectedDay);
                      if (whiteboardIndex !== -1) {
                        const pinIndex = updatedPlan.whiteboards[whiteboardIndex].pins.findIndex(
                          p => p.pin_id === editedPinId
                        );
                        if (pinIndex !== -1) {
                          updatedPlan.whiteboards[whiteboardIndex].pins[pinIndex] = updatedPin;
                          setPlan(updatedPlan);
                        }
                      }
                    }
                    
                    // Update selectedPin if viewing this pin
                    if (selectedPin?.pin_id === editedPinId) {
                      setSelectedPin(updatedPin);
                    }
                  }
                } catch (err) {
                  console.error('Failed to refresh edited pin:', err);
                  // Fallback to full refresh
                  await fetchPlanDetails();
                }
              } else {
                // For new pins, fetch the created pin and add it to local state
                try {
                  // Wait a bit for backend to process
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
                  // Fetch the latest whiteboard to get the new pin
                  const response = await planApi.getPlanById(planId);
                  if (response.data) {
                    const data = response.data as any;
                    const whiteboardsData = data.whiteboards?.whiteboards || [];
                    const whiteboardIds = data.trip?.whiteboards || [];
                    const currentWhiteboardData = whiteboardsData.find((wb: any) => wb.day === selectedDay);
                    
                    if (currentWhiteboardData) {
                      const pinIds = currentWhiteboardData.pins || [];
                      // Get the last pin ID (the newly created one)
                      const newPinId = pinIds[pinIds.length - 1];
                      
                      if (newPinId) {
                        // Fetch the new pin details
                        const pinResponse = await planApi.getPinById(newPinId);
                        if (pinResponse.data) {
                          const pinData = pinResponse.data as any;
                          const newPin = {
                            pin_id: newPinId,
                            name: pinData.name,
                            description: pinData.description,
                            image: pinData.image,
                            location: pinData.location,
                            expenses: pinData.expense || pinData.expenses,
                            participants: pinData.participant || pinData.participants,
                            parents: pinData.parents,
                          } as Pin;
                          
                          // Update local state - add new pin to the end
                          if (plan) {
                            const updatedPlan = { ...plan };
                            const whiteboardIndex = updatedPlan.whiteboards.findIndex(wb => wb.day === selectedDay);
                            if (whiteboardIndex !== -1) {
                              updatedPlan.whiteboards[whiteboardIndex] = {
                                ...updatedPlan.whiteboards[whiteboardIndex],
                                pins: [...updatedPlan.whiteboards[whiteboardIndex].pins, newPin],
                              };
                              setPlan(updatedPlan);
                            }
                          }
                        }
                      }
                    }
                  }
                } catch (err) {
                  console.error('Failed to fetch new pin:', err);
                  // Fallback to full refresh
                  await fetchPlanDetails();
                }
              }
              
              setIsWhiteboardLoading(false);
            }}
            existingPin={editingPin}
          />
        )}

        {/* Delete Pin Confirmation Modal */}
        {pinToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
                Delete Pin
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 text-center">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{pinToDelete.name || 'this pin'}"</span>? 
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setPinToDelete(null)}
                  disabled={isDeletingPin}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePin}
                  disabled={isDeletingPin}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingPin ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}