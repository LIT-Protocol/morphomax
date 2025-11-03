export const intervalMap = {
  daily: '1 day',
  monthly: '1 month',
  weekly: '1 week',
} as const;

export type IntervalKey = keyof typeof intervalMap;
export type IntervalValue = (typeof intervalMap)[IntervalKey];

export const intervalKeys = Object.keys(intervalMap) as IntervalKey[];
export const intervalValues = Object.values(intervalMap) as IntervalValue[];
