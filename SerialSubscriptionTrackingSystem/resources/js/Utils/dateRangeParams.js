export function getDateRangeParams() {
  const query = new URLSearchParams(window.location.search);
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();
  const startDate = query.get('start_date') || `${currentYear}-${currentMonth}-01`;
  const endDate = query.get('end_date') || new Date(currentYear, now.getMonth() + 1, 0).toISOString().split('T')[0];

  return { start_date: startDate, end_date: endDate };
}
