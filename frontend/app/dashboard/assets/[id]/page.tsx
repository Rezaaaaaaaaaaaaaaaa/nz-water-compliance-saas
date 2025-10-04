'use client';

/**
 * Asset Detail Page
 *
 * View detailed information about a specific asset
 */

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { assetsApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast, ConfirmModal } from '@/components/ui';

interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  location: string;
  gpsCoordinates?: string;
  condition: string;
  isCritical: boolean;
  riskLevel: string;
  capacity?: number;
  installDate?: string;
  manufacturer?: string;
  model?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadAsset();
  }, [params.id]);

  const loadAsset = async () => {
    try {
      const response = await assetsApi.get(params.id as string);
      setAsset(response.asset);
    } catch (error) {
      console.error('Failed to load asset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assetsApi.delete(params.id as string);
      toast.success('Asset deleted successfully');
      router.push('/dashboard/assets');
    } catch (error) {
      console.error('Failed to delete asset:', error);
      toast.error('Failed to delete asset');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-800';
      case 'GOOD':
        return 'bg-blue-100 text-blue-800';
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-800';
      case 'POOR':
        return 'bg-orange-100 text-orange-800';
      case 'VERY_POOR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading asset...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!asset) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Asset not found</p>
          <Link
            href="/dashboard/assets"
            className="inline-block mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Assets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
              {asset.isCritical && (
                <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                  Critical Asset
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {asset.type.replace('_', ' ')} • {asset.location}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/dashboard/assets/${asset.id}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Condition
            </h3>
            <span
              className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getConditionColor(
                asset.condition
              )}`}
            >
              {asset.condition.replace('_', ' ')}
            </span>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Risk Level
            </h3>
            <span
              className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(
                asset.riskLevel
              )}`}
            >
              {asset.riskLevel}
            </span>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Last Inspection
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {asset.lastInspectionDate
                ? new Date(asset.lastInspectionDate).toLocaleDateString()
                : 'Never'}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Asset Details
            </h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Asset Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {asset.type.replace('_', ' ')}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{asset.location}</dd>
              </div>

              {asset.gpsCoordinates && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    GPS Coordinates
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {asset.gpsCoordinates}
                  </dd>
                </div>
              )}

              {asset.capacity && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Capacity
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {asset.capacity} m³/day
                  </dd>
                </div>
              )}

              {asset.installDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Install Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(asset.installDate).toLocaleDateString()}
                  </dd>
                </div>
              )}

              {asset.manufacturer && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Manufacturer
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {asset.manufacturer}
                  </dd>
                </div>
              )}

              {asset.model && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model</dt>
                  <dd className="mt-1 text-sm text-gray-900">{asset.model}</dd>
                </div>
              )}

              {asset.nextInspectionDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Next Inspection
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(asset.nextInspectionDate).toLocaleDateString()}
                  </dd>
                </div>
              )}

              {asset.description && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {asset.description}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Created At
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(asset.createdAt).toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Last Updated
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(asset.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Placeholder sections for future features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inspection History
          </h2>
          <p className="text-gray-500 text-sm">
            Inspection history will be displayed here
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Related Documents
          </h2>
          <p className="text-gray-500 text-sm">
            Related documents will be displayed here
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete "${asset?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </DashboardLayout>
  );
}
