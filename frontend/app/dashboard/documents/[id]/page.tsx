'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useToast, ConfirmModal } from '@/components/ui';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [document, setDocument] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  async function loadDocument() {
    try {
      setLoading(true);
      const response = await apiClient.get(`/documents/${documentId}`);
      setDocument(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    try {
      setIsDownloading(true);
      // Get presigned URL for download
      const response = await apiClient.get(`/documents/${documentId}/download`);
      const { url } = response.data.data;

      // Open in new tab or trigger download
      window.open(url, '_blank');
      toast.success('Document download started');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to download document');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleDeleteConfirm() {
    try {
      setIsDeleting(true);
      await apiClient.delete(`/documents/${documentId}`);
      toast.success('Document deleted successfully');
      router.push('/dashboard/documents');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete document');
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Document not found'}</p>
          <Link href="/dashboard/documents" className="text-red-700 underline mt-2 inline-block">
            ← Back to documents
          </Link>
        </div>
      </div>
    );
  }

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      COMPLIANCE_PLAN: 'Compliance Plan',
      REPORT: 'Report',
      CERTIFICATE: 'Certificate',
      POLICY: 'Policy',
      PROCEDURE: 'Procedure',
      TEST_RESULT: 'Test Result',
      INSPECTION_REPORT: 'Inspection Report',
      CORRESPONDENCE: 'Correspondence',
      OTHER: 'Other',
    };
    return types[type] || type;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/documents" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to documents
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Title and Actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="text-4xl">{getFileIcon(document.mimeType)}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{document.filename}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {getDocumentTypeLabel(document.documentType)}
                </p>
                <p className="text-sm text-gray-500">
                  Uploaded {new Date(document.createdAt).toLocaleDateString('en-NZ', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? 'Downloading...' : 'Download'}
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

        {/* File Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">File Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">File Name</p>
              <p className="text-base text-gray-900 mt-1 break-all">{document.filename}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">File Size</p>
              <p className="text-base text-gray-900 mt-1">{formatFileSize(document.size)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">File Type</p>
              <p className="text-base text-gray-900 mt-1">{document.mimeType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Document Type</p>
              <p className="text-base text-gray-900 mt-1">{getDocumentTypeLabel(document.documentType)}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {document.description && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{document.description}</p>
          </div>
        )}

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related Asset */}
        {document.asset && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Asset</h2>
            <Link
              href={`/dashboard/assets/${document.asset.id}`}
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <div>
                <p className="font-medium text-blue-900">{document.asset.name}</p>
                <p className="text-sm text-blue-700 mt-1">{document.asset.type}</p>
              </div>
              <span className="text-blue-600">View →</span>
            </Link>
          </div>
        )}

        {/* Related Compliance Plan */}
        {document.dwsp && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Compliance Plan</h2>
            <Link
              href={`/dashboard/compliance/${document.dwsp.id}`}
              className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
            >
              <div>
                <p className="font-medium text-green-900">{document.dwsp.title}</p>
                <p className="text-sm text-green-700 mt-1">Version {document.dwsp.version}</p>
              </div>
              <span className="text-green-600">View →</span>
            </Link>
          </div>
        )}

        {/* Related Report */}
        {document.report && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Report</h2>
            <Link
              href={`/dashboard/reports/${document.report.id}`}
              className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
            >
              <div>
                <p className="font-medium text-purple-900">{document.report.title}</p>
                <p className="text-sm text-purple-700 mt-1">{document.report.reportType}</p>
              </div>
              <span className="text-purple-600">View →</span>
            </Link>
          </div>
        )}

        {/* Storage Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Storage Path</p>
              <p className="text-gray-900 mt-1 font-mono text-xs break-all">{document.s3Key}</p>
            </div>
            <div>
              <p className="text-gray-500">Storage Bucket</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{document.s3Bucket}</p>
            </div>
            {document.checksum && (
              <div className="md:col-span-2">
                <p className="text-gray-500">Checksum (MD5)</p>
                <p className="text-gray-900 mt-1 font-mono text-xs break-all">{document.checksum}</p>
              </div>
            )}
          </div>
        </div>

        {/* Version History */}
        {document.version && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Version Information</h2>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Current Version</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{document.version}</p>
              </div>
              {document.supersededBy && (
                <div className="text-right">
                  <p className="text-sm text-yellow-600">Superseded</p>
                  <Link
                    href={`/dashboard/documents/${document.supersededBy}`}
                    className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                  >
                    View newer version →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retention Policy */}
        {document.retentionDate && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Retention Policy</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                This document is subject to regulatory retention requirements and will be retained until:
              </p>
              <p className="text-base font-semibold text-yellow-900 mt-2">
                {new Date(document.retentionDate).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                (7-year retention period as required by Taumata Arowai)
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Uploaded By</p>
              <p className="text-gray-900 mt-1">{document.uploadedBy?.email || 'System'}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900 mt-1">
                {new Date(document.updatedAt).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Document ID</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{document.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Organization</p>
              <p className="text-gray-900 mt-1">{document.organization?.name || 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
