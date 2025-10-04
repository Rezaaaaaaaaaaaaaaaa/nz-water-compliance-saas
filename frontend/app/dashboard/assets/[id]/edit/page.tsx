'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function AssetEditPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'WATER_TREATMENT_PLANT',
    description: '',
    location: '',
    latitude: '',
    longitude: '',
    condition: 'GOOD',
    riskLevel: 'LOW',
    isCritical: false,
    installationDate: '',
    lastInspectionDate: '',
    nextInspectionDate: '',
    specifications: '',
  });

  useEffect(() => {
    loadAsset();
  }, [assetId]);

  async function loadAsset() {
    try {
      setLoading(true);
      const response = await apiClient.get(`/assets/${assetId}`);
      const asset = response.data.data;

      setFormData({
        name: asset.name || '',
        type: asset.type || 'WATER_TREATMENT_PLANT',
        description: asset.description || '',
        location: asset.location || '',
        latitude: asset.latitude?.toString() || '',
        longitude: asset.longitude?.toString() || '',
        condition: asset.condition || 'GOOD',
        riskLevel: asset.riskLevel || 'LOW',
        isCritical: asset.isCritical || false,
        installationDate: asset.installationDate ? asset.installationDate.split('T')[0] : '',
        lastInspectionDate: asset.lastInspectionDate ? asset.lastInspectionDate.split('T')[0] : '',
        nextInspectionDate: asset.nextInspectionDate ? asset.nextInspectionDate.split('T')[0] : '',
        specifications: asset.specifications || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Asset name is required');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        installationDate: formData.installationDate || null,
        lastInspectionDate: formData.lastInspectionDate || null,
        nextInspectionDate: formData.nextInspectionDate || null,
      };

      await apiClient.patch(`/assets/${assetId}`, payload);
      router.push(`/dashboard/assets/${assetId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading asset...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <Link href={`/dashboard/assets/${assetId}`} className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to asset details
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Asset</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Type *
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="WATER_TREATMENT_PLANT">Water Treatment Plant</option>
                  <option value="RESERVOIR">Reservoir</option>
                  <option value="PUMP_STATION">Pump Station</option>
                  <option value="PIPELINE">Pipeline</option>
                  <option value="VALVE">Valve</option>
                  <option value="METER">Meter</option>
                  <option value="CHLORINATION_UNIT">Chlorination Unit</option>
                  <option value="UV_DISINFECTION">UV Disinfection</option>
                  <option value="FILTRATION_SYSTEM">Filtration System</option>
                  <option value="STORAGE_TANK">Storage Tank</option>
                  <option value="BORE">Bore</option>
                  <option value="INTAKE">Intake</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main St, Wellington"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="-41.2865"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="174.7762"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Status & Risk */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Risk Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <select
                  id="condition"
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EXCELLENT">Excellent</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="VERY_POOR">Very Poor</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>

              <div>
                <label htmlFor="riskLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level *
                </label>
                <select
                  id="riskLevel"
                  name="riskLevel"
                  required
                  value={formData.riskLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="flex items-center pt-7">
                <input
                  type="checkbox"
                  id="isCritical"
                  name="isCritical"
                  checked={formData.isCritical}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isCritical" className="ml-2 block text-sm text-gray-900">
                  Mark as Critical Asset
                </label>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inspection Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Installation Date
                </label>
                <input
                  type="date"
                  id="installationDate"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="lastInspectionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Inspection Date
                </label>
                <input
                  type="date"
                  id="lastInspectionDate"
                  name="lastInspectionDate"
                  value={formData.lastInspectionDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="nextInspectionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Inspection Date
                </label>
                <input
                  type="date"
                  id="nextInspectionDate"
                  name="nextInspectionDate"
                  value={formData.nextInspectionDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h2>
            <div>
              <label htmlFor="specifications" className="block text-sm font-medium text-gray-700 mb-1">
                Specifications
              </label>
              <textarea
                id="specifications"
                name="specifications"
                rows={4}
                value={formData.specifications}
                onChange={handleChange}
                placeholder="Enter technical specifications, capacity, materials, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Link
              href={`/dashboard/assets/${assetId}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
