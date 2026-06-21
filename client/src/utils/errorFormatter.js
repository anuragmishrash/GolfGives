export const formatError = (error) => {
  const msg = error?.message || error?.response?.data?.message || String(error) || '';
  
  if (msg.includes('unique constraint')) 
    return 'This entry already exists.';
  if (msg.includes('JWT') || msg.includes('jwt')) 
    return 'Session expired. Please log in again.';
  if (msg.includes('foreign key')) 
    return 'Invalid reference. Please refresh and try again.';
  if (msg.includes('network') || msg.includes('Network Error')) 
    return 'Connection error. Check your internet and retry.';
  if (msg.includes('No active subscription'))
    return 'No active subscription found to cancel. Please contact support.';
  
  return msg || 'Something went wrong. Please try again.';
};
