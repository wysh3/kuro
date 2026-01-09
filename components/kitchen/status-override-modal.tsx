'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateCampusStatus } from '@/lib/firebase/db';
import { CampusStatus } from '@/lib/firebase/db';

interface StatusOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus?: CampusStatus | null;
}

export function StatusOverrideModal({ isOpen, onClose, currentStatus }: StatusOverrideModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for manual override');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCampusStatus({
        crowdLevel: selectedLevel,
        crowdScore: selectedLevel === 'low' ? 20 : selectedLevel === 'medium' ? 50 : 80,
        estimatedWait: selectedLevel === 'low' ? 5 : selectedLevel === 'medium' ? 15 : 30,
        isManualOverride: true,
        manualOverrideReason: reason,
        calculationMethod: 'manual'
      });

      onClose();
      setReason('');

      setTimeout(() => {
        setIsSubmitting(false);
        alert('✅ Override applied successfully. Auto-calculation will resume in 30 minutes.');
      }, 1000);
    } catch (error) {
      console.error('Failed to apply override:', error);
      setIsSubmitting(false);
      alert('❌ Failed to apply override. Please try again.');
    }
  };

  const handleResumeAuto = async () => {
    setIsSubmitting(true);
    try {
      await updateCampusStatus({
        isManualOverride: false,
        calculationMethod: 'auto'
      });

      onClose();

      setTimeout(() => {
        setIsSubmitting(false);
        alert('✅ Auto-calculation resumed successfully!');
      }, 1000);
    } catch (error) {
      console.error('Failed to resume auto mode:', error);
      setIsSubmitting(false);
      alert('❌ Failed to resume auto mode. Please try again.');
    }
  };

  const levelOptions = [
    { value: 'low' as const, label: 'Low', description: 'Not Busy', color: 'bg-green-500' },
    { value: 'medium' as const, label: 'Medium', description: 'Moderate', color: 'bg-yellow-500' },
    { value: 'high' as const, label: 'High', description: 'Very Crowded', color: 'bg-red-500' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentStatus?.isManualOverride ? 'Manage Crowd Status' : 'Manual Crowd Status Override'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {currentStatus && (
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Status</div>
              <div className="text-2xl font-bold capitalize mt-1">
                {currentStatus.crowdLevel}
                {currentStatus.isManualOverride && (
                  <span className="ml-2 text-sm font-normal text-orange-500">
                    (Manual)
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Crowd Score: {currentStatus.crowdScore} • Wait: {currentStatus.estimatedWait}m
              </div>
              {currentStatus.isManualOverride && currentStatus.manualOverrideReason && (
                <div className="text-xs text-gray-400 mt-2 italic">
                  Reason: {currentStatus.manualOverrideReason}
                </div>
              )}
            </div>
          )}

          {currentStatus?.isManualOverride ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="text-sm text-green-800 dark:text-green-300">
                    <strong>Resume Auto Mode</strong><br />
                    Click below to let the AI recalculate crowd status based on active orders.
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleResumeAuto}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Resuming...' : 'Resume Auto Mode'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base">Select New Status</Label>
                <div className="grid grid-cols-3 gap-3">
                  {levelOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedLevel(option.value)}
                      className={`
                        relative p-4 rounded-lg border-2 transition-all
                        ${selectedLevel === option.value
                          ? `${option.color} border-opacity-100`
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }
                      `}
                    >
                      <div className={`w-3 h-3 rounded-full ${option.color} mb-2 ${
                        selectedLevel === option.value ? 'animate-pulse' : ''
                      }`} />
                      <div className="font-semibold text-sm">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      {selectedLevel === option.value && (
                        <motion.div
                          layoutId="selectedLevel"
                          className="absolute inset-0 rounded-lg bg-black/5"
                          initial={false}
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="reason" className="text-base">
                  Reason for Override <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why you're manually setting the status (e.g., 'Special event', 'Equipment issue', 'Staff shortage')..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>ℹ️ Note:</strong> Auto-calculation will resume in 30 minutes.
                  Set reminders to update again if needed.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !reason.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Applying...' : 'Apply Override'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
