export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function firstWeekday(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export function padDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
