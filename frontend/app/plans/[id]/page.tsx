'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { planApi } from '@/lib/api';
import type { PlanWithDetails, Pin, Participant } from '@/lib/types';
import { AuthGuard } from '@/components/AuthGuard';
import { AddFriendModal } from '@/components/AddFriendModal';
import { PinCard } from '@/components/PinCard';
import { CreatePinModal } from '@/components/CreatePinModal';

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
            const pinIds = wb.pins || [];
            
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
            
            return {
              day: wb.day || index + 1,
              pins: pins,
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

  const handleDeletePin = (pin: Pin) => {
    setPinToDelete(pin);
  };

  const confirmDeletePin = async () => {
    if (!pinToDelete || !selectedWhiteboard) return;

    setIsDeletingPin(true);
    try {
      await planApi.deletePin(pinToDelete.pin_id, selectedWhiteboard.whiteboard_id || '');
      // Refresh plan details to update the whiteboard
      await fetchPlanDetails();
      // Clear selected pin if it was deleted
      if (selectedPin?.pin_id === pinToDelete.pin_id) {
        setSelectedPin(null);
        setViewMode('day');
      }
      setPinToDelete(null);
    } catch (error) {
      console.error('Failed to delete pin:', error);
      alert('Failed to delete pin. Please try again.');
    } finally {
      setIsDeletingPin(false);
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
            {/* PART 1: Left Sidebar - Shows Day Details or Pin Details */}
            <div className="w-80 bg-amber-50 border-r-2 border-gray-300 overflow-y-auto flex-shrink-0">
              <div className="p-6 space-y-6">
                {viewMode === 'pin' && selectedPin ? (
                  /* Pin Details View - Same structure as Day View */
                  <>
                    <button
                      onClick={() => setViewMode('day')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
                    >
                      ← Back to Day {selectedDay}
                    </button>
                    
                    {/* Main Image */}
                    <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
                      <img
                        src={selectedPin.image 
                          ? (typeof selectedPin.image === 'string' 
                            ? selectedPin.image.startsWith('data:') 
                              ? selectedPin.image 
                              : `data:image/jpeg;base64,${selectedPin.image}`
                            : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop')
                          : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'}
                        alt={selectedPin.name || 'Pin'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
                        }}
                      />
                    </div>

                    {/* Pin Name with Edit Icon */}
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-800 flex-1">
                        {selectedPin.name || 'Unnamed Pin'}
                      </h1>
                      <button 
                        onClick={() => handleEditPin(selectedPin)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-gray-600 text-sm">
                        {selectedPin.description || 'description'}
                      </p>
                    </div>

                    {/* Location */}
                    {selectedPin.location && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                        <p className="text-gray-600 text-sm">{selectedPin.location}</p>
                      </div>
                    )}

                    {/* Expenses */}
                    {selectedPin.expenses && selectedPin.expenses.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expenses</label>
                        <div className="space-y-2">
                          {selectedPin.expenses.map((expense, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-700">{expense.name}</span>
                              <span className="text-gray-600">${expense.expense?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Participants - Only show in Pin view WITH add button */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Participate
                      </label>
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Show participants from this pin */}
                        {selectedPin.participants && selectedPin.participants.length > 0 ? (
                          selectedPin.participants.map((participantId: string, index: number) => {
                            const participant = participants.find(p => p.user_id === participantId) || {
                              user_id: participantId,
                              display_name: participantId,
                            };
                            return (
                              <span
                                key={participantId}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                  participant.user_id === user?.user_id
                                    ? 'bg-purple-200 text-purple-800 border-2 border-purple-400'
                                    : getParticipantColor(index)
                                }`}
                              >
                                {participant.user_id === user?.user_id && '👤 '}
                                {participant.display_name || participantId}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm text-gray-500">No participants</span>
                        )}
                        <button
                          onClick={() => setShowAddFriendModal(true)}
                          className="w-10 h-10 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center hover:bg-blue-300 transition-colors shadow-sm"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Photo & Log - Only show in Pin view WITH add button */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Photo & log
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {selectedPin.image && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shadow-sm relative group">
                            <img
                              src={typeof selectedPin.image === 'string' 
                                ? selectedPin.image.startsWith('data:') 
                                  ? selectedPin.image 
                                  : `data:image/jpeg;base64,${selectedPin.image}`
                                : 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop'}
                              alt="Pin photo"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop';
                              }}
                            />
                          </div>
                        )}
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={isUploadingImage}
                        />
                        <button 
                          onClick={handleAddImageClick}
                          disabled={isUploadingImage}
                          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploadingImage ? (
                            <svg className="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Day Details View */
                  <>
                    {/* Main Image */}
                    <div className="w-full h-64 rounded-lg overflow-hidden shadow-md">
                      <img
                        src={getImageSrc()}
                        alt={plan.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop';
                        }}
                      />
                    </div>

                    {/* Place Name with Edit Icon */}
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-800 flex-1">
                        {plan.name || 'Place Name'}
                      </h1>
                      <button 
                        onClick={() => {
                          if (isEditingDates && startDate) {
                            // Save start date when exiting edit mode
                            localStorage.setItem(`trip_start_date_${planId}`, startDate.toISOString().split('T')[0]);
                            console.log(`Saved start date: ${startDate.toISOString().split('T')[0]}`);
                          }
                          setIsEditingDates(!isEditingDates);
                        }}
                        className={`p-1.5 rounded transition-colors ${
                          isEditingDates 
                            ? 'text-green-600 hover:text-green-800 hover:bg-green-50' 
                            : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                        }`}
                        title={isEditingDates ? 'Save changes' : 'Edit dates'}
                      >
                        {isEditingDates ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-gray-600 text-sm">
                        {plan.description || 'description'}
                      </p>
                    </div>

                    {/* Date Range Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            value={startDate ? startDate.getDate() : 1}
                            onChange={(e) => {
                              const day = parseInt(e.target.value) || 1;
                              const month = startDate ? startDate.getMonth() + 1 : 1;
                              const year = startDate ? startDate.getFullYear() : 2026;
                              updateStartDate(day, month, year);
                            }}
                            disabled={!isEditingDates}
                            className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                              isEditingDates 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                            }`}
                            min="1"
                            max="31"
                          />
                          <span className="text-gray-600">/</span>
                          <input
                            type="number"
                            value={startDate ? startDate.getMonth() + 1 : 1}
                            onChange={(e) => {
                              const month = parseInt(e.target.value) || 1;
                              const day = startDate ? startDate.getDate() : 1;
                              const year = startDate ? startDate.getFullYear() : 2026;
                              updateStartDate(day, month, year);
                            }}
                            disabled={!isEditingDates}
                            className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                              isEditingDates 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                            }`}
                            min="1"
                            max="12"
                          />
                          <span className="text-gray-600">/</span>
                          <input
                            type="number"
                            value={startDate ? startDate.getFullYear() : 2026}
                            onChange={(e) => {
                              const year = parseInt(e.target.value) || 2026;
                              const day = startDate ? startDate.getDate() : 1;
                              const month = startDate ? startDate.getMonth() + 1 : 1;
                              updateStartDate(day, month, year);
                            }}
                            disabled={!isEditingDates}
                            className={`w-16 px-2 py-1.5 text-sm border-2 rounded text-center ${
                              isEditingDates 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                            }`}
                            min="2020"
                            max="2100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="number"
                            value={endDate ? endDate.getDate() : 1}
                            onChange={(e) => {
                              const day = parseInt(e.target.value) || 1;
                              const month = endDate ? endDate.getMonth() + 1 : 1;
                              const year = endDate ? endDate.getFullYear() : 2026;
                              updateEndDate(day, month, year);
                            }}
                            disabled={!isEditingDates}
                            className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                              isEditingDates 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                            }`}
                            min={startDate ? startDate.getDate() : 1}
                            max="31"
                          />
                          <span className="text-gray-600">/</span>
                          <input
                            type="number"
                            value={endDate ? endDate.getMonth() + 1 : 1}
                            onChange={(e) => {
                              const month = parseInt(e.target.value) || 1;
                              const day = endDate ? endDate.getDate() : 1;
                              const year = endDate ? endDate.getFullYear() : 2026;
                              updateEndDate(day, month, year);
                            }}
                            disabled={!isEditingDates}
                            className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center ${
                              isEditingDates 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                            }`}
                            min={startDate ? startDate.getMonth() + 1 : 1}
                            max="12"
                          />
                          <span className="text-gray-600">/</span>
                          <input
                            type="number"
                            value={endDate ? endDate.getFullYear() : 2026}
                            onChange={(e) => {
                              const year = parseInt(e.target.value) || 2026;
                              const day = endDate ? endDate.getDate() : 1;
                              const month = endDate ? endDate.getMonth() + 1 : 1;
                              updateEndDate(day, month, year);
                            }}
                            disabled={!isEditingDates}
                            className={`w-16 px-2 py-1.5 text-sm border-2 rounded text-center ${
                              isEditingDates 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                            }`}
                            min={startDate ? startDate.getFullYear() : 2020}
                            max="2100"
                          />
                        </div>
                        {/* Show validation message if end < start */}
                        {startDate && endDate && endDate < startDate && (
                          <p className="mt-1 text-xs text-red-500">
                            End date must be after start date
                          </p>
                        )}
                      </div>
                      
                      {/* Debug: Show calculated days */}
                      {startDate && endDate && (
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                          Total days: {calculateTotalDays} (from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()})
                        </div>
                      )}
                      
                      {/* Selected Day Date & Time */}
                      <div className="pt-3 border-t border-gray-300">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">Day {selectedDay} :</span>
                          <div className="flex gap-1 items-center">
                            <input
                              type="number"
                              value={selectedDayDate.day}
                              onChange={(e) => {
                                const day = parseInt(e.target.value) || 1;
                                const month = selectedDayDate.month;
                                const year = selectedDayDate.year;
                                // Update the specific day's date, which will recalculate from start date
                                const newDayDate = new Date(year, month - 1, day);
                                const dayData = dayDates.get(selectedDay);
                                if (dayData) {
                                  const newDates = new Map(dayDates);
                                  newDates.set(selectedDay, { ...dayData, date: newDayDate });
                                  setDayDates(newDates);
                                  
                                  // If this is day 1, update start date
                                  if (selectedDay === 1) {
                                    updateStartDate(day, month, year);
                                  }
                                }
                              }}
                              disabled={!isEditingDates}
                              className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                                isEditingDates 
                                  ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                              }`}
                              min="1"
                              max="31"
                            />
                            <span className="text-gray-600">/</span>
                            <input
                              type="number"
                              value={selectedDayDate.month}
                              onChange={(e) => {
                                const month = parseInt(e.target.value) || 1;
                                const day = selectedDayDate.day;
                                const year = selectedDayDate.year;
                                const newDayDate = new Date(year, month - 1, day);
                                const dayData = dayDates.get(selectedDay);
                                if (dayData) {
                                  const newDates = new Map(dayDates);
                                  newDates.set(selectedDay, { ...dayData, date: newDayDate });
                                  setDayDates(newDates);
                                  
                                  // If this is day 1, update start date
                                  if (selectedDay === 1) {
                                    updateStartDate(day, month, year);
                                  }
                                }
                              }}
                              disabled={!isEditingDates}
                              className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                                isEditingDates 
                                  ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                              }`}
                              min="1"
                              max="12"
                            />
                            <span className="text-gray-600">/</span>
                            <input
                              type="number"
                              value={selectedDayDate.year}
                              onChange={(e) => {
                                const year = parseInt(e.target.value) || 2026;
                                const day = selectedDayDate.day;
                                const month = selectedDayDate.month;
                                const newDayDate = new Date(year, month - 1, day);
                                const dayData = dayDates.get(selectedDay);
                                if (dayData) {
                                  const newDates = new Map(dayDates);
                                  newDates.set(selectedDay, { ...dayData, date: newDayDate });
                                  setDayDates(newDates);
                                  
                                  // If this is day 1, update start date
                                  if (selectedDay === 1) {
                                    updateStartDate(day, month, year);
                                  }
                                }
                              }}
                              disabled={!isEditingDates}
                              className={`w-16 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                                isEditingDates 
                                  ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                                  : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                              }`}
                              min="2020"
                              max="2100"
                            />
                          </div>
                        </div>
                        {/* Only show time input when viewing a pin, not when viewing day details */}
                        {viewMode === 'pin' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Day {selectedDay} :</span>
                            <div className="flex gap-1 items-center">
                              <input
                                type="number"
                                value={hour}
                                onChange={(e) => {
                                  const newHour = parseInt(e.target.value) || 0;
                                  const dayData = dayDates.get(selectedDay);
                                  if (dayData) {
                                    const [_, min] = dayData.time.split(':').map(Number);
                                    const newTime = `${newHour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                                    const newDates = new Map(dayDates);
                                    newDates.set(selectedDay, { ...dayData, time: newTime });
                                    setDayDates(newDates);
                                  }
                                }}
                                disabled={!isEditingDates}
                                className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                                  isEditingDates 
                                    ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                                }`}
                                min="0"
                                max="23"
                              />
                              <span className="text-gray-600">:</span>
                              <input
                                type="number"
                                value={minute}
                                onChange={(e) => {
                                  const newMinute = parseInt(e.target.value) || 0;
                                  const dayData = dayDates.get(selectedDay);
                                  if (dayData) {
                                    const [hr] = dayData.time.split(':').map(Number);
                                    const newTime = `${hr.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`;
                                    const newDates = new Map(dayDates);
                                    newDates.set(selectedDay, { ...dayData, time: newTime });
                                    setDayDates(newDates);
                                  }
                                }}
                                disabled={!isEditingDates}
                                className={`w-12 px-2 py-1.5 text-sm border-2 rounded text-center focus:outline-none ${
                                  isEditingDates 
                                    ? 'border-blue-300 bg-blue-50 focus:border-blue-500' 
                                    : 'border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed'
                                }`}
                                min="0"
                                max="59"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Participants from all pins in this day - Read-only (no add button) */}
                    {(dayParticipants.length > 0 || participants.length > 0) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Participate
                        </label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Show trip participants first */}
                          {participants.map((participant, index) => (
                            <span
                              key={participant.user_id}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                participant.user_id === user?.user_id
                                  ? 'bg-purple-200 text-purple-800 border-2 border-purple-400'
                                  : getParticipantColor(index)
                              }`}
                            >
                              {participant.user_id === user?.user_id && '👤 '}
                              {participant.display_name || participant.user_id}
                            </span>
                          ))}
                          {/* Show pin participants that aren't already in trip participants */}
                          {dayParticipants
                            .filter(p => !participants.some(tp => tp.user_id === p.user_id))
                            .map((participant, index) => (
                              <span
                                key={participant.user_id}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium ${getParticipantColor(index + participants.length)}`}
                              >
                                {participant.display_name || participant.user_id}
                              </span>
                            ))}
                          {/* No add button in day view */}
                        </div>
                      </div>
                    )}

                    {/* Photos from all pins in this day - Read-only (no add button) */}
                    {dayPhotos.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Photo & log
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {dayPhotos.map((photo, index) => (
                            <div key={index} className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                              <img
                                src={photo}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=100&h=100&fit=crop';
                                }}
                              />
                            </div>
                          ))}
                          {/* No add button in day view */}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* PART 2: Right Column - Whiteboard (top) and Map (bottom) */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Whiteboard Section */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {/* Day Tabs */}
                <div className="border-b-2 border-gray-200 bg-white flex-shrink-0">
                  <div className="flex gap-1 px-4 py-3 overflow-x-auto">
                    {dayTabs.map((day) => {
                      const hasWhiteboard = !!getWhiteboardForDay(day);
                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap border-2 ${
                            selectedDay === day
                              ? 'bg-green-100 text-green-800 border-black shadow-sm'
                              : hasWhiteboard
                              ? 'text-gray-700 hover:bg-gray-50 border-transparent'
                              : 'text-gray-400 hover:bg-gray-50 border-transparent'
                          }`}
                        >
                          Day {day}
                          {selectedDay === day && (
                            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Whiteboard Content */}
                <div className="flex-1 p-6 overflow-y-auto bg-white border-l-4 border-green-200">
                  {selectedWhiteboard ? (
                    <div className="space-y-4">
                      {selectedWhiteboard.pins.length === 0 ? (
                        <div className="flex items-center justify-center h-full min-h-[200px]">
                          <div className="text-center">
                            <div className="w-24 h-24 rounded-lg border-2 border-blue-300 bg-blue-50 flex items-center justify-center mx-auto mb-4">
                              <p className="text-blue-600 font-medium">Unnamed Pin</p>
                            </div>
                            <p className="text-gray-500 mb-4">No pins for Day {selectedDay}</p>
                            <button
                              onClick={handleAddPin}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              + Add Pin
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {selectedWhiteboard.pins.map((pin, index) => (
                            <div key={pin.pin_id} className="flex items-start gap-4">
                              {index > 0 && (
                                <div className="flex flex-col items-center pt-2">
                                  <div className="w-0.5 h-8 bg-gray-300"></div>
                                  <div className="w-3 h-3 border-2 border-gray-300 rounded-full bg-white"></div>
                                  <div className="w-0.5 h-8 bg-gray-300"></div>
                                </div>
                              )}
                              <div 
                                className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                                  selectedPin?.pin_id === pin.pin_id
                                    ? 'border-blue-500 bg-blue-100 shadow-md'
                                    : index === selectedWhiteboard.pins.length - 1 
                                    ? 'border-blue-400 bg-blue-50 shadow-sm hover:border-blue-500'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                }`}
                                onClick={() => handlePinClick(pin)}
                              >
                                <PinCard pin={pin} onDelete={handleDeletePin} />
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={handleAddPin}
                            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center gap-2 text-gray-600"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="font-medium">Add Pin</span>
                          </button>
                        </>
                      )}
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

              {/* Map Section */}
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
            onClose={() => {
              setShowCreatePinModal(false);
              setEditingPin(null);
            }}
            onSuccess={async () => {
              setShowCreatePinModal(false);
              setEditingPin(null);
              // Add a small delay to ensure backend has processed the pin creation
              await new Promise(resolve => setTimeout(resolve, 500));
              // Refresh plan details to show the new pin
              await fetchPlanDetails();
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