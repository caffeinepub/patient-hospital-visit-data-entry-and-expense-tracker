import type { VisitEntry } from '../backend';
import { format } from 'date-fns';

export interface MonthlyTotal {
  period: string;
  month: number;
  year: number;
  hospitalRs: number;
  medicineRs: number;
  total: number;
  label: string;
}

export interface YearlyTotal {
  year: number;
  hospitalRs: number;
  medicineRs: number;
  total: number;
  label: string;
}

export function calculateMonthlyTotals(entries: VisitEntry[]): MonthlyTotal[] {
  const monthlyMap = new Map<string, MonthlyTotal>();

  entries.forEach((entry) => {
    const date = new Date(Number(entry.visitDate));
    const year = date.getFullYear();
    const month = date.getMonth();
    const period = `${year}-${String(month + 1).padStart(2, '0')}`;

    if (!monthlyMap.has(period)) {
      monthlyMap.set(period, {
        period,
        month,
        year,
        hospitalRs: 0,
        medicineRs: 0,
        total: 0,
        label: format(date, 'MMM yyyy'),
      });
    }

    const monthData = monthlyMap.get(period)!;
    monthData.hospitalRs += Number(entry.hospitalRs);
    monthData.medicineRs += Number(entry.medicineRs);
    monthData.total += Number(entry.hospitalRs) + Number(entry.medicineRs);
  });

  return Array.from(monthlyMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

export function calculateYearlyTotals(entries: VisitEntry[]): YearlyTotal[] {
  const yearlyMap = new Map<number, YearlyTotal>();

  entries.forEach((entry) => {
    const date = new Date(Number(entry.visitDate));
    const year = date.getFullYear();

    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, {
        year,
        hospitalRs: 0,
        medicineRs: 0,
        total: 0,
        label: year.toString(),
      });
    }

    const yearData = yearlyMap.get(year)!;
    yearData.hospitalRs += Number(entry.hospitalRs);
    yearData.medicineRs += Number(entry.medicineRs);
    yearData.total += Number(entry.hospitalRs) + Number(entry.medicineRs);
  });

  return Array.from(yearlyMap.values()).sort((a, b) => a.year - b.year);
}
