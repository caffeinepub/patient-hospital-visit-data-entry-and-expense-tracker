import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetUserVisitEntries, useDeleteVisitEntry } from '../../hooks/useQueries';
import { Calendar, Edit2, Trash2, MapPin, User, Stethoscope, Building2, Pill, Loader2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { format } from 'date-fns';
import type { VisitEntry } from '../../backend';
import { exportToExcel } from '../../utils/visitEntryExport';
import { exportToPDF } from '../../utils/visitEntryPdf';
import ImportVisitEntriesDialog from './ImportVisitEntriesDialog';

interface MyEntriesListProps {
  onEditEntry: (entry: VisitEntry) => void;
}

export default function MyEntriesList({ onEditEntry }: MyEntriesListProps) {
  const { data: entries, isLoading, error } = useGetUserVisitEntries();
  const deleteMutation = useDeleteVisitEntry();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<VisitEntry | null>(null);
  const [confirmHospitalName, setConfirmHospitalName] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const sortedEntries = entries ? [...entries].sort((a, b) => {
    const dateCompare = Number(b.visitDate) - Number(a.visitDate);
    if (dateCompare !== 0) return dateCompare;
    return Number(b.createdAt) - Number(a.createdAt);
  }) : [];

  const handleDeleteClick = (entry: VisitEntry) => {
    setEntryToDelete(entry);
    setConfirmHospitalName('');
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    
    try {
      await deleteMutation.mutateAsync({
        id: entryToDelete.id,
        originalHospitalName: confirmHospitalName,
      });
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      setConfirmHospitalName('');
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
    setConfirmHospitalName('');
  };

  const handleExportCSV = () => {
    if (sortedEntries.length > 0) {
      exportToExcel(sortedEntries);
    }
  };

  const handleExportPDF = () => {
    if (sortedEntries.length > 0) {
      exportToPDF(sortedEntries);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading your entries...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-sm text-destructive">Failed to load entries. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sortedEntries.length) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">No entries yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start by creating your first hospital visit entry or import existing data
                </p>
              </div>
              <div className="pt-4">
                <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Import from CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <ImportVisitEntriesDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">My Entries</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'} recorded
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setImportDialogOpen(true)} variant="outline" size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {sortedEntries.map((entry) => {
          const totalCharges = Number(entry.hospitalRs) + Number(entry.medicineRs);
          
          return (
            <Card key={entry.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="truncate">{entry.hospitalName}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      {format(new Date(Number(entry.visitDate)), 'PPP')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEditEntry(entry)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(entry)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Stethoscope className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Doctor</p>
                      <p className="text-sm font-medium text-foreground truncate">{entry.doctorName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground mb-0.5">Patient</p>
                      <p className="text-sm font-medium text-foreground truncate">{entry.patientName}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Hospital Charges (Rs)</p>
                    <p className="text-lg font-semibold text-foreground">
                      {Number(entry.hospitalRs).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Medicine Charges (Rs)</p>
                    <p className="text-lg font-semibold text-foreground">
                      {Number(entry.medicineRs).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-sm font-medium text-muted-foreground">Total Charges</span>
                  <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
                    Rs {totalCharges.toLocaleString()}
                  </Badge>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Pill className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Medicine</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{entry.medicineName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{entry.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. To confirm deletion, please type the hospital name below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="confirm-hospital">
              Hospital Name: <span className="font-semibold">{entryToDelete?.hospitalName}</span>
            </Label>
            <Input
              id="confirm-hospital"
              placeholder="Type hospital name to confirm"
              value={confirmHospitalName}
              onChange={(e) => setConfirmHospitalName(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={
                deleteMutation.isPending ||
                confirmHospitalName !== entryToDelete?.hospitalName
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Entry'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportVisitEntriesDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </>
  );
}
