import { Weapons } from './Weapons';

export function Freeplay() {
  return (
    <div className="freeplay-page" data-testid="freeplay-page">
      <div className="freeplay-intro">
        <h2>Freeplay</h2>
        <p>
          Sandbox mode for testing gear, zeroes, and weird ideas. Every weapon is available here,
          but campaign missions still require proper unlocks.
        </p>
      </div>
      <Weapons mode="freeplay" />
    </div>
  );
}
