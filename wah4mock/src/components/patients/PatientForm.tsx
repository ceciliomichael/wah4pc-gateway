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
  region: '',
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

interface Option {
  value: string;
  label: string;
}

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

  // Terminology State
  const [regions, setRegions] = useState<Option[]>([]);
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [barangays, setBarangays] = useState<Option[]>([]);
  // Tracks when the selected "province" is actually a city (e.g. NCR cities)
  const [provinceIsCity, setProvinceIsCity] = useState(false);
  
  const [religions, setReligions] = useState<Option[]>([]);
  const [educationalAttainments, setEducationalAttainments] = useState<Option[]>([]);
  const [indigenousGroups, setIndigenousGroups] = useState<Option[]>([]);
  const [occupations, setOccupations] = useState<Option[]>([]);

  // Update form when defaultValues change (for edit mode)
  useEffect(() => {
    if (defaultValues) {
      setFormData((prev) => ({ ...prev, ...defaultValues }));
    }
  }, [defaultValues]);

  // Load Initial Terminologies
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Regions
        const regRes = await fetch('/api/terminologies/psgc?level=region');
        if (regRes.ok) {
          const data = await regRes.json();
          setRegions(data.map((i: any) => ({ value: i.code, label: i.name })));
        }

        // Religions
        const relRes = await fetch('/api/terminologies/religion');
        if (relRes.ok) {
          const data = await relRes.json();
          setReligions(data.map((i: any) => ({ value: i.code, label: i.display })));
        }

        // Education
        const eduRes = await fetch('/api/terminologies/educational-attainment');
        if (eduRes.ok) {
          const data = await eduRes.json();
          setEducationalAttainments(data.map((i: any) => ({ value: i.code, label: i.display })));
        }

        // Indigenous Groups
        const ipRes = await fetch('/api/terminologies/indigenous-groups');
        if (ipRes.ok) {
          const data = await ipRes.json();
          setIndigenousGroups(data.map((i: any) => ({ value: i.code, label: i.display })));
        }
        
        // Occupations (Major Groups)
        const occRes = await fetch('/api/terminologies/psoc');
        if (occRes.ok) {
           const data = await occRes.json();
           setOccupations(data.map((i: any) => ({ value: i.code, label: i.display })));
        }

      } catch (e) {
        console.error('Failed to load initial terminologies', e);
      }
    };
    fetchInitialData();
  }, []);

  // Cascade: Region -> Province (or City for NCR-style regions)
  useEffect(() => {
    if (!formData.region) {
      setProvinces([]);
      setProvinceIsCity(false);
      return;
    }
    fetch(`/api/terminologies/psgc?level=province&parent=${formData.region}`)
      .then(res => res.json())
      .then((data: Array<{ code: string; name: string; level?: string }>) => {
        // Detect if the API returned cities instead of provinces (e.g. NCR)
        const hasOnlyCities = data.length > 0 && data.every(i => i.level === 'city');
        setProvinceIsCity(hasOnlyCities);
        setProvinces(data.map(i => ({ value: i.code, label: i.name })));
      })
      .catch(console.error);
  }, [formData.region]);

  // Cascade: Province -> City/Municipality
  // When provinceIsCity (NCR-style), the selected "province" IS the city,
  // so auto-set cityMunicipality and load barangays directly.
  useEffect(() => {
    if (!formData.province) {
      setCities([]);
      return;
    }

    if (provinceIsCity) {
      // The "province" is actually a city — auto-fill city with same value
      const selectedLabel = provinces.find(p => p.value === formData.province)?.label || '';
      setCities([{ value: formData.province, label: selectedLabel }]);
      setFormData(prev => ({ 
        ...prev, 
        cityMunicipality: formData.province,
        cityMunicipalityName: selectedLabel 
      }));
      return;
    }

    fetch(`/api/terminologies/psgc?parent=${formData.province}`)
      .then(res => res.json())
      .then((data: Array<{ code: string; name: string }>) =>
        setCities(data.map(i => ({ value: i.code, label: i.name })))
      )
      .catch(console.error);
  }, [formData.province, provinceIsCity]);

  // Cascade: City -> Barangay
  useEffect(() => {
    if (!formData.cityMunicipality) {
      setBarangays([]);
      return;
    }
    fetch(`/api/terminologies/psgc?parent=${formData.cityMunicipality}`)
      .then(res => res.json())
      .then((data: Array<{ code: string; name: string }>) =>
        setBarangays(data.map(i => ({ value: i.code, label: i.name })))
      )
      .catch(console.error);
  }, [formData.cityMunicipality]);



  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      const updates: any = { [name]: type === 'checkbox' ? checked : value };
      
      // Look up display names for address fields
      if (name === 'province') {
        updates.provinceName = provinces.find(o => o.value === value)?.label;
      } else if (name === 'cityMunicipality') {
        updates.cityMunicipalityName = cities.find(o => o.value === value)?.label;
      } else if (name === 'barangay') {
        updates.barangayName = barangays.find(o => o.value === value)?.label;
      }
      
      // Clear dependent fields when parent changes
      if (name === 'region') {
        updates.province = '';
        updates.provinceName = '';
        updates.cityMunicipality = '';
        updates.cityMunicipalityName = '';
        updates.barangay = '';
        updates.barangayName = '';
      } else if (name === 'province') {
        updates.cityMunicipality = '';
        updates.cityMunicipalityName = '';
        updates.barangay = '';
        updates.barangayName = '';
      } else if (name === 'cityMunicipality') {
        updates.barangay = '';
        updates.barangayName = '';
      }
      
      return { ...prev, ...updates };
    });
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
            <CardDescription>PHCore-compliant Philippine address format (PSGC)</CardDescription>
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
              
              <Select
                label="Region"
                name="region"
                value={formData.region || ''}
                onChange={handleChange}
                options={regions}
                placeholder="Select Region"
              />

              <Select
                label="Province"
                name="province"
                value={formData.province || ''}
                onChange={handleChange}
                options={provinces}
                placeholder="Select Province"
                disabled={!formData.region}
              />

              <Select
                label="City / Municipality"
                name="cityMunicipality"
                value={formData.cityMunicipality || ''}
                onChange={handleChange}
                options={cities}
                placeholder="Select City/Municipality"
                disabled={!formData.province || provinceIsCity}
              />

              <Select
                label="Barangay"
                name="barangay"
                value={formData.barangay || ''}
                onChange={handleChange}
                options={barangays}
                placeholder="Select Barangay"
                disabled={!formData.cityMunicipality}
              />

              <Input
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                placeholder="Enter Postal Code"
              />
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled
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
              <Select
                label="Religion"
                name="religion"
                value={formData.religion || ''}
                onChange={handleChange}
                options={religions}
                placeholder="Select Religion"
              />
              
              <Select
                label="Occupation"
                name="occupation"
                value={formData.occupation || ''}
                onChange={handleChange}
                options={occupations}
                placeholder="Select Major Occupation Group"
              />
              
              <Select
                label="Educational Attainment"
                name="educationalAttainment"
                value={formData.educationalAttainment || ''}
                onChange={handleChange}
                options={educationalAttainments}
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
                   <Select
                    label="Indigenous Group"
                    name="indigenousGroup"
                    value={formData.indigenousGroup || ''}
                    onChange={handleChange}
                    options={indigenousGroups}
                    placeholder="Select Indigenous Group"
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