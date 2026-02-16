export class SeededRNG {
  private state: number

  constructor(seed: number) {
    this.state = seed
  }

  // Returns a float in [0, 1)
  next(): number {
    this.state = (this.state * 9301 + 49297) % 233280
    return this.state / 233280
  }

  // Returns a float in [min, max)
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  // Returns a float in [-range, range)
  symmetricRange(range: number): number {
    return this.range(-range, range)
  }
}

export function createRNG(seed: number = Date.now()): SeededRNG {
  return new SeededRNG(seed)
}
