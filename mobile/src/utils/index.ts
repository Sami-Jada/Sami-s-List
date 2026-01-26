// Utility functions

export const formatPhoneNumber = (phone: string): string => {
  // Format phone number for display
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

export const formatCurrency = (amount: number, currency: string = 'JOD'): string => {
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-JO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
};





