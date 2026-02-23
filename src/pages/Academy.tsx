import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LESSONS, LESSON_CATEGORIES, getLessonsByCategory } from '../data/lessons';
import LessonOverlay from '../components/LessonOverlay';
import type { Lesson } from '../data/lessons';
import { getCompletedLessons, setLessonCompleted } from '../storage';

export function Academy() {
  const navigate = useNavigate();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const completedLessons = getCompletedLessons();

  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setCurrentStepIndex(0);
  };

  const handleNext = () => {
    if (activeLesson && currentStepIndex < activeLesson.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleClose = () => {
    if (activeLesson) {
      // Mark lesson as complete when user finishes or closes it
      setLessonCompleted(activeLesson.id);
    }
    setActiveLesson(null);
    setCurrentStepIndex(0);
  };

  const handleSkip = () => {
    if (activeLesson) {
      handleClose();
    }
  };

  const handleStepAction = () => {
    if (!activeLesson) return;

    const currentStep = activeLesson.steps[currentStepIndex];
    
    // If this is an interactive practice step and lesson has a tutorialId, launch game
    if (currentStep.action && activeLesson.tutorialId) {
      // Launch the game with the tutorial parameter
      // The game will use the tutorial scenario for this lesson
      // Note: We use 'tutorial' as a placeholder levelId since tutorialId determines the level
      navigate(`/game/tutorial?tutorialId=${activeLesson.tutorialId}&testMode=true`);
      // Close the overlay since we're navigating away
      setActiveLesson(null);
    } else {
      // Otherwise, just go to next step
      handleNext();
    }
  };

  // Check if lesson is locked (prerequisite not completed)
  const isLessonLocked = (lesson: Lesson): boolean => {
    if (!lesson.prerequisite) return false;
    return !completedLessons.includes(lesson.prerequisite);
  };

  // Check if lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    return completedLessons.includes(lessonId);
  };

  return (
    <div className="academy-page" data-testid="academy-page" style={{ padding: '1rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '2rem',
            marginBottom: '1rem',
            color: '#1a1a2e',
          }}
        >
          Tutorial Academy
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: '#666',
            marginBottom: '2rem',
          }}
        >
          Learn the fundamentals of ballistics simulation through interactive lessons.
        </p>

        {/* Lessons by category */}
        {LESSON_CATEGORIES.map((category) => {
          const categoryLessons = getLessonsByCategory(category);
          if (categoryLessons.length === 0) return null;

          return (
            <div
              key={category}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3
                style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.375rem',
                  color: '#1a1a2e',
                }}
              >
                {category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categoryLessons.map((lesson) => {
                  const locked = isLessonLocked(lesson);
                  const completed = isLessonCompleted(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        if (!locked) {
                          startLesson(lesson);
                        }
                      }}
                      disabled={locked}
                      data-testid={`lesson-${lesson.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '1rem',
                        textAlign: 'left',
                        backgroundColor: locked ? '#f0f0f0' : '#f8f9fa',
                        border: locked ? '1px solid #e0e0e0' : '1px solid #0f3460',
                        borderRadius: '8px',
                        cursor: locked ? 'not-allowed' : 'pointer',
                        opacity: locked ? 0.6 : 1,
                        transition: 'all 0.2s',
                      }}
                      {...(!locked && {
                        onMouseEnter: (e) => {
                          e.currentTarget.style.backgroundColor = '#e9ecef';
                        },
                        onMouseLeave: (e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        },
                      })}
                    >
                      {/* Status icon */}
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          marginRight: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: completed ? '#10b981' : locked ? '#9ca3af' : '#0f3460',
                          color: 'white',
                          fontSize: '1rem',
                        }}
                      >
                        {completed ? '✓' : locked ? '🔒' : '▶'}
                      </div>

                      {/* Lesson info */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: completed ? '600' : '500',
                            color: '#1a1a2e',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {lesson.title}
                        </div>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: '#666',
                          }}
                        >
                          {lesson.description}
                        </div>
                        {locked && lesson.prerequisite && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              marginTop: '0.25rem',
                            }}
                          >
                            Complete "{LESSONS.find((l) => l.id === lesson.prerequisite)?.title}"
                            first
                          </div>
                        )}
                      </div>

                      {/* Start/Completed label */}
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: completed ? '#10b981' : '#0f3460',
                          fontWeight: '600',
                        }}
                      >
                        {completed ? 'Completed' : locked ? 'Locked' : 'Start'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* No lessons message */}
        {LESSONS.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: '#666',
              padding: '2rem',
            }}
          >
            No lessons available yet. Check back soon!
          </p>
        )}
      </div>

      {/* Lesson Overlay */}
      {activeLesson && (
        <LessonOverlay
          lesson={activeLesson}
          currentStepIndex={currentStepIndex}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleClose}
          onSkip={handleSkip}
          onAction={handleStepAction}
        />
      )}
    </div>
  );
}