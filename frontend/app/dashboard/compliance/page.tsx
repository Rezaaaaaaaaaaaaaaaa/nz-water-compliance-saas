'use client';

/**
 * Compliance Plans List Page
 *
 * Display and manage Drinking Water Safety Plans (DWSPs)
 */

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { dwspApi } from '@/lib/api';
import Link from 'next/link';
import { TablePagination } from '@/components/ui';

interface CompliancePlan {
  id: string;
  title: string;
  planType: string;
  status: string;
  targetDate?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  assignedTo?: {
    firstName: string;
    lastName: string;
  };
}

export default function CompliancePlansPage() {
  const [plans, setPlans] = useState<CompliancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    planType: '',
  });

  useEffect(() => {
    loadPlans();
  }, [filters, currentPage, pageSize]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await dwspApi.list({
        status: filters.status || undefined,
        planType: filters.planType || undefined,
        page: currentPage,
        limit: pageSize,
      });
      setPlans(response.compliancePlans || []);
      setTotalItems(response.total || response.compliancePlans?.length || 0);
    } catch (error) {
      console.error('Failed to load compliance plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Compliance Plans
            </h1>
            <p className="text-gray-600 mt-1">
              Manage Drinking Water Safety Plans (DWSPs) for Taumata Arowai
            </p>
          </div>
          <Link
            href="/dashboard/compliance/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            + Create DWSP
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type
              </label>
              <select
                value={filters.planType}
                onChange={(e) =>
                  setFilters({ ...filters, planType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="DWSP">DWSP</option>
                <option value="ANNUAL_COMPLIANCE">Annual Compliance</option>
                <option value="IMPROVEMENT_PLAN">Improvement Plan</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plans List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="ml-3 text-gray-600">Loading compliance plans...</p>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No compliance plans found</p>
            <Link
              href="/dashboard/compliance/create"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first DWSP
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(plan.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.planType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          plan.status
                        )}`}
                      >
                        {plan.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.assignedTo
                        ? `${plan.assignedTo.firstName} ${plan.assignedTo.lastName}`
                        : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.targetDate
                        ? new Date(plan.targetDate).toLocaleDateString()
                        : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/compliance/${plan.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </Link>
                      {plan.status === 'DRAFT' && (
                        <Link
                          href={`/dashboard/compliance/${plan.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalItems > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / pageSize)}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            )}
          </div>
        )}

        {/* Summary */}
        {!loading && plans.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Plans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {plans.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {plans.filter((p) => p.status === 'APPROVED').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">In Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {
                    plans.filter(
                      (p) => p.status === 'IN_REVIEW' || p.status === 'SUBMITTED'
                    ).length
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Draft</p>
                <p className="text-2xl font-bold text-gray-600">
                  {plans.filter((p) => p.status === 'DRAFT').length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Regulatory Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            📋 DWSP Requirements
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            All Drinking Water Safety Plans must include the following 12
            mandatory elements as per Taumata Arowai regulations:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 columns-2">
            <li>1. Water Supply Description</li>
            <li>2. Hazard Identification</li>
            <li>3. Risk Assessment</li>
            <li>4. Preventive Measures</li>
            <li>5. Operational Monitoring</li>
            <li>6. Verification Monitoring</li>
            <li>7. Corrective Actions</li>
            <li>8. Multi-Barrier Approach</li>
            <li>9. Emergency Response</li>
            <li>10. Residual Disinfection</li>
            <li>11. Water Quantity Management</li>
            <li>12. Review Procedures</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
