
export const formatTime = (seconds: number): string => {
  // Round to 1 decimal place for calculations but display as whole numbers in timeline
  const roundedSeconds = Math.round(seconds * 10) / 10;
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  
  // Format with 1 decimal place for precise timestamps
  const formattedSeconds = remainingSeconds.toFixed(1).padStart(4, '0');
  return `${minutes}:${formattedSeconds}`;
};

// New function for timeline display (whole numbers only)
export const formatTimeForDisplay = (seconds: number): string => {
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;
  
  // Format without decimals for timeline display
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${formattedSeconds}`;
};

// Helper function to round timestamps to 1 decimal place
export const roundToOneDecimal = (value: number): number => {
  return Math.round(value * 10) / 10;
};
