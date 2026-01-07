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
} from '@/components/ui';
import { LuSave } from 'react-icons/lu';
import type { PractitionerFormData } from '@/lib/types/fhir';

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

const specialtyOptions = [
  { value: 'General Practitioner', label: 'General Practitioner' },
  { value: 'Internal Medicine', label: 'Internal Medicine' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'OB-GYN', label: 'Obstetrics & Gynecology' },
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'Ophthalmology', label: 'Ophthalmology' },
  { value: 'ENT', label: 'ENT (Otolaryngology)' },
  { value: 'Radiology', label: 'Radiology' },
  { value: 'Pathology', label: 'Pathology' },
  { value: 'Anesthesiology', label: 'Anesthesiology' },
  { value: 'Emergency Medicine', label: 'Emergency Medicine' },
  { value: 'Family Medicine', label: 'Family Medicine' },
  { value: 'Nurse', label: 'Nurse' },
  { value: 'Midwife', label: 'Midwife' },
  { value: 'Other', label: 'Other' },
];

const DEFAULT_FORM_DATA: PractitionerFormData = {
  familyName: '',
  givenName: '',
  middleName: '',
  suffix: '',
  birthDate: '',
  gender: undefined,
  phone: '',
  email: '',
  licenseNumber: '',
  specialty: '',
  addressLine: '',
  barangay: '',
  cityMunicipality: '',
  province: '',
  postalCode: '',
};

interface PractitionerFormProps {
  defaultValues?: Partial<PractitionerFormData>;
  onSubmit: (data: PractitionerFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PractitionerForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Practitioner',
}: PractitionerFormProps) {
  const [formData, setFormData] = useState<PractitionerFormData>({
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (!formData.familyName || !formData.givenName) {
        throw new Error('Please fill in the required name fields');
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
            <CardDescription>Practitioner identification and demographics</CardDescription>
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
                placeholder="MD, RN, Jr."
              />
              <Input
                label="Date of Birth"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
              />
              <Select
                label="Gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                options={genderOptions}
                placeholder="Select gender"
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>License and specialty details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="PRC License Number"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                hint="Professional Regulation Commission license"
              />
              <Select
                label="Specialty"
                name="specialty"
                value={formData.specialty || ''}
                onChange={handleChange}
                options={specialtyOptions}
                placeholder="Select specialty"
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

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
            <CardDescription>Work or clinic address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 lg:col-span-3">
                <Input
                  label="Street Address / Building"
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
              />
              <Input
                label="City / Municipality"
                name="cityMunicipality"
                value={formData.cityMunicipality}
                onChange={handleChange}
              />
              <Input
                label="Province"
                name="province"
                value={formData.province}
                onChange={handleChange}
              />
              <Input
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
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

export default PractitionerForm;