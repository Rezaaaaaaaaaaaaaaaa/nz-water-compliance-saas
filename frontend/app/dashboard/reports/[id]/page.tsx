'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useToast, ConfirmModal } from '@/components/ui';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  async function loadReport() {
    try {
      setLoading(true);
      const response = await apiClient.get(`/compliance/reports/${reportId}`);
      setReport(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/compliance/reports/${reportId}`);
      toast.success('Report deleted successfully');
      router.push('/dashboard/reports');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete report');
      setIsDeleting(false);
    }
  }

  async function handleDownload() {
    try {
      setIsDownloading(true);
      const response = await apiClient.get(`/compliance/reports/${reportId}/download`, {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report downloaded successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Report not found'}</p>
          <Link href="/dashboard/reports" className="text-red-700 underline mt-2 inline-block">
            ← Back to reports
          </Link>
        </div>
      </div>
    );
  }

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      MONTHLY_COMPLIANCE: 'Monthly Compliance Report',
      QUARTERLY_COMPLIANCE: 'Quarterly Compliance Report',
      ANNUAL_COMPLIANCE: 'Annual Compliance Report',
      INCIDENT_REPORT: 'Incident Report',
      AUDIT_REPORT: 'Audit Report',
      CUSTOM: 'Custom Report',
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/reports" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to reports
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Title and Actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {getReportTypeLabel(report.reportType)}
              </p>
              <p className="text-sm text-gray-500">
                Created {new Date(report.createdAt).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Downloading...' : 'Download PDF'}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Report Period */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporting Period</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="text-base text-gray-900 mt-1">
                {report.periodStart ? new Date(report.periodStart).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }) : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="text-base text-gray-900 mt-1">
                {report.periodEnd ? new Date(report.periodEnd).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }) : 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{report.summary}</p>
          </div>
        )}

        {/* Report Data */}
        {report.data && Object.keys(report.data).length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Data</h2>

            {/* Key Metrics */}
            {report.data.metrics && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(report.data.metrics).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance Status */}
            {report.data.compliance && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">Compliance Status</h3>
                <div className="space-y-2">
                  {Object.entries(report.data.compliance).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        value === 'COMPLIANT' || value === true
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents */}
            {report.data.incidents && Array.isArray(report.data.incidents) && report.data.incidents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-800 mb-3">Incidents Reported</h3>
                <div className="space-y-3">
                  {report.data.incidents.map((incident: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{incident.title || `Incident ${index + 1}`}</p>
                          <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                          {incident.date && (
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(incident.date).toLocaleDateString('en-NZ')}
                            </p>
                          )}
                        </div>
                        {incident.severity && (
                          <span className={`ml-4 px-2 py-1 rounded text-xs font-medium ${
                            incident.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {incident.severity}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Data */}
            {Object.entries(report.data).filter(([key]) =>
              !['metrics', 'compliance', 'incidents'].includes(key)
            ).map(([key, value]: [string, any]) => (
              <div key={key} className="mb-4">
                <h3 className="text-md font-medium text-gray-800 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Findings and Recommendations */}
        {(report.findings || report.recommendations) && (
          <div className="px-6 py-4 border-b border-gray-200">
            {report.findings && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Findings</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{report.findings}</p>
              </div>
            )}
            {report.recommendations && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{report.recommendations}</p>
              </div>
            )}
          </div>
        )}

        {/* Submission Information */}
        {report.submittedAt && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Information</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Submitted to Taumata Arowai</span>
                <span className="text-sm text-gray-900">
                  {new Date(report.submittedAt).toLocaleDateString('en-NZ', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {report.submittedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Submitted by</span>
                  <span className="text-sm text-gray-900">{report.submittedBy.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Related DWSP */}
        {report.dwsp && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Compliance Plan</h2>
            <Link
              href={`/dashboard/compliance/${report.dwsp.id}`}
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <div>
                <p className="font-medium text-blue-900">{report.dwsp.title}</p>
                <p className="text-sm text-blue-700 mt-1">Version {report.dwsp.version}</p>
              </div>
              <span className="text-blue-600">View →</span>
            </Link>
          </div>
        )}

        {/* Metadata */}
        <div className="px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created By</p>
              <p className="text-gray-900 mt-1">{report.createdBy?.email || 'System'}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900 mt-1">
                {new Date(report.updatedAt).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Report ID</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{report.id}</p>
            </div>
            {report.dwspId && (
              <div>
                <p className="text-gray-500">Compliance Plan ID</p>
                <p className="text-gray-900 mt-1 font-mono text-xs">{report.dwspId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
