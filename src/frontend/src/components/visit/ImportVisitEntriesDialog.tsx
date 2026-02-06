import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateVisitEntry } from '../../hooks/useQueries';
import { parseCSVFile, type ImportResult } from '../../utils/visitEntryImport';
import { formatErrorMessage } from '../../utils/errorMessages';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportVisitEntriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportVisitEntriesDialog({ open, onOpenChange }: ImportVisitEntriesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const createEntry = useCreateVisitEntry();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file (.csv)');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    
    try {
      const result = await parseCSVFile(selectedFile);
      setImportResult(result);
    } catch (error) {
      toast.error('Failed to parse file');
      setImportResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!importResult || importResult.entries.length === 0) return;

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;
    const failedEntries: string[] = [];

    for (const entry of importResult.entries) {
      try {
        // Ensure values are integers before BigInt conversion
        const hospitalRs = Math.floor(Number(entry.hospitalRs));
        const medicineRs = Math.floor(Number(entry.medicineRs));

        if (!Number.isInteger(hospitalRs) || hospitalRs < 0) {
          throw new Error('Invalid hospital charges');
        }
        if (!Number.isInteger(medicineRs) || medicineRs < 0) {
          throw new Error('Invalid medicine charges');
        }

        await createEntry.mutateAsync({
          hospitalName: entry.hospitalName,
          visitDate: BigInt(new Date(entry.visitDate).getTime()),
          doctorName: entry.doctorName,
          patientName: entry.patientName,
          hospitalRs: BigInt(hospitalRs),
          medicineRs: BigInt(medicineRs),
          medicineName: entry.medicineName,
          address: entry.address,
        });
        successCount++;
      } catch (error) {
        failCount++;
        const errorMsg = formatErrorMessage(error);
        failedEntries.push(`${entry.hospitalName}: ${errorMsg}`);
        console.error('Failed to import entry:', error);
      }
    }

    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} ${successCount === 1 ? 'entry' : 'entries'}`);
    }
    if (failCount > 0) {
      const errorDetails = failedEntries.length > 0 ? ` (${failedEntries.slice(0, 3).join(', ')}${failedEntries.length > 3 ? '...' : ''})` : '';
      toast.error(`Failed to import ${failCount} ${failCount === 1 ? 'entry' : 'entries'}${errorDetails}`);
    }

    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Visit Entries</DialogTitle>
          <DialogDescription>
            Upload a CSV file with your hospital visit records
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">Processing file...</p>
                  </>
                ) : file ? (
                  <>
                    <FileSpreadsheet className="w-10 h-10 mb-3 text-primary" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">CSV files (.csv)</p>
                  </>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
            </label>
          </div>

          {importResult && (
            <div className="space-y-3">
              {importResult.entries.length > 0 && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Found {importResult.entries.length} valid {importResult.entries.length === 1 ? 'entry' : 'entries'} ready to import
                  </AlertDescription>
                </Alert>
              )}

              {importResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">
                      {importResult.errors.length} {importResult.errors.length === 1 ? 'error' : 'errors'} found:
                    </div>
                    <ScrollArea className="h-32 w-full rounded border border-destructive/20 bg-background p-2">
                      <div className="space-y-1 text-xs">
                        {importResult.errors.map((error, index) => (
                          <div key={index}>
                            Row {error.row}, {error.field}: {error.message}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <p className="font-semibold">Expected columns:</p>
            <p>Visit Date, Hospital Name, Doctor Name, Patient Name, Hospital Charges (Rs), Medicine Charges (Rs), Medicine Name, Address</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importResult || importResult.entries.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              `Import ${importResult?.entries.length || 0} ${importResult?.entries.length === 1 ? 'Entry' : 'Entries'}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
