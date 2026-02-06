import { format } from 'date-fns';
import type { VisitEntry } from '../backend';

export function exportToExcel(entries: VisitEntry[]) {
  // Create CSV content
  const headers = [
    'Visit Date',
    'Hospital Name',
    'Doctor Name',
    'Patient Name',
    'Hospital Charges (Rs)',
    'Medicine Charges (Rs)',
    'Total Charges (Rs)',
    'Medicine Name',
    'Address'
  ];

  const rows = entries.map((entry) => [
    format(new Date(Number(entry.visitDate)), 'yyyy-MM-dd'),
    entry.hospitalName,
    entry.doctorName,
    entry.patientName,
    Number(entry.hospitalRs).toString(),
    Number(entry.medicineRs).toString(),
    (Number(entry.hospitalRs) + Number(entry.medicineRs)).toString(),
    entry.medicineName.replace(/\n/g, ' '),
    entry.address.replace(/\n/g, ' ')
  ]);

  // Escape CSV fields
  const escapeCsvField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `hospital-visits-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
