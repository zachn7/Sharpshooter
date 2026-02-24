import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generateContract,
  saveContract,
  initializeContractRun,
  type Contract,
  type ContractDifficulty,
} from '../data/contracts';

/**
 * Contracts Page
 * 
 * Allows players to start mini-campaign runs with 3-5 stages,
 * single loadout, and cumulative scoring.
 */
export function Contracts() {
  const navigate = useNavigate();
  const [selectedDifficulty, setSelectedDifficulty] = useState<ContractDifficulty>('easy');
  const [seedOverride, setSeedOverride] = useState<string>('');
  const [generatedContract, setGeneratedContract] = useState<Contract | null>(null);

  const handleGenerateContract = () => {
    const seed = seedOverride ? parseInt(seedOverride, 10) || undefined : undefined;
    const contract = generateContract({
      difficulty: selectedDifficulty,
      seed,
    });
    saveContract(contract);
    setGeneratedContract(contract);
  };

  const handleStartContract = () => {
    if (!generatedContract) return;

    // Initialize run state
    const runState = initializeContractRun(generatedContract);
    
    // Save to local storage
    localStorage.setItem(`contract-run-${generatedContract.id}`, JSON.stringify(runState));
    
    // Navigate to first level
    navigate(`/level/${generatedContract.stages[0].levelId}?contract=${generatedContract.id}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  const difficultyDescriptions = {
    easy: '3 stages. Great for quick practice sessions.',
    medium: '4 stages. A balanced challenge for confident shooters.',
    hard: '5 stages. Test your skills with elite precision requirements.',
  };

  const getDifficultyColor = (diff: ContractDifficulty) => {
    switch (diff) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
    }
  };

  return (
    <div className="page" data-testid="contracts-page">
      <div className="page-header">
        <button
          className="nav-button back-button"
          onClick={handleBack}
          aria-label="Back to main menu"
        >
          ←
        </button>
        <h1 className="page-title">Contracts</h1>
      </div>

      <div className="contracts-content">
        <div className="contracts-intro">
          <p>
            Contracts are mini-campaign runs where you complete 3-5 stages with a single
            loadout and cumulative scoring. Earn badges and cosmetic rewards on completion!
          </p>
        </div>

        <div className="contract-setup">
          <div className="contract-selection">
            <h2>Select Difficulty</h2>
            <div className="difficulty-options">
              {(['easy', 'medium', 'hard'] as ContractDifficulty[]).map((difficulty) => (
                <button
                  key={difficulty}
                  className={`difficulty-button ${selectedDifficulty === difficulty ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty(difficulty)}
                  data-testid={`difficulty-${difficulty}`}
                >
                  <div className={`difficulty-indicator ${getDifficultyColor(difficulty)}`} />
                  <div className="difficulty-info">
                    <span className="difficulty-name">
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                    <span className="difficulty-desc">{difficultyDescriptions[difficulty]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="contract-seed-input">
            <label htmlFor="seed-override">Seed Override (for testing):</label>
            <input
              id="seed-override"
              type="number"
              className="form-input"
              placeholder="Leave blank for random"
              value={seedOverride}
              onChange={(e) => setSeedOverride(e.target.value)}
              data-testid="seed-override"
            />
          </div>

          <button
            className="primary-button generate-button"
            onClick={handleGenerateContract}
            disabled={!selectedDifficulty}
            data-testid="generate-contract"
          >
            Generate Contract
          </button>

          {generatedContract && (
            <div className="contract-preview" data-testid="contract-preview">
              <div className="contract-preview-header">
                <h3>{generatedContract.name}</h3>
                <span className={`contract-badge ${getDifficultyColor(generatedContract.difficulty)}`}>
                  {generatedContract.difficulty.toUpperCase()}
                </span>
              </div>
              
              <p className="contract-description">{generatedContract.description}</p>

              <div className="contract-details">
                <div className="contract-detail">
                  <span className="detail-label">Stages:</span>
                  <span className="detail-value">{generatedContract.stages.length}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Weapon:</span>
                  <span className="detail-value">{generatedContract.weaponType}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Par Score:</span>
                  <span className="detail-value">{generatedContract.totalParScore}</span>
                </div>
                <div className="contract-detail">
                  <span className="detail-label">Rewards:</span>
                  <span className="detail-value">{generatedContract.rewards.length}</span>
                </div>
              </div>

              <div className="contract-rewards">
                <h4>Rewards:</h4>
                {generatedContract.rewards.map((reward) => (
                  <div key={reward.id} className={`reward-item rarity-${reward.rarity}`}>
                    {reward.icon && <span className="reward-icon">{reward.icon}</span>}
                    <div className="reward-info">
                      <span className="reward-name">{reward.name}</span>
                      <span className="reward-type">{reward.rarity} {reward.type}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="primary-button start-contract-button"
                onClick={handleStartContract}
                data-testid="contract-start"
              >
                Start Contract
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
