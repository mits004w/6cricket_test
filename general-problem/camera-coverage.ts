// Representing each hardware camera as a rectangle: { minDist, maxDist, minLight, maxLight }

// For every possible combination of distance & light, at least one rectangle (hardware camera) must cover it.

type Range = [number, number];

interface HardwareCamera {
  distanceRange: Range;
  lightRange: Range;
}

interface SoftwareCameraRequirement {
  distanceRange: Range;
  lightRange: Range;
}

function willSuffice(
  desired: SoftwareCameraRequirement,
  hardware: HardwareCamera[]
): boolean {
  const [minDist, maxDist] = desired.distanceRange;
  const [minLight, maxLight] = desired.lightRange;

  // Step 1: Iterate over possible distance intervals
  // Ccheck that for each segment of distance covered by hardware cameras,
  // the union of their light ranges fully covers the desired light range.

  // Sort cameras by their min distance
  const sorted = hardware.sort((a, b) => a.distanceRange[0] - b.distanceRange[0]);

  let coveredDistEnd = minDist;

  for (const cam of sorted) {
    const [dMin, dMax] = cam.distanceRange;

    // Skip if camera starts beyond the next uncovered portion
    if (dMin > coveredDistEnd + 1e-9) {
      // Gap found
      return false;
    }

    // Collect all cameras overlapping this distance interval
    const overlappingCams = hardware.filter(
      (c) => c.distanceRange[0] <= coveredDistEnd && c.distanceRange[1] >= dMin
    );

    // Merge all their light ranges
    const mergedLight = mergeRanges(overlappingCams.map((c) => c.lightRange));

    // Check if their light coverage includes full required light range
    const isLightFullyCovered = mergedLight.some(
      ([lMin, lMax]) => lMin <= minLight && lMax >= maxLight
    );

    if (!isLightFullyCovered) {
      return false;
    }

    // Extend distance coverage
    coveredDistEnd = Math.max(coveredDistEnd, dMax);
    if (coveredDistEnd >= maxDist) break;
  }

  // Finally ensure we covered till the end of distance
  return coveredDistEnd >= maxDist;
}

// Helper function to merge numeric ranges
function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];
  const sorted = ranges.sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const [curMin, curMax] = sorted[i];
    const last = merged[merged.length - 1];
    if (curMin <= last[1]) {
      last[1] = Math.max(last[1], curMax);
    } else {
      merged.push([curMin, curMax]);
    }
  }
  return merged;
}

// ---------------- Example Usage ----------------
const desired: SoftwareCameraRequirement = {
  distanceRange: [0, 100],
  lightRange: [0, 100],
};

const hardware: HardwareCamera[] = [
  { distanceRange: [0, 50], lightRange: [0, 100] },
  { distanceRange: [50, 100], lightRange: [0, 100] },
];

console.log(willSuffice(desired, hardware)); // true

const hardware2: HardwareCamera[] = [
  { distanceRange: [0, 60], lightRange: [0, 50] },
  { distanceRange: [60, 100], lightRange: [50, 100] },
];

console.log(willSuffice(desired, hardware2)); // false (gaps in light coverage)
