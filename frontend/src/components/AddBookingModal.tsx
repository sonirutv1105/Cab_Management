import React, { useState, useEffect, useCallback } from 'react';
import { useCMS } from '../context/CMSContext';

interface AddBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getInitialState = () => ({
  passengerName: '',
  bookingDate: new Date().toISOString().split('T')[0],
  rideTime: '09:00',
  pickupPoint: '',
  dropPoint: '',
  purpose: '',
});

export default function AddBookingModal({ isOpen, onClose }: AddBookingModalProps) {
  const { addBooking } = useCMS();
  const [newBooking, setNewBooking] = useState(getInitialState());
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if form is dirty by comparing with initial state
  const isDirty = () => {
    const initial = getInitialState();
    return (
      newBooking.passengerName !== initial.passengerName ||
      newBooking.bookingDate !== initial.bookingDate ||
      newBooking.rideTime !== initial.rideTime ||
      newBooking.pickupPoint !== initial.pickupPoint ||
      newBooking.dropPoint !== initial.dropPoint ||
      newBooking.purpose !== initial.purpose
    );
  };

  const handleClose = useCallback(() => {
    if (isDirty()) {
      setShowConfirm(true);
    } else {
      performClose();
    }
  }, [newBooking]);

  const performClose = () => {
    setNewBooking(getInitialState());
    setShowConfirm(false);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    addBooking({
      passengerName: newBooking.passengerName || 'Unknown Passenger',
      bookingDate: newBooking.bookingDate,
      rideTime: newBooking.rideTime,
      pickupPoint: newBooking.pickupPoint || 'Main Central Hub Block A',
      dropPoint: newBooking.dropPoint || 'Coastal Tech Park Gate 4',
      purpose: newBooking.purpose || 'Client Release deployment',
      managerApproval: 'Approved',
      hrStatus: 'Pending',
    });
    // Reset state after submit
    setNewBooking(getInitialState());
    setShowConfirm(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confirmation Dialog Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 z-10 flex flex-col items-center justify-center rounded-2xl p-6 text-center animate-in fade-in">
            <h4 className="text-lg font-bold text-gray-900 dark:text-slate-50 mb-2">Unsaved Changes</h4>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              You have unsaved changes. Are you sure you want to close this form?
            </p>
            <div className="flex space-x-3 w-full justify-center">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={performClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition"
              >
                Discard Changes
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex justify-between items-start pb-4 mb-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-slate-50">Add Booking</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Create a quick booking for employee transport.</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={submitBooking} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Passenger Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={newBooking.passengerName}
              onChange={(e) => setNewBooking({ ...newBooking, passengerName: e.target.value })}
              className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50 focus:outline-none focus:border-blue-500 dark:placeholder-gray-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Service Date</label>
              <input
                type="date"
                value={newBooking.bookingDate}
                onChange={(e) => setNewBooking({ ...newBooking, bookingDate: e.target.value })}
                className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Ride Time</label>
              <input
                type="time"
                value={newBooking.rideTime}
                onChange={(e) => setNewBooking({ ...newBooking, rideTime: e.target.value })}
                className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-slate-50 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Pickup Location</label>
            <input
              type="text"
              placeholder="e.g. Block A, Lobby"
              value={newBooking.pickupPoint}
              onChange={(e) => setNewBooking({ ...newBooking, pickupPoint: e.target.value })}
              className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Drop Point</label>
            <input
              type="text"
              placeholder="e.g. Metro station transit line"
              value={newBooking.dropPoint}
              onChange={(e) => setNewBooking({ ...newBooking, dropPoint: e.target.value })}
              className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-slate-400 block mb-1">Booking Purpose</label>
            <input
              type="text"
              placeholder="e.g. Night shift pickup"
              value={newBooking.purpose}
              onChange={(e) => setNewBooking({ ...newBooking, purpose: e.target.value })}
              className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-900 dark:text-slate-50 dark:placeholder-gray-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-900 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-400 text-xs font-bold rounded-lg duration-155"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm duration-155"
            >
              Submit Booking request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
