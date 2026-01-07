'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { LuX, LuRefreshCw, LuTriangleAlert, LuCheck } from 'react-icons/lu';
import type { EncounterStatus } from '@/lib/types/fhir';
import {
  getAllowedStatusTransitions,
  ENCOUNTER_STATUS_OPTIONS,
  getStatusLabel,
} from '@/lib/fhir/encounter';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: EncounterStatus;
  onUpdate: (newStatus: EncounterStatus) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

function getStatusColor(status: EncounterStatus): string {
  switch (status) {
    case 'finished':
      return 'border-green-500 bg-green-50 text-green-700';
    case 'in-progress':
      return 'border-blue-500 bg-blue-50 text-blue-700';
    case 'planned':
    case 'arrived':
    case 'triaged':
      return 'border-amber-500 bg-amber-50 text-amber-700';
    case 'onleave':
      return 'border-purple-500 bg-purple-50 text-purple-700';
    case 'cancelled':
    case 'entered-in-error':
      return 'border-red-500 bg-red-50 text-red-700';
    default:
      return 'border-slate-300 bg-slate-50 text-slate-700';
  }
}

function getSelectedStatusColor(status: EncounterStatus): string {
  switch (status) {
    case 'finished':
      return 'border-green-600 bg-green-100 ring-2 ring-green-600 text-green-800';
    case 'in-progress':
      return 'border-blue-600 bg-blue-100 ring-2 ring-blue-600 text-blue-800';
    case 'planned':
    case 'arrived':
    case 'triaged':
      return 'border-amber-600 bg-amber-100 ring-2 ring-amber-600 text-amber-800';
    case 'onleave':
      return 'border-purple-600 bg-purple-100 ring-2 ring-purple-600 text-purple-800';
    case 'cancelled':
    case 'entered-in-error':
      return 'border-red-600 bg-red-100 ring-2 ring-red-600 text-red-800';
    default:
      return 'border-slate-600 bg-slate-100 ring-2 ring-slate-600 text-slate-800';
  }
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  currentStatus,
  onUpdate,
  isLoading = false,
  error = null,
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<EncounterStatus>(currentStatus);
  
  // Reset selection when modal opens with new current status
  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(currentStatus);
    }
  }, [isOpen, currentStatus]);
  
  if (!isOpen) return null;
  
  const allowedTransitions = getAllowedStatusTransitions(currentStatus);
  const hasValidTransitions = allowedTransitions.length > 0;
  
  // Get all available options (current + allowed transitions)
  const availableOptions = ENCOUNTER_STATUS_OPTIONS.filter(
    (opt) => opt.value === currentStatus || allowedTransitions.includes(opt.value)
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStatus !== currentStatus) {
      await onUpdate(selectedStatus);
    }
  };
  
  const isUnchanged = selectedStatus === currentStatus;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Update Status</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            disabled={isLoading}
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* Current Status Display */}
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-sm text-slate-500">Current Status</p>
              <p className="text-lg font-medium text-slate-900 mt-0.5">
                {getStatusLabel(currentStatus)}
              </p>
            </div>
            
            {/* Status Options Grid */}
            {hasValidTransitions ? (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Select New Status</p>
                <div className="grid grid-cols-2 gap-3">
                  {availableOptions.map((option) => {
                    const isSelected = selectedStatus === option.value;
                    const isCurrent = currentStatus === option.value;
                    
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedStatus(option.value)}
                        disabled={isLoading || isCurrent}
                        className={`
                          relative p-4 rounded-lg border-2 text-left transition-all
                          ${isCurrent 
                            ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed opacity-60' 
                            : isSelected 
                              ? getSelectedStatusColor(option.value)
                              : `${getStatusColor(option.value)} hover:shadow-md cursor-pointer`
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.label}</span>
                          {isSelected && !isCurrent && (
                            <LuCheck className="w-5 h-5" />
                          )}
                          {isCurrent && (
                            <span className="text-xs bg-slate-200 px-2 py-0.5 rounded">Current</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <LuTriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    No transitions available
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {currentStatus === 'entered-in-error' 
                      ? 'This encounter has been marked as entered in error and cannot be changed.'
                      : 'This status cannot be changed further.'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUnchanged || !hasValidTransitions}
              isLoading={isLoading}
            >
              <LuRefreshCw className="w-4 h-4" />
              Update Status
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateStatusModal;