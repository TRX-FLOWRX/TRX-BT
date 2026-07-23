export function toIsoString(date = new Date()) {
  return date.toISOString();
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
