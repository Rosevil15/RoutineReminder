import type { Routine, TimeBlock } from '../types';

const TIME_BLOCK_ORDER: TimeBlock[] = ['morning', 'afternoon', 'evening'];

/**
 * Groups routines by their time block.
 * Always returns groups in morning → afternoon → evening order.
 * Groups with no routines are included as empty arrays.
 */
export function groupByTimeBlock(routines: Routine[]): Record<TimeBlock, Routine[]> {
  const groups: Record<TimeBlock, Routine[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  for (const routine of routines) {
    groups[routine.timeBlock].push(routine);
  }
  return groups;
}

/**
 * Returns the ordered list of time blocks (always morning → afternoon → evening).
 */
export function getTimeBlockOrder(): TimeBlock[] {
  return [...TIME_BLOCK_ORDER];
}
