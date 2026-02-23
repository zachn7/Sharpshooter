import { useEffect } from 'react';
import type { Lesson } from '../data/lessons';

interface LessonOverlayProps {
  lesson: Lesson;
  currentStepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onSkip?: () => void;
}

export function LessonOverlay({
  lesson,
  currentStepIndex,
  onNext,
  onPrevious,
  onClose,
  onSkip,
}: LessonOverlayProps) {
  const currentStep = lesson.steps[currentStepIndex];
  const isLastStep = currentStepIndex === lesson.steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // If highlightTestId is set, add a highlight ring around the element
  useEffect(() => {
    if (currentStep.highlightTestId) {
      const element = document.querySelector(`[data-testid="${currentStep.highlightTestId}"]]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStepIndex, currentStep.highlightTestId]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998,
        }}
      />

      {/* Lesson card */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 9999,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
        data-testid="lesson-overlay"
      >
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <h3
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.5rem',
              color: '#1a1a2e',
            }}
          >
            {lesson.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: '#666',
            }}
          >
            Step {currentStepIndex + 1} of {lesson.steps.length}
          </p>
        </div>

        {/* Step content */}
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <h4
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.125rem',
              color: '#1a1a2e',
            }}
          >
            {currentStep.title}
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#333',
            }}
          >
            {currentStep.body}
          </p>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {/* Previous button */}
          {!isFirstStep && (
            <button
              onClick={onPrevious}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                backgroundColor: '#e0e0e0',
                color: '#333',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d0d0d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e0e0e0';
              }}
            >
              Previous
            </button>
          )}

          {/* Skip button (optional) */}
          {onSkip && !isLastStep && (
            <button
              onClick={onSkip}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: 'auto',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#999';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              Skip Tutorial
            </button>
          )}

          {/* Next/Close button */}
          {isLastStep ? (
            <button
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                backgroundColor: '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a4a7c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3460';
              }}
            >
              Got It!
            </button>
          ) : (
            <button
              onClick={onNext}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                backgroundColor: '#0f3460',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1a4a7c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3460';
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default LessonOverlay;
