import { format } from 'date-fns';
import type { VisitEntry } from '../backend';

export function exportToPDF(entries: VisitEntry[]) {
  // Create HTML content for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Hospital Visit Records</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #2c5f4f;
          margin-bottom: 5px;
        }
        .date {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #6b8e7a;
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .number {
          text-align: right;
        }
        @media print {
          body {
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>Hospital Visit Records</h1>
      <div class="date">Generated: ${format(new Date(), 'PPP')}</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Hospital</th>
            <th>Doctor</th>
            <th>Patient</th>
            <th class="number">Hospital Rs</th>
            <th class="number">Medicine Rs</th>
            <th class="number">Total Rs</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(entry => `
            <tr>
              <td>${format(new Date(Number(entry.visitDate)), 'yyyy-MM-dd')}</td>
              <td>${escapeHtml(entry.hospitalName)}</td>
              <td>${escapeHtml(entry.doctorName)}</td>
              <td>${escapeHtml(entry.patientName)}</td>
              <td class="number">${Number(entry.hospitalRs).toLocaleString()}</td>
              <td class="number">${Number(entry.medicineRs).toLocaleString()}</td>
              <td class="number">${(Number(entry.hospitalRs) + Number(entry.medicineRs)).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
