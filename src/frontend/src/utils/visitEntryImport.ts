import { parse, isValid } from 'date-fns';

export interface ImportedEntry {
  visitDate: string;
  hospitalName: string;
  doctorName: string;
  patientName: string;
  hospitalRs: number;
  medicineRs: number;
  medicineName: string;
  address: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  entries: ImportedEntry[];
  errors: ImportError[];
}

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'yyyy/MM/dd',
  'M/d/yyyy',
  'd/M/yyyy',
];

function parseDate(dateValue: string): Date | null {
  if (!dateValue) return null;
  
  const dateStr = String(dateValue).trim();
  for (const format of DATE_FORMATS) {
    const parsed = parse(dateStr, format, new Date());
    if (isValid(parsed)) {
      return parsed;
    }
  }
  
  return null;
}

function validateNumber(value: string, fieldName: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = Number(value.trim());
  if (isNaN(num) || num < 0) return null;
  return Math.floor(num);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function parseCSVFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
          resolve({
            entries: [],
            errors: [{
              row: 0,
              field: 'File',
              message: 'File is empty or has no data rows',
            }],
          });
          return;
        }
        
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine).map(h => h.trim());
        
        const entries: ImportedEntry[] = [];
        const errors: ImportError[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          const rowNum = i + 1;
          const rowErrors: ImportError[] = [];
          
          // Map values to fields
          const getField = (possibleNames: string[]): string => {
            for (const name of possibleNames) {
              const index = headers.findIndex(h => 
                h.toLowerCase().includes(name.toLowerCase())
              );
              if (index !== -1 && values[index]) {
                return values[index].trim();
              }
            }
            return '';
          };
          
          // Parse and validate visit date
          const visitDateStr = getField(['Visit Date', 'Date', 'visitDate']);
          const visitDate = parseDate(visitDateStr);
          if (!visitDate) {
            rowErrors.push({
              row: rowNum,
              field: 'Visit Date',
              message: 'Invalid or missing date',
            });
          }
          
          // Validate hospital name
          const hospitalName = getField(['Hospital Name', 'Hospital', 'hospitalName']);
          if (!hospitalName) {
            rowErrors.push({
              row: rowNum,
              field: 'Hospital Name',
              message: 'Hospital name is required',
            });
          }
          
          // Validate doctor name
          const doctorName = getField(['Doctor Name', 'Doctor', 'doctorName']);
          if (!doctorName) {
            rowErrors.push({
              row: rowNum,
              field: 'Doctor Name',
              message: 'Doctor name is required',
            });
          }
          
          // Validate patient name
          const patientName = getField(['Patient Name', 'Patient', 'patientName']);
          if (!patientName) {
            rowErrors.push({
              row: rowNum,
              field: 'Patient Name',
              message: 'Patient name is required',
            });
          }
          
          // Validate hospital charges
          const hospitalRsStr = getField(['Hospital Charges', 'hospitalRs', 'Hospital Rs']);
          const hospitalRs = validateNumber(hospitalRsStr, 'Hospital Charges');
          if (hospitalRs === null) {
            rowErrors.push({
              row: rowNum,
              field: 'Hospital Charges',
              message: 'Invalid or missing hospital charges',
            });
          }
          
          // Validate medicine charges
          const medicineRsStr = getField(['Medicine Charges', 'medicineRs', 'Medicine Rs']);
          const medicineRs = validateNumber(medicineRsStr, 'Medicine Charges');
          if (medicineRs === null) {
            rowErrors.push({
              row: rowNum,
              field: 'Medicine Charges',
              message: 'Invalid or missing medicine charges',
            });
          }
          
          // Validate medicine name
          const medicineName = getField(['Medicine Name', 'Medicine', 'medicineName']);
          if (!medicineName) {
            rowErrors.push({
              row: rowNum,
              field: 'Medicine Name',
              message: 'Medicine name is required',
            });
          }
          
          // Validate address
          const address = getField(['Address', 'address']);
          if (!address) {
            rowErrors.push({
              row: rowNum,
              field: 'Address',
              message: 'Address is required',
            });
          }
          
          if (rowErrors.length > 0) {
            errors.push(...rowErrors);
          } else if (visitDate && hospitalRs !== null && medicineRs !== null) {
            entries.push({
              visitDate: visitDate.toISOString(),
              hospitalName,
              doctorName,
              patientName,
              hospitalRs,
              medicineRs,
              medicineName,
              address,
            });
          }
        }
        
        resolve({ entries, errors });
      } catch (error) {
        resolve({
          entries: [],
          errors: [{
            row: 0,
            field: 'File',
            message: 'Failed to parse CSV file. Please ensure it is a valid CSV file.',
          }],
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        entries: [],
        errors: [{
          row: 0,
          field: 'File',
          message: 'Failed to read file',
        }],
      });
    };
    
    reader.readAsText(file);
  });
}
