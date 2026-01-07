'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Input,
  Select,
  Checkbox,
} from '@/components/ui';
import { LuSave } from 'react-icons/lu';
import type { PatientFormData } from '@/lib/types/fhir';

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

const maritalStatusOptions = [
  { value: 'S', label: 'Single' },
  { value: 'M', label: 'Married' },
  { value: 'D', label: 'Divorced' },
  { value: 'W', label: 'Widowed' },
  { value: 'L', label: 'Legally Separated' },
  { value: 'UNK', label: 'Unknown' },
];

const educationOptions = [
  { value: 'no-education', label: 'No Formal Education' },
  { value: 'elementary', label: 'Elementary' },
  { value: 'high-school', label: 'High School' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'college', label: 'College' },
  { value: 'post-graduate', label: 'Post Graduate' },
];

const DEFAULT_FORM_DATA: PatientFormData = {
  familyName: '',
  givenName: '',
  middleName: '',
  suffix: '',
  birthDate: '',
  gender: 'unknown',
  maritalStatus: '',
  phone: '',
  email: '',
  addressLine: '',
  barangay: '',
  cityMunicipality: '',
  province: '',
  postalCode: '',
  country: 'Philippines',
  philHealthId: '',
  pddRegistration: '',
  nationality: 'Filipino',
  religion: '',
  indigenousPeople: false,
  indigenousGroup: '',
  occupation: '',
  educationalAttainment: '',
};

interface PatientFormProps {
  defaultValues?: Partial<PatientFormData>;
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PatientForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Patient',
}: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    ...DEFAULT_FORM_DATA,
    ...defaultValues,
  });
  const [error, setError] = useState<string | null>(null);

  // Update form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      setFormData((prev) => ({ ...prev, ...defaultValues }));
    }
  }, [defaultValues]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.familyName || !formData.givenName || !formData.birthDate) {
        throw new Error('Please fill in all required fields');
      }
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Patient identification and demographics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Family Name (Surname)"
                name="familyName"
                value={formData.familyName}
                onChange={handleChange}
                required
              />
              <Input
                label="Given Name (First Name)"
                name="givenName"
                value={formData.givenName}
                onChange={handleChange}
                required
              />
              <Input
                label="Middle Name"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
              />
              <Input
                label="Suffix"
                name="suffix"
                value={formData.suffix}
                onChange={handleChange}
                placeholder="Jr., Sr., III"
              />
              <Input
                label="Date of Birth"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
              <Select
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                options={genderOptions}
                required
              />
              <Select
                label="Marital Status"
                name="maritalStatus"
                value={formData.maritalStatus || ''}
                onChange={handleChange}
                options={maritalStatusOptions}
                placeholder="Select status"
              />
              <Input
                label="Nationality"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Phone and email details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+63 9XX XXX XXXX"
              />
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address (PHCore) */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>PHCore-compliant Philippine address format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <Input
                  label="Street Address / House No. / Building"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                />
              </div>
              <Input
                label="Barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                hint="PHCore extension field"
              />
              <Input
                label="City / Municipality"
                name="cityMunicipality"
                value={formData.cityMunicipality}
                onChange={handleChange}
                hint="PHCore extension field"
              />
              <Input
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                hint="PHCore extension field"
              />
              <Input
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* PHCore Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle>Healthcare Identifiers</CardTitle>
            <CardDescription>Philippine healthcare system identifiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="PhilHealth ID"
                name="philHealthId"
                value={formData.philHealthId}
                onChange={handleChange}
                hint="Philippine Health Insurance Corporation ID"
              />
              <Input
                label="PDD Registration Number"
                name="pddRegistration"
                value={formData.pddRegistration}
                onChange={handleChange}
                hint="PhilHealth Dialysis Database Registration"
              />
            </div>
          </CardContent>
        </Card>

        {/* PHCore Extensions */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>PHCore-specific extension fields</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Religion"
                name="religion"
                value={formData.religion}
                onChange={handleChange}
              />
              <Input
                label="Occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
              />
              <Select
                label="Educational Attainment"
                name="educationalAttainment"
                value={formData.educationalAttainment || ''}
                onChange={handleChange}
                options={educationOptions}
                placeholder="Select education level"
              />
              <div className="md:col-span-2 lg:col-span-3 pt-2">
                <Checkbox
                  name="indigenousPeople"
                  checked={formData.indigenousPeople}
                  onChange={handleChange}
                  label="Belongs to an Indigenous People (IP) group"
                />
              </div>
              {formData.indigenousPeople && (
                <div className="md:col-span-2 lg:col-span-3">
                  <Input
                    label="Indigenous Group"
                    name="indigenousGroup"
                    value={formData.indigenousGroup}
                    onChange={handleChange}
                    placeholder="e.g., Igorot, Lumad, Mangyan"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <Card>
          <CardFooter className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
              <LuSave className="w-4 h-4" />
              {submitLabel}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}

export default PatientForm;