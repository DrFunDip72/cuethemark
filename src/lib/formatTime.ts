
export const formatTime = (seconds: number): string => {
  // Round to 1 decimal place for consistent display
  const roundedSeconds = Math.round(seconds * 10) / 10;
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  
  // Format with 1 decimal place
  const formattedSeconds = remainingSeconds.toFixed(1).padStart(4, '0');
  return `${minutes}:${formattedSeconds}`;
};

// Helper function to round timestamps to 1 decimal place
export const roundToOneDecimal = (value: number): number => {
  return Math.round(value * 10) / 10;
};
