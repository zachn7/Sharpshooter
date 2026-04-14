import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LESSONS, LESSON_CATEGORIES, getLessonsByCategory } from '../data/lessons';
import LessonOverlay from '../components/LessonOverlay';
import type { Lesson } from '../data/lessons';
import { getCompletedLessons, setLessonCompleted } from '../storage';

export function Academy() {
  const navigate = useNavigate();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const completedLessons = getCompletedLessons();
  const [searchParams] = useSearchParams();
  const isTestMode = searchParams.get('testMode') === '1' || searchParams.get('testMode') === 'true';

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
    if (currentStep.action && activeLesson.tutorialId) {
      navigate(`/game/tutorial?tutorialId=${activeLesson.tutorialId}&testMode=true`);
      setActiveLesson(null);
      return;
    }

    handleNext();
  };

  const isLessonLocked = (lesson: Lesson): boolean => {
    if (isTestMode || !lesson.prerequisite) {
      return false;
    }

    return !completedLessons.includes(lesson.prerequisite);
  };

  const isLessonCompleted = (lessonId: string): boolean => completedLessons.includes(lessonId);

  return (
    <div className="academy-page" data-testid="academy-page">
      <div className="academy-shell">
        <header className="academy-hero">
          <div>
            <h1>Tutorial Academy</h1>
            <p>
              Learn the basics in a sane order, then jump into guided practice. Lessons unlock one
              by one so the game teaches you without dumping a ballistics textbook on your face.
            </p>
          </div>
          <div className="academy-hero-card">
            <span className="academy-hero-label">Progress</span>
            <strong>{completedLessons.length}/{LESSONS.length} lessons completed</strong>
            <span className="academy-hero-subtext">Finish lessons to build confidence before campaign progression ramps up.</span>
          </div>
        </header>

        {LESSON_CATEGORIES.map((category) => {
          const categoryLessons = getLessonsByCategory(category);
          if (categoryLessons.length === 0) return null;

          return (
            <section key={category} className="academy-section">
              <div className="academy-section-header">
                <h2>{category}</h2>
                <span>{categoryLessons.length} lesson{categoryLessons.length === 1 ? '' : 's'}</span>
              </div>

              <div className="academy-lesson-list">
                {categoryLessons.map((lesson) => {
                  const locked = isLessonLocked(lesson);
                  const completed = isLessonCompleted(lesson.id);
                  const prerequisiteTitle = lesson.prerequisite
                    ? LESSONS.find((candidate) => candidate.id === lesson.prerequisite)?.title
                    : null;

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      className={`academy-lesson-card ${locked ? 'locked' : ''} ${completed ? 'completed' : ''}`}
                      onClick={() => !locked && startLesson(lesson)}
                      disabled={locked}
                      data-testid={`lesson-${lesson.id}`}
                    >
                      <div className="academy-status-icon" aria-hidden="true">
                        {completed ? '✓' : locked ? '🔒' : '▶'}
                      </div>

                      <div className="academy-lesson-content">
                        <div className="academy-lesson-topline">
                          <h3>{lesson.title}</h3>
                          <span className="academy-lesson-state">
                            {completed ? 'Completed' : locked ? 'Locked' : 'Start'}
                          </span>
                        </div>
                        <p>{lesson.description}</p>
                        {locked && prerequisiteTitle && (
                          <span className="academy-lesson-prereq">
                            Complete “{prerequisiteTitle}” first
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        {LESSONS.length === 0 && <p className="academy-empty">No lessons available yet. Rude, honestly.</p>}
      </div>

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
