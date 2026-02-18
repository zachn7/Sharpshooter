/**
 * Sign Conventions and Coordinate Systems for Sharpshooter
 * 
 * This is the single source of truth for all sign conventions in the game.
 * All physics, aim mapping, and UI rendering MUST follow these conventions.
 * 
 * ============ WORLD COORDINATE SYSTEM ============
 * 
 * Origin (0, 0, 0) is at the target center.
 * X-axis: Along the flight path from shooter to target.
 *   - Positive X: Toward the target (forward)
 *   - Negative X: Toward the shooter (backward)
 * Y-axis: Vertical direction
 *   - Positive Y: UP
 *   - Negative Y: DOWN
 * Z-axis: Horizontal direction, perpendicular to flight path
 *   - Positive Z: RIGHT (from shooter's perspective)
 *   - Negative Z: LEFT (from shooter's perspective)
 * 
 * ============ AIMING COORDINATES ============
 * 
 * Aim coordinates represent where the shooter aims RELATIVE to the target center.
 * 
 * aimX_M: Longitudinal aim (distance from shooter)
 *   - aimX_M = distanceM would aim at the target center
 *   - aimX_M = distanceM + 0.1 would aim 10cm BEYOND the target
 * 
 * aimY_M: Vertical aim offset from target center
 *   - Positive aimY_M: Aim ABOVE target center
 *   - Negative aimY_M: Aim BELOW target center
 * 
 * aimZ_M: Horizontal aim offset from target center
 *   - Positive aimZ_M: Aim to the RIGHT of target center
 *   - Negative aimZ_M: Aim to the LEFT of target center
 * 
 * ============ TURRET DIALS ============
 * 
 * Turret adjustments shift the point of impact (POI) in the specified direction.
 * 
 * elevationMils: Turret elevation dial (vertical adjustment)
 *   - Positive elevationMils: Shift POI UP
 *   - Negative elevationMils: Shift POI DOWN
 *   - One MIL at 100m distance = 10cm vertical POI shift
 * 
 * windageMils: Turret windage dial (horizontal adjustment)
 *   - Positive windageMils: Shift POI to the RIGHT
 *   - Negative windageMils: Shift POI to the LEFT
 *   - One MIL at 100m distance = 10cm horizontal POI shift
 * 
 * ============ WIND EFFECTS ============
 * 
 * windMps: Crosswind velocity (perpendicular to bullet trajectory)
 *   - Positive windMps: Wind from LEFT to RIGHT
 *     → Bullet drifts to the RIGHT (positive Z direction)
 *   - Negative windMps: Wind from RIGHT to LEFT
 *     → Bullet drifts to the LEFT (negative Z direction)
 * 
 * ============ IMPACT COORDINATES ============
 * 
 * Impact coordinates represent where the bullet hit RELATIVE to the target center.
 * 
 * impactY_M: Vertical impact offset
 *   - Positive impactY_M: Hit ABOVE target center
 *   - Negative impactY_M: Hit BELOW target center
 * 
 * impactZ_M: Horizontal impact offset
 *   - Positive impactZ_M: Hit to the RIGHT of target center
 *   - Negative impactZ_M: Hit to the LEFT of target center
 * 
 * ============ CANVAS/WORLD MAPPING ============
 * 
 * Canvas coordinates (pixels): Top-left is (0, 0)
 * - X increases to the RIGHT
 * - Y increases DOWNWARD
 * 
 * World coordinates transform:
 * - World X maps proportionally to Canvas X
 * - World Y (up) maps INVERSELY to Canvas Y (down)
 *   - Larger world Y → smaller canvas Y
 *   - Smaller world Y → larger canvas Y
 * 
 * ============ MAPPING EXAMPLES ============
 * 
 * Example 1: Pure rightward aim (no turret, no wind)
 *   - aimX_M = 100m (at target distance)
 *   - aimY_M = 0 (aim at center)
 *   - aimZ_M = +0.1m (aim 10cm right of center)
 *   - Impact: Z = +0.1m (hits 10cm right of center) ✅
 * 
 * Example 2: Pure leftward turret dial (compensate for right wind)
 *   - aimX_M = 100m (at target distance)
 *   - aimY_M = 0
 *   - aimZ_M = 0 (aim at center)
 *   - windageMils = -1.0 (dial 1 MIL left)
 *   - Effect: Aim shifts LEFT by 0.1m at 100m
 *   - Adjusted aimZ_M = +0.1m (actually aiming 10cm left of target center)
 *   - Impact: Z = +0.1m (hits left of center) ✅
 * 
 * Example 3: Rightward wind (drifts bullet right)
 *   - aimX_M = 100m
 *   - aimY_M = 0
 *   - aimZ_M = 0
 *   - windMps = +5 m/s
 *   - Effect: Bullet drifts RIGHT (positive Z)
 *   - Impact: Z = +0.x m (hits right of center) ✅
 * 
 * ============ TESTING ============
 * 
 * All regression tests should verify:
 * 1. Increasing windageMils → increase impactZ_M (more rightward hits)
 * 2. Increasing elevationMils → increase impactY_M (higher hits)
 * 3. Increasing crosswind (+) → increase impactZ_M (rightward drift)
 * 4. All coordinates follow right-hand rule convention
 * 
 * @module conventions
 */