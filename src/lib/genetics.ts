import { type Pigeon } from "./db";

/**
 * Calculates the Coefficient of Inbreeding (COI) for a pigeon.
 */
export function calculateCOI(target: Pigeon, allPigeons: Pigeon[], maxDepth = 5): number {
  if (!target.fatherId || !target.motherId) return 0;
  return calculateHypotheticalCOI(target.fatherId, target.motherId, allPigeons, maxDepth);
}

/**
 * Calculates the hypothetical COI for potential offspring of two parents.
 * Uses Wright's Path Method.
 * 
 * @param fatherId ID of the sire
 * @param motherId ID of the dam
 * @param allPigeons All pigeons in the database
 * @param maxDepth How many generations to go back (default 10).
 */
export function calculateHypotheticalCOI(
  fatherId: string | undefined, 
  motherId: string | undefined, 
  allPigeons: Pigeon[], 
  maxDepth = 10
): number {
  if (!fatherId || !motherId) return 0;

  const fatherAncestors = getAncestorsWithDepth(fatherId, allPigeons, maxDepth);
  const motherAncestors = getAncestorsWithDepth(motherId, allPigeons, maxDepth);

  let coi = 0;

  // Find common ancestors
  for (const [id, depthF] of fatherAncestors.entries()) {
    if (motherAncestors.has(id)) {
      const depthM = motherAncestors.get(id)!;
      // Formula: (1/2)^(n1 + n2 + 1)
      // n1 = generations from father to ancestor
      // n2 = generations from mother to ancestor
      coi += Math.pow(0.5, depthF + depthM + 1);
    }
  }

  return coi * 100; // Convert to percentage
}

function getAncestorsWithDepth(
  id: string, 
  allPigeons: Pigeon[], 
  maxDepth: number, 
  currentDepth = 0, 
  map = new Map<string, number>()
): Map<string, number> {
  if (currentDepth >= maxDepth) return map;

  const p = allPigeons.find(x => x.id === id);
  if (!p) return map;

  // If already found at a shallower depth, keep the shallow one
  if (map.has(id) && map.get(id)! <= currentDepth) {
    // do nothing
  } else {
    map.set(id, currentDepth);
  }

  if (p.fatherId) getAncestorsWithDepth(p.fatherId, allPigeons, maxDepth, currentDepth + 1, map);
  if (p.motherId) getAncestorsWithDepth(p.motherId, allPigeons, maxDepth, currentDepth + 1, map);

  return map;
}
