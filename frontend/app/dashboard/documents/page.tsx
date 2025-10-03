'use client';

/**
 * Documents List Page
 *
 * Display and manage regulatory documents with S3 uploads
 */

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { documentsApi } from '@/lib/api';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version?: string;
  isPublic: boolean;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    documentType: '',
    search: '',
  });

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.list({
        documentType: filters.documentType || undefined,
        search: filters.search || undefined,
      });
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const response = await documentsApi.getDownloadUrl(documentId);
      // Open download URL in new tab
      window.open(response.downloadUrl, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
      alert('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'DWSP':
        return 'bg-blue-100 text-blue-800';
      case 'POLICY':
        return 'bg-purple-100 text-purple-800';
      case 'PROCEDURE':
        return 'bg-green-100 text-green-800';
      case 'REPORT':
        return 'bg-orange-100 text-orange-800';
      case 'CERTIFICATE':
        return 'bg-yellow-100 text-yellow-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600 mt-1">
              Manage regulatory documents with secure cloud storage
            </p>
          </div>
          <Link
            href="/dashboard/documents/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            + Upload Document
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Search documents..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={filters.documentType}
                onChange={(e) =>
                  setFilters({ ...filters, documentType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="DWSP">DWSP</option>
                <option value="POLICY">Policy</option>
                <option value="PROCEDURE">Procedure</option>
                <option value="REPORT">Report</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="INSPECTION">Inspection</option>
                <option value="TEST_RESULT">Test Result</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center justify-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="ml-3 text-gray-600">Loading documents...</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No documents found</p>
            <Link
              href="/dashboard/documents/upload"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700"
            >
              Upload your first document
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <span className="mr-2">📄</span>
                          {doc.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.fileName}
                        </div>
                        {doc.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {doc.description.substring(0, 100)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDocumentTypeColor(
                          doc.documentType
                        )}`}
                      >
                        {doc.documentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.version || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                      {doc.createdBy && (
                        <div className="text-xs text-gray-400">
                          by {doc.createdBy.firstName} {doc.createdBy.lastName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownload(doc.id, doc.fileName)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Download
                      </button>
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
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

        {/* Summary */}
        {!loading && documents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Document Storage Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {documents.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(
                    documents.reduce((sum, doc) => sum + doc.fileSize, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Storage Location</p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  AWS S3 (Secure Cloud)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
