import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getContractById,
  generateRunSummary,
  type ContractRunState,
  type ContractRunSummary,
} from '../data/contracts';

/**
 * Contract Summary Screen
 * 
 * Shows end-of-run summary with total score, stars earned,
 * best shot, worst miss, group size highlights, and rewards.
 */
export function ContractSummary() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = searchParams.get('contract');
  const [summary] = useState<ContractRunSummary | null>(() => {
    // Immediately load from local storage to avoid setState in useEffect
    if (!contractId) return null;
    const runStateStr = localStorage.getItem(`contract-run-${contractId}`);
    if (!runStateStr) return null;
    const runState: ContractRunState = JSON.parse(runStateStr);
    const contract = getContractById(contractId);
    if (!contract) return null;
    return generateRunSummary(runState, contract);
  });
  const loading = !summary;

  useEffect(() => {
    if (!contractId) {
      navigate('/contracts');
      return;
    }

    // Check if data exists, if not navigate away
    const runStateStr = localStorage.getItem(`contract-run-${contractId}`);
    if (!runStateStr) {
      navigate('/contracts');
      return;
    }

    const contract = getContractById(contractId);
    if (!contract) {
      navigate('/contracts');
      return;
    }
  }, [contractId, navigate]);

  const handleBackToContracts = () => {
    navigate('/contracts');
  };

  const handlePlayAgain = () => {
    const contractId = searchParams.get('contract');
    if (contractId) {
      // Clear previous run state
      localStorage.removeItem(`contract-run-${contractId}`);
      // Navigate back to contracts page
      navigate('/contracts');
    }
  };

  if (loading || !summary) {
    return <div className="loading">Loading...</div>;
  }

  const completionPercent = summary.totalStages > 0
    ? Math.round((summary.stagesCompleted / summary.totalStages) * 100)
    : 0;

  return (
    <div className="page" data-testid="contract-summary">
      <div className="page-header">
        <button
          className="nav-button back-button"
          onClick={handleBackToContracts}
          aria-label="Back to Contracts"
        >
          ←
        </button>
        <h1 className="page-title">Contract Summary</h1>
      </div>

      <div className="contract-summary-content">
        <div className={`summary-header ${summary.completed ? 'completed' : 'abandoned'}`}>
          <h2>
            {summary.completed ? '🎉 Contract Complete!' : 'Contract Abandoned'}
          </h2>
          <div className="completion-bar">
            <div
              className="completion-fill"
              style={{ width: `${completionPercent}%` }}
            />
            <span className="completion-text">{completionPercent}%</span>
          </div>
        </div>

        <div className="summary-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Score</div>
            <div className="stat-value_large">{summary.totalScore}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stars Earned</div>
            <div className="stat-value_large">{'⭐'.repeat(Math.min(summary.totalStars, 5))}</div>
            <div className="stat-value_small">{summary.totalStars}/15</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Shots</div>
            <div className="stat-value_large">{summary.totalShots}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stages</div>
            <div className="stat-value_large">{summary.stagesCompleted}/{summary.totalStages}</div>
          </div>
        </div>

        {summary.bestShot && (
          <div className="shot-highlight best-shot">
            <h3>🎯 Best Shot</h3>
            <div className="shot-details">
              <span className="shot-distance">{(summary.bestShot.bestDistance || 0).toFixed(2)} MIL</span>
              <span className="shot-info">Stage {summary.bestShot.stageNumber}</span>
            </div>
          </div>
        )}

        {summary.worstMiss && summary.worstMiss.worstMiss !== undefined && (
          <div className="shot-highlight worst-shot">
            <h3>❌ Worst Miss</h3>
            <div className="shot-details">
              <span className="shot-distance">{summary.worstMiss.worstMiss.toFixed(2)} MIL</span>
              <span className="shot-info">Stage {summary.worstMiss.stageNumber}</span>
            </div>
          </div>
        )}

        <div className="rewards-section">
          <h3>Rewards Earned</h3>
          {summary.rewards.length > 0 ? (
            <div className="rewards-list">
              {summary.rewards.map((reward) => (
                <div key={reward.id} className={`reward-card rarity-${reward.rarity}`}>
                  {summary.completed ? (
                    <>
                      {reward.icon && <span className="reward-icon">{reward.icon}</span>}
                      <div className="reward-details">
                        <span className="reward-name">{reward.name}</span>
                        <span className="reward-desc">{reward.description}</span>
                      </div>
                    </>
                  ) : (
                    <span className="reward-locked">
                      {reward.icon && <span className="reward-icon">🔒</span>}
                      <div className="reward-details">
                        <span className="reward-name">{reward.name}</span>
                        <span className="reward-desc">Complete contract to unlock</span>
                      </div>
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-rewards">No rewards available</p>
          )}
        </div>

        <div className="summary-actions">
          <button
            className="primary-button"
            onClick={handleBackToContracts}
          >
            Back to Contracts
          </button>
          {summary.completed && (
            <button
              className="secondary-button"
              onClick={handlePlayAgain}
            >
              Play Again
            </button>
          )}
        </div>

        <div className="share-section">
          <button
            className="icon-button"
            onClick={() => {
              // Share/export functionality can be added later
              alert('Share feature coming soon!');
            }}
            title="Share results"
          >
            📤 Share
          </button>
        </div>
      </div>
    </div>
  );
}
