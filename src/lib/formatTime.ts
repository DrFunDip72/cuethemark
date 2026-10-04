/** 83.4 -> "1:23" */
export const formatClock = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

/** 83.4 -> "1:23.4" — used where instructors fine-tune a marker. */
export const formatPrecise = (seconds: number): string => {
  const tenths = Math.round(seconds * 10);
  const mins = Math.floor(tenths / 600);
  const secs = (tenths % 600) / 10;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
};

/** "1:23.4" or "83.4" -> 83.4; returns null when unparseable. */
export const parseTime = (value: string): number | null => {
  const parts = value.trim().split(':');
  if (parts.length > 2) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return parts.length === 2 ? nums[0] * 60 + nums[1] : nums[0];
};
