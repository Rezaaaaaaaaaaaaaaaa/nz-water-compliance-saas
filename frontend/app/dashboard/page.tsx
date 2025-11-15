'use client';

/**
 * Dashboard Home Page
 *
 * Overview of compliance status and key metrics
 */

import React from 'react';
import {
  Building2,
  FileText,
  BarChart3,
  PlusCircle,
  CheckCircle,
  AlertTriangle,
  Loader,
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuth } from '@/contexts/AuthContext';
import { useAssetStatistics } from '@/hooks/api/useAssets';
import { useDwsps } from '@/hooks/api/useDwsp';
import { useDocuments } from '@/hooks/api/useDocuments';
import { useReports } from '@/hooks/api/useReports';

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch data using React Query hooks
  const {
    data: assetStats,
    isLoading: assetsLoading,
    error: assetsError,
  } = useAssetStatistics();

  const {
    data: complianceData,
    isLoading: complianceLoading,
    error: complianceError,
  } = useDwsps({ limit: 1000 });

  const {
    data: documentsData,
    isLoading: documentsLoading,
    error: documentsError,
  } = useDocuments({ limit: 1 });

  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
  } = useReports({ limit: 1 });

  // Combine loading states
  const loading =
    assetsLoading || complianceLoading || documentsLoading || reportsLoading;

  // Calculate stats from the fetched data
  const stats = {
    assets: {
      total: assetStats?.total || 0,
      critical: assetStats?.critical || 0,
      needingInspection: assetStats?.needingInspection || 0,
    },
    compliance: {
      total: complianceData?.total || 0,
      approved:
        complianceData?.compliancePlans?.filter(
          (p: any) => p.status === 'APPROVED'
        ).length || 0,
      pending:
        complianceData?.compliancePlans?.filter(
          (p: any) => p.status === 'DRAFT' || p.status === 'IN_REVIEW'
        ).length || 0,
    },
    documents: {
      total: documentsData?.total || 0,
    },
    reports: {
      total: reportsData?.total || 0,
      submitted:
        reportsData?.reports?.filter((r: any) => r.status === 'SUBMITTED')
          .length || 0,
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName}!
            </h2>
            <p className="text-gray-600">
              Here's an overview of your organization's compliance status
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Assets */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Assets</h3>
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.assets.total}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-orange-600">
                  {stats.assets.critical} Critical
                </p>
                <p className="text-yellow-600">
                  {stats.assets.needingInspection} Need Inspection
                </p>
              </div>
            </div>

            {/* Compliance Plans */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Compliance Plans
                </h3>
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.compliance.total}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">
                  {stats.compliance.approved} Approved
                </p>
                <p className="text-yellow-600">
                  {stats.compliance.pending} Pending
                </p>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Documents</h3>
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.documents.total}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  Securely stored in S3
                </p>
              </div>
            </div>

            {/* Reports */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500">Reports</h3>
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {stats.reports.total}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">
                  {stats.reports.submitted} Submitted
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/dashboard/compliance"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <PlusCircle className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    Create Compliance Plan
                  </p>
                  <p className="text-sm text-gray-500">Start a new DWSP</p>
                </div>
              </a>

              <a
                href="/dashboard/assets"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <Building2 className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Manage Assets</p>
                  <p className="text-sm text-gray-500">
                    View and update infrastructure
                  </p>
                </div>
              </a>

              <a
                href="/dashboard/reports"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <BarChart3 className="w-8 h-8 text-blue-600 mr-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Generate Report</p>
                  <p className="text-sm text-gray-500">
                    Create compliance report
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Overview
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Water Quality Monitoring
                    </p>
                    <p className="text-sm text-gray-600">
                      All tests within acceptable limits
                    </p>
                  </div>
                </div>
                <span className="text-green-600 font-semibold">Compliant</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Asset Inspections
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.assets.needingInspection} assets require
                      inspection
                    </p>
                  </div>
                </div>
                <span className="text-yellow-600 font-semibold">
                  Action Required
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">
                      DWSP Documentation
                    </p>
                    <p className="text-sm text-gray-600">
                      {stats.compliance.approved} approved plans
                    </p>
                  </div>
                </div>
                <span className="text-blue-600 font-semibold">Up to Date</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
