import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateVisitEntry, useEditVisitEntry } from '../../hooks/useQueries';
import { CalendarIcon, CheckCircle2, X } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import type { VisitEntry } from '../../backend';

interface VisitEntryFormProps {
  editingEntry?: VisitEntry | null;
  onCancelEdit?: () => void;
  onSaveComplete?: () => void;
}

interface FormData {
  hospitalName: string;
  visitDate: Date | undefined;
  doctorName: string;
  patientName: string;
  hospitalRs: string;
  medicineRs: string;
  medicineName: string;
  address: string;
}

interface FormErrors {
  hospitalName?: string;
  visitDate?: string;
  doctorName?: string;
  patientName?: string;
  hospitalRs?: string;
  medicineRs?: string;
  medicineName?: string;
  address?: string;
}

export default function VisitEntryForm({ editingEntry, onCancelEdit, onSaveComplete }: VisitEntryFormProps) {
  const createMutation = useCreateVisitEntry();
  const editMutation = useEditVisitEntry();
  const [showSuccess, setShowSuccess] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dateInputValue, setDateInputValue] = useState('');

  const [formData, setFormData] = useState<FormData>({
    hospitalName: '',
    visitDate: undefined,
    doctorName: '',
    patientName: '',
    hospitalRs: '',
    medicineRs: '',
    medicineName: '',
    address: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editingEntry) {
      const visitDate = new Date(Number(editingEntry.visitDate));
      setFormData({
        hospitalName: editingEntry.hospitalName,
        visitDate: visitDate,
        doctorName: editingEntry.doctorName,
        patientName: editingEntry.patientName,
        hospitalRs: editingEntry.hospitalRs.toString(),
        medicineRs: editingEntry.medicineRs.toString(),
        medicineName: editingEntry.medicineName,
        address: editingEntry.address,
      });
      setDateInputValue(format(visitDate, 'MM/dd/yyyy'));
      setShowSuccess(false);
    }
  }, [editingEntry]);

  const validateField = (name: keyof FormData, value: any): string | undefined => {
    switch (name) {
      case 'hospitalName':
        return !value?.trim() ? 'Hospital name is required' : undefined;
      case 'visitDate':
        return !value ? 'Visit date is required' : undefined;
      case 'doctorName':
        return !value?.trim() ? 'Doctor name is required' : undefined;
      case 'patientName':
        return !value?.trim() ? 'Patient name is required' : undefined;
      case 'hospitalRs':
        if (!value?.trim()) return 'Hospital charges are required';
        if (isNaN(Number(value)) || Number(value) < 0) return 'Must be a valid number (0 or greater)';
        return undefined;
      case 'medicineRs':
        if (!value?.trim()) return 'Medicine charges are required';
        if (isNaN(Number(value)) || Number(value) < 0) return 'Must be a valid number (0 or greater)';
        return undefined;
      case 'medicineName':
        return !value?.trim() ? 'Medicine name is required' : undefined;
      case 'address':
        return !value?.trim() ? 'Address is required' : undefined;
      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleDateInputChange = (value: string) => {
    setDateInputValue(value);
    
    // Try to parse the date in various formats
    const formats = ['MM/dd/yyyy', 'M/d/yyyy', 'yyyy-MM-dd', 'MM-dd-yyyy'];
    let parsedDate: Date | undefined = undefined;
    
    for (const formatStr of formats) {
      try {
        const parsed = parse(value, formatStr, new Date());
        if (isValid(parsed)) {
          parsedDate = parsed;
          break;
        }
      } catch (e) {
        // Continue to next format
      }
    }
    
    if (parsedDate) {
      handleChange('visitDate', parsedDate);
    } else if (value.trim() === '') {
      handleChange('visitDate', undefined);
    }
  };

  const handleDateInputBlur = () => {
    setTouched({ ...touched, visitDate: true });
    
    if (!formData.visitDate && dateInputValue.trim() !== '') {
      setErrors({ ...errors, visitDate: 'Please enter a valid date (MM/DD/YYYY)' });
    } else {
      const error = validateField('visitDate', formData.visitDate);
      setErrors({ ...errors, visitDate: error });
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    handleChange('visitDate', date);
    if (date) {
      setDateInputValue(format(date, 'MM/dd/yyyy'));
    }
    setCalendarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      hospitalName: true,
      visitDate: true,
      doctorName: true,
      patientName: true,
      hospitalRs: true,
      medicineRs: true,
      medicineName: true,
      address: true,
    });

    if (!validateForm()) {
      return;
    }

    try {
      const visitDateTimestamp = BigInt(formData.visitDate!.getTime());
      const hospitalRs = BigInt(formData.hospitalRs);
      const medicineRs = BigInt(formData.medicineRs);

      if (editingEntry) {
        await editMutation.mutateAsync({
          id: editingEntry.id,
          hospitalName: formData.hospitalName.trim(),
          visitDate: visitDateTimestamp,
          doctorName: formData.doctorName.trim(),
          patientName: formData.patientName.trim(),
          hospitalRs,
          medicineRs,
          medicineName: formData.medicineName.trim(),
          address: formData.address.trim(),
        });
      } else {
        await createMutation.mutateAsync({
          hospitalName: formData.hospitalName.trim(),
          visitDate: visitDateTimestamp,
          doctorName: formData.doctorName.trim(),
          patientName: formData.patientName.trim(),
          hospitalRs,
          medicineRs,
          medicineName: formData.medicineName.trim(),
          address: formData.address.trim(),
        });
      }

      setFormData({
        hospitalName: '',
        visitDate: undefined,
        doctorName: '',
        patientName: '',
        hospitalRs: '',
        medicineRs: '',
        medicineName: '',
        address: '',
      });
      setDateInputValue('');
      setTouched({});
      setErrors({});
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSaveComplete) {
          onSaveComplete();
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      hospitalName: '',
      visitDate: undefined,
      doctorName: '',
      patientName: '',
      hospitalRs: '',
      medicineRs: '',
      medicineName: '',
      address: '',
    });
    setDateInputValue('');
    setTouched({});
    setErrors({});
    setShowSuccess(false);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const isPending = createMutation.isPending || editMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      {showSuccess && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm font-medium text-foreground">
            {editingEntry ? 'Entry updated successfully!' : 'Entry saved successfully!'}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{editingEntry ? 'Edit Visit Entry' : 'New Visit Entry'}</CardTitle>
          <CardDescription>
            {editingEntry 
              ? 'Update the details of your hospital visit and expenses'
              : 'Record your hospital visit details and medical expenses'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hospitalName">
                  Hospital Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="hospitalName"
                  placeholder="Enter hospital name"
                  value={formData.hospitalName}
                  onChange={(e) => handleChange('hospitalName', e.target.value)}
                  onBlur={() => handleBlur('hospitalName')}
                  className={errors.hospitalName && touched.hospitalName ? 'border-destructive' : ''}
                />
                {errors.hospitalName && touched.hospitalName && (
                  <p className="text-sm text-destructive">{errors.hospitalName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitDate">
                  Visit Date <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="visitDate"
                    placeholder="MM/DD/YYYY"
                    value={dateInputValue}
                    onChange={(e) => handleDateInputChange(e.target.value)}
                    onBlur={handleDateInputBlur}
                    className={`flex-1 ${errors.visitDate && touched.visitDate ? 'border-destructive' : ''}`}
                  />
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={errors.visitDate && touched.visitDate ? 'border-destructive' : ''}
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={formData.visitDate}
                        onSelect={handleCalendarSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {errors.visitDate && touched.visitDate && (
                  <p className="text-sm text-destructive">{errors.visitDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorName">
                  Doctor Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doctorName"
                  placeholder="Enter doctor's name"
                  value={formData.doctorName}
                  onChange={(e) => handleChange('doctorName', e.target.value)}
                  onBlur={() => handleBlur('doctorName')}
                  className={errors.doctorName && touched.doctorName ? 'border-destructive' : ''}
                />
                {errors.doctorName && touched.doctorName && (
                  <p className="text-sm text-destructive">{errors.doctorName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientName">
                  Patient Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient's name"
                  value={formData.patientName}
                  onChange={(e) => handleChange('patientName', e.target.value)}
                  onBlur={() => handleBlur('patientName')}
                  className={errors.patientName && touched.patientName ? 'border-destructive' : ''}
                />
                {errors.patientName && touched.patientName && (
                  <p className="text-sm text-destructive">{errors.patientName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalRs">
                  Hospital Charges (Rs) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="hospitalRs"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.hospitalRs}
                  onChange={(e) => handleChange('hospitalRs', e.target.value)}
                  onBlur={() => handleBlur('hospitalRs')}
                  className={errors.hospitalRs && touched.hospitalRs ? 'border-destructive' : ''}
                />
                {errors.hospitalRs && touched.hospitalRs && (
                  <p className="text-sm text-destructive">{errors.hospitalRs}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicineRs">
                  Medicine Charges (Rs) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="medicineRs"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formData.medicineRs}
                  onChange={(e) => handleChange('medicineRs', e.target.value)}
                  onBlur={() => handleBlur('medicineRs')}
                  className={errors.medicineRs && touched.medicineRs ? 'border-destructive' : ''}
                />
                {errors.medicineRs && touched.medicineRs && (
                  <p className="text-sm text-destructive">{errors.medicineRs}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicineName">
                Medicine Name <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="medicineName"
                placeholder="Enter medicine name(s) - you can add multiple lines"
                rows={4}
                value={formData.medicineName}
                onChange={(e) => handleChange('medicineName', e.target.value)}
                onBlur={() => handleBlur('medicineName')}
                className={errors.medicineName && touched.medicineName ? 'border-destructive' : ''}
              />
              {errors.medicineName && touched.medicineName && (
                <p className="text-sm text-destructive">{errors.medicineName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="address"
                placeholder="Enter full address"
                rows={3}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                className={errors.address && touched.address ? 'border-destructive' : ''}
              />
              {errors.address && touched.address && (
                <p className="text-sm text-destructive">{errors.address}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
              {editingEntry && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isPending}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
