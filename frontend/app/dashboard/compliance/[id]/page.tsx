'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useToast, ConfirmModal } from '@/components/ui';

export default function CompliancePlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const planId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function loadPlan() {
    try {
      setLoading(true);
      const response = await apiClient.get(`/compliance/dwsp/${planId}`);
      setPlan(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load compliance plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true);
      await apiClient.delete(`/compliance/dwsp/${planId}`);
      toast.success('Compliance plan deleted successfully');
      router.push('/dashboard/compliance');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete plan');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      await apiClient.post(`/compliance/dwsp/${planId}/submit`);
      await loadPlan();
      toast.success('Plan submitted successfully to Taumata Arowai');
      setShowSubmitModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit plan');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error || 'Plan not found'}</p>
          <Link href="/dashboard/compliance" className="text-red-700 underline mt-2 inline-block">
            ← Back to compliance plans
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/compliance" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to compliance plans
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Title and Actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(plan.createdAt).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                {plan.status}
              </span>
              {plan.status === 'DRAFT' && (
                <>
                  <Link
                    href={`/dashboard/compliance/${planId}/edit`}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Submit
                  </button>
                </>
              )}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Plan Type</p>
              <p className="text-base text-gray-900 mt-1">{plan.planType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Version</p>
              <p className="text-base text-gray-900 mt-1">{plan.version}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Start Date</p>
              <p className="text-base text-gray-900 mt-1">
                {plan.startDate ? new Date(plan.startDate).toLocaleDateString('en-NZ') : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">End Date</p>
              <p className="text-base text-gray-900 mt-1">
                {plan.endDate ? new Date(plan.endDate).toLocaleDateString('en-NZ') : 'Not set'}
              </p>
            </div>
            {plan.description && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-base text-gray-900 mt-1">{plan.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* DWSP Elements */}
        {plan.planType === 'DWSP' && plan.elements && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              DWSP Elements (12 Mandatory Requirements)
            </h2>
            <div className="space-y-3">
              {[
                { key: 'waterSupplyDescription', label: '1. Water Supply Description' },
                { key: 'hazardIdentification', label: '2. Hazard Identification' },
                { key: 'riskAssessment', label: '3. Risk Assessment' },
                { key: 'preventiveMeasures', label: '4. Preventive Measures' },
                { key: 'operationalMonitoring', label: '5. Operational Monitoring' },
                { key: 'verificationMonitoring', label: '6. Verification Monitoring' },
                { key: 'correctiveActions', label: '7. Corrective Actions' },
                { key: 'multiBarrierApproach', label: '8. Multi-Barrier Approach' },
                { key: 'emergencyResponse', label: '9. Emergency Response' },
                { key: 'residualDisinfection', label: '10. Residual Disinfection' },
                { key: 'waterQuantityManagement', label: '11. Water Quantity Management' },
                { key: 'reviewProcedures', label: '12. Review Procedures' },
              ].map((element) => {
                const isComplete = plan.elements?.[element.key];
                return (
                  <div key={element.key} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
                    <span className="text-sm text-gray-900">{element.label}</span>
                    {isComplete ? (
                      <span className="text-green-600 font-medium">✓ Complete</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Incomplete</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submission & Approval */}
        {(plan.submittedAt || plan.approvedAt || plan.rejectedAt) && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission History</h2>
            <div className="space-y-3">
              {plan.submittedAt && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Submitted to Taumata Arowai</span>
                  <span className="text-sm text-gray-900">
                    {new Date(plan.submittedAt).toLocaleDateString('en-NZ', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {plan.approvedAt && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Approved by {plan.approvedBy || 'Regulator'}</span>
                  <span className="text-sm text-gray-900">
                    {new Date(plan.approvedAt).toLocaleDateString('en-NZ', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              {plan.rejectedAt && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-900">Rejected</span>
                    <span className="text-sm text-red-700">
                      {new Date(plan.rejectedAt).toLocaleDateString('en-NZ', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                  {plan.rejectionReason && (
                    <p className="text-sm text-red-700 mt-2">{plan.rejectionReason}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="px-6 py-4 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Created By</p>
              <p className="text-gray-900 mt-1">{plan.createdBy?.email || 'System'}</p>
            </div>
            <div>
              <p className="text-gray-500">Last Updated</p>
              <p className="text-gray-900 mt-1">
                {new Date(plan.updatedAt).toLocaleDateString('en-NZ', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Plan ID</p>
              <p className="text-gray-900 mt-1 font-mono text-xs">{plan.id}</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Compliance Plan"
        message={`Are you sure you want to delete "${plan?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />

      <ConfirmModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmit}
        title="Submit to Taumata Arowai"
        message="Submit this plan to Taumata Arowai? This will change the status to IN_REVIEW."
        confirmText="Submit"
        variant="primary"
        isLoading={submitting}
      />
    </div>
  );
}
