'use client';

import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

export type TransactionStep = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
};

interface TransactionStatusProps {
  steps: TransactionStep[];
  currentStep: number;
  isVisible: boolean;
  error?: string | null;
  onClose?: () => void;
}

export function TransactionStatus({
  steps,
  currentStep,
  isVisible,
  error,
  onClose
}: TransactionStatusProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headerIconRef = useRef<HTMLSpanElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Entry animation
  useEffect(() => {
    if (!isVisible || !overlayRef.current || !modalRef.current) return;

    setIsAnimating(true);
    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false)
    });

    // Reset states
    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set(modalRef.current, { scale: 0.8, opacity: 0, y: 50 });
    gsap.set(stepsRef.current, { x: -30, opacity: 0 });

    // Animate in
    tl.to(overlayRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    })
      .to(modalRef.current, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'back.out(1.7)'
      }, '-=0.1')
      .to(stepsRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power2.out'
      }, '-=0.2');

    // Pulse animation for header icon
    if (headerIconRef.current) {
      gsap.to(headerIconRef.current, {
        scale: 1.2,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    return () => {
      tl.kill();
    };
  }, [isVisible]);

  // Progress bar animation
  useEffect(() => {
    if (!progressRef.current || !isVisible) return;

    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const targetProgress = (completedSteps / steps.length) * 100;

    gsap.to(progressRef.current, {
      width: `${targetProgress}%`,
      duration: 0.8,
      ease: 'power2.out'
    });
  }, [steps, isVisible]);

  // Step status change animations
  useEffect(() => {
    steps.forEach((step, index) => {
      const stepEl = stepsRef.current[index];
      if (!stepEl) return;

      if (step.status === 'active') {
        // Pulse glow effect for active step
        gsap.to(stepEl, {
          boxShadow: '4px 4px 0px 0px #101618',
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });

        // Shake the icon slightly
        const icon = stepEl.querySelector('.step-icon');
        if (icon) {
          gsap.to(icon, {
            rotation: 360,
            duration: 2,
            repeat: -1,
            ease: 'linear'
          });
        }
      } else if (step.status === 'completed') {
        // Success animation
        gsap.killTweensOf(stepEl);
        gsap.to(stepEl, {
          boxShadow: '2px 2px 0px 0px #101618',
          duration: 0.3
        });

        // Pop effect
        gsap.fromTo(stepEl,
          { scale: 1 },
          {
            scale: 1.02,
            duration: 0.2,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
          }
        );

        // Checkmark animation
        const icon = stepEl.querySelector('.step-icon');
        if (icon) {
          gsap.killTweensOf(icon);
          gsap.fromTo(icon,
            { scale: 0, rotation: -180 },
            { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.7)' }
          );
        }
      } else if (step.status === 'error') {
        // Error shake animation
        gsap.killTweensOf(stepEl);
        gsap.to(stepEl, {
          x: [-10, 10, -10, 10, 0] as any,
          duration: 0.5,
          ease: 'power2.out'
        });
      }
    });
  }, [steps]);

  // Close animation
  const handleClose = () => {
    if (!overlayRef.current || !modalRef.current || isAnimating) return;

    const tl = gsap.timeline({
      onComplete: () => onClose?.()
    });

    tl.to(modalRef.current, {
      scale: 0.8,
      opacity: 0,
      y: 30,
      duration: 0.3,
      ease: 'power2.in'
    })
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.2
      }, '-=0.1');
  };

  if (!isVisible) return null;

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl border-2 border-ink shadow-hard-lg w-full max-w-md mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-ink text-white px-6 py-4 border-b-2 border-ink">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex items-center justify-center rounded-lg border-2 border-accent-lime bg-ink">
                <span
                  ref={headerIconRef}
                  className="material-symbols-outlined text-2xl text-accent-lime"
                >
                  swap_horiz
                </span>
              </div>
              <div>
                <h3 className="font-bold uppercase tracking-wider text-sm">Transaction Progress</h3>
                <p className="text-xs text-gray-400 font-medium">
                  {steps.some(s => s.status === 'active')
                    ? 'Processing...'
                    : steps.every(s => s.status === 'completed')
                      ? 'Complete!'
                      : error ? 'Failed' : 'Waiting...'}
                </p>
              </div>
            </div>
            {onClose && !steps.some(s => s.status === 'active') && (
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors border-2 border-transparent hover:border-white/20"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-5 bg-gray-50">
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-ink">
            {/* Progress fill */}
            <div
              ref={progressRef}
              className="relative h-full w-0 rounded-full overflow-hidden bg-accent-lime"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between mt-2 pb-4">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">
              Step {Math.min(completedCount + 1, steps.length)} of {steps.length}
            </span>
            <span className="text-xs font-bold text-ink">{progressPercent}%</span>
          </div>
        </div>

        {/* Steps */}
        <div className="px-6 py-4 space-y-3 bg-white">
          {steps.map((step, index) => (
            <div
              key={step.id}
              ref={el => { stepsRef.current[index] = el; }}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-300 ${step.status === 'completed'
                  ? 'bg-accent-lime/20 border-ink shadow-hard-sm'
                  : step.status === 'active'
                    ? 'bg-primary/10 border-ink shadow-hard-sm'
                    : step.status === 'error'
                      ? 'bg-accent-pink/10 border-accent-pink shadow-hard-sm'
                      : 'bg-gray-50 border-gray-200'
                }`}
            >
              {/* Step Icon */}
              <div className={`step-icon shrink-0 w-8 h-8 rounded-lg border-2 border-ink flex items-center justify-center transition-colors duration-300 ${step.status === 'completed'
                  ? 'bg-accent-lime text-ink'
                  : step.status === 'active'
                    ? 'bg-primary text-white'
                    : step.status === 'error'
                      ? 'bg-accent-pink text-white'
                      : 'bg-white text-gray-500'
                }`}>
                {step.status === 'completed' ? (
                  <span className="material-symbols-outlined text-lg font-bold">check</span>
                ) : step.status === 'active' ? (
                  <span className="material-symbols-outlined text-lg">sync</span>
                ) : step.status === 'error' ? (
                  <span className="material-symbols-outlined text-lg">close</span>
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm transition-colors duration-300 ${step.status === 'completed'
                    ? 'text-ink'
                    : step.status === 'active'
                      ? 'text-ink'
                      : step.status === 'error'
                        ? 'text-accent-pink'
                        : 'text-gray-500'
                  }`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className={`text-xs mt-0.5 transition-colors duration-300 ${step.status === 'active' ? 'text-primary' : 'text-gray-500'
                    }`}>
                    {step.description}
                  </p>
                )}
              </div>

              {/* Status indicator */}
              {step.status === 'active' && (
                <div className="shrink-0 flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4 bg-white">
            <div className="bg-accent-pink/10 border-2 border-accent-pink rounded-lg p-3 shadow-hard-sm">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-accent-pink animate-pulse">error</span>
                <div>
                  <p className="font-bold text-ink text-sm uppercase tracking-wide">Transaction Failed</p>
                  <p className="text-xs text-gray-600 mt-0.5 break-all">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-5 bg-white">
          <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
            <span className={`material-symbols-outlined text-base ${steps.some(s => s.status === 'active') ? 'animate-pulse text-primary' : ''
              }`}>
              {steps.every(s => s.status === 'completed')
                ? 'check_circle'
                : error
                  ? 'warning'
                  : 'info'}
            </span>
            <span className="font-medium">
              {steps.some(s => s.status === 'active')
                ? 'Please sign the transaction in your wallet when prompted.'
                : steps.every(s => s.status === 'completed')
                  ? 'All transactions completed successfully!'
                  : error
                    ? 'Transaction failed. Please try again.'
                    : 'Preparing transaction...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to manage transaction steps
export function useTransactionSteps(initialSteps: Omit<TransactionStep, 'status'>[]) {
  const [steps, setSteps] = useState<TransactionStep[]>(
    initialSteps.map(s => ({ ...s, status: 'pending' as const }))
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const startStep = (stepId: string, description?: string) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId
        ? { ...s, status: 'active' as const, description: description || s.description }
        : s
    ));
    setCurrentStep(prev => {
      const idx = initialSteps.findIndex(s => s.id === stepId);
      return idx >= 0 ? idx : prev;
    });
    setError(null);
  };

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, status: 'completed' as const } : s
    ));
  };

  const failStep = (stepId: string, errorMessage: string) => {
    setSteps(prev => prev.map(s =>
      s.id === stepId ? { ...s, status: 'error' as const } : s
    ));
    setError(errorMessage);
  };

  const reset = () => {
    setSteps(initialSteps.map(s => ({ ...s, status: 'pending' as const })));
    setCurrentStep(-1);
    setError(null);
  };

  const isActive = steps.some(s => s.status === 'active');
  const isComplete = steps.every(s => s.status === 'completed');
  const hasError = steps.some(s => s.status === 'error');

  return {
    steps,
    currentStep,
    error,
    isActive,
    isComplete,
    hasError,
    startStep,
    completeStep,
    failStep,
    reset,
  };
}
