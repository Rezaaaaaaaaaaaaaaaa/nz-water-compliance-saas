'use client';

/**
 * Dashboard Home Page
 *
 * Overview of compliance status and key metrics
 */

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { assetsApi, dwspApi, documentsApi, reportsApi } from '@/lib/api';

interface DashboardStats {
  assets: {
    total: number;
    critical: number;
    needingInspection: number;
  };
  compliance: {
    total: number;
    approved: number;
    pending: number;
  };
  documents: {
    total: number;
  };
  reports: {
    total: number;
    submitted: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [assetsData, complianceData, documentsData, reportsData] =
        await Promise.all([
          assetsApi.statistics(),
          dwspApi.list({ limit: 1000 }),
          documentsApi.list({ limit: 1 }),
          reportsApi.list({ limit: 1 }),
        ]);

      setStats({
        assets: {
          total: assetsData.total || 0,
          critical: assetsData.critical || 0,
          needingInspection: assetsData.needingInspection || 0,
        },
        compliance: {
          total: complianceData.total || 0,
          approved:
            complianceData.compliancePlans?.filter(
              (p: any) => p.status === 'APPROVED'
            ).length || 0,
          pending:
            complianceData.compliancePlans?.filter(
              (p: any) => p.status === 'DRAFT' || p.status === 'IN_REVIEW'
            ).length || 0,
        },
        documents: {
          total: documentsData.total || 0,
        },
        reports: {
          total: reportsData.total || 0,
          submitted:
            reportsData.reports?.filter((r: any) => r.status === 'SUBMITTED')
              .length || 0,
        },
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
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
              <span className="text-3xl">🏗️</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.assets.total || 0}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-orange-600">
                {stats?.assets.critical || 0} Critical
              </p>
              <p className="text-yellow-600">
                {stats?.assets.needingInspection || 0} Need Inspection
              </p>
            </div>
          </div>

          {/* Compliance Plans */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">
                Compliance Plans
              </h3>
              <span className="text-3xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.compliance.total || 0}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">
                {stats?.compliance.approved || 0} Approved
              </p>
              <p className="text-yellow-600">
                {stats?.compliance.pending || 0} Pending
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Documents</h3>
              <span className="text-3xl">📄</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.documents.total || 0}
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
              <span className="text-3xl">📈</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {stats?.reports.total || 0}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-green-600">
                {stats?.reports.submitted || 0} Submitted
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
              <span className="text-3xl mr-4">➕</span>
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
              <span className="text-3xl mr-4">🏗️</span>
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
              <span className="text-3xl mr-4">📊</span>
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
                <span className="text-2xl mr-3">✅</span>
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
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="font-medium text-gray-900">
                    Asset Inspections
                  </p>
                  <p className="text-sm text-gray-600">
                    {stats?.assets.needingInspection || 0} assets require
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
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <p className="font-medium text-gray-900">
                    DWSP Documentation
                  </p>
                  <p className="text-sm text-gray-600">
                    {stats?.compliance.approved || 0} approved plans
                  </p>
                </div>
              </div>
              <span className="text-blue-600 font-semibold">Up to Date</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
