export const getManilaTime = (): string => {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour12: true,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getManilaDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const calculateHours = (clockIn: string, clockOut: string): number => {
  const clockInDate = new Date(clockIn);
  const clockOutDate = new Date(clockOut);
  const diffMs = clockOutDate.getTime() - clockInDate.getTime();
  return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"` 
        : value
    ).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
