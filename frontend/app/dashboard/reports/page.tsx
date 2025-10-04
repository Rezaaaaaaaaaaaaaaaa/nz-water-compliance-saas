'use client';

/**
 * Reports Page
 *
 * Generate and manage regulatory compliance reports
 */

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { reportsApi } from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/components/ui';

interface Report {
  id: string;
  title: string;
  reportType: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  submittedAt?: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

export default function ReportsPage() {
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    type: 'monthly',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    quarter: '1',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportsApi.list();
      setReports(response.reports || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      let reportData;

      if (generateForm.type === 'monthly') {
        reportData = await reportsApi.generateMonthly(
          parseInt(generateForm.year),
          parseInt(generateForm.month)
        );
      } else if (generateForm.type === 'quarterly') {
        reportData = await reportsApi.generateQuarterly(
          parseInt(generateForm.year),
          parseInt(generateForm.quarter)
        );
      } else {
        reportData = await reportsApi.generateAnnual(
          parseInt(generateForm.year)
        );
      }

      // Create report
      const periodName =
        generateForm.type === 'monthly'
          ? `${generateForm.year}-${generateForm.month.padStart(2, '0')}`
          : generateForm.type === 'quarterly'
          ? `${generateForm.year} Q${generateForm.quarter}`
          : generateForm.year;

      await reportsApi.create({
        title: `${generateForm.type.charAt(0).toUpperCase() + generateForm.type.slice(1)} Compliance Report - ${periodName}`,
        description: `Auto-generated compliance report`,
        reportType: generateForm.type.toUpperCase(),
        startDate: reportData.reportData.period.start,
        endDate: reportData.reportData.period.end,
        includeAssets: true,
        includeDocuments: true,
        includeIncidents: true,
        includeTestResults: true,
      });

      toast.success('Report generated successfully');
      setShowGenerateModal(false);
      loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">
              Generate and manage regulatory compliance reports
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            + Generate Report
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setGenerateForm({ ...generateForm, type: 'monthly' });
              setShowGenerateModal(true);
            }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Report
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate monthly compliance report
            </p>
          </button>

          <button
            onClick={() => {
              setGenerateForm({ ...generateForm, type: 'quarterly' });
              setShowGenerateModal(true);
            }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-3xl mb-2">📈</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Quarterly Report
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate quarterly compliance report
            </p>
          </button>

          <button
            onClick={() => {
              setGenerateForm({ ...generateForm, type: 'annual' });
              setShowGenerateModal(true);
            }}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="text-3xl mb-2">📋</div>
            <h3 className="text-lg font-semibold text-gray-900">
              Annual Report
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Generate annual compliance report
            </p>
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="ml-3 text-gray-600">Loading reports...</p>
            </div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No reports found</p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-block mt-4 text-blue-600 hover:text-blue-700"
            >
              Generate your first report
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {report.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {report.createdBy.firstName}{' '}
                        {report.createdBy.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.reportType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.startDate).toLocaleDateString()} -{' '}
                      {new Date(report.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Generate Compliance Report
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Type
                </label>
                <select
                  value={generateForm.type}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  value={generateForm.year}
                  onChange={(e) =>
                    setGenerateForm({ ...generateForm, year: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2020"
                  max="2030"
                />
              </div>

              {generateForm.type === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={generateForm.month}
                    onChange={(e) =>
                      setGenerateForm({ ...generateForm, month: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2000, month - 1).toLocaleString('default', {
                          month: 'long',
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {generateForm.type === 'quarterly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quarter
                  </label>
                  <select
                    value={generateForm.quarter}
                    onChange={(e) =>
                      setGenerateForm({
                        ...generateForm,
                        quarter: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Q1 (Jan-Mar)</option>
                    <option value="2">Q2 (Apr-Jun)</option>
                    <option value="3">Q3 (Jul-Sep)</option>
                    <option value="4">Q4 (Oct-Dec)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
