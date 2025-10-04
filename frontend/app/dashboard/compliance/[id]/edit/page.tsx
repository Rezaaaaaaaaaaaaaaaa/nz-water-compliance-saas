'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function CompliancePlanEditPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    planType: 'DWSP',
    version: '',
    startDate: '',
    endDate: '',
    // DWSP Elements (12 mandatory requirements)
    waterSupplyDescription: '',
    hazardIdentification: '',
    riskAssessment: '',
    preventiveMeasures: '',
    operationalMonitoring: '',
    verificationMonitoring: '',
    correctiveActions: '',
    multiBarrierApproach: '',
    emergencyResponse: '',
    residualDisinfection: '',
    waterQuantityManagement: '',
    reviewProcedures: '',
  });

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function loadPlan() {
    try {
      setLoading(true);
      const response = await apiClient.get(`/compliance/dwsp/${planId}`);
      const planData = response.data.data;
      setPlan(planData);

      // Populate form with existing data
      setFormData({
        title: planData.title || '',
        description: planData.description || '',
        planType: planData.planType || 'DWSP',
        version: planData.version || '',
        startDate: planData.startDate ? new Date(planData.startDate).toISOString().split('T')[0] : '',
        endDate: planData.endDate ? new Date(planData.endDate).toISOString().split('T')[0] : '',
        waterSupplyDescription: planData.elements?.waterSupplyDescription || '',
        hazardIdentification: planData.elements?.hazardIdentification || '',
        riskAssessment: planData.elements?.riskAssessment || '',
        preventiveMeasures: planData.elements?.preventiveMeasures || '',
        operationalMonitoring: planData.elements?.operationalMonitoring || '',
        verificationMonitoring: planData.elements?.verificationMonitoring || '',
        correctiveActions: planData.elements?.correctiveActions || '',
        multiBarrierApproach: planData.elements?.multiBarrierApproach || '',
        emergencyResponse: planData.elements?.emergencyResponse || '',
        residualDisinfection: planData.elements?.residualDisinfection || '',
        waterQuantityManagement: planData.elements?.waterQuantityManagement || '',
        reviewProcedures: planData.elements?.reviewProcedures || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load compliance plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        planType: formData.planType,
        version: formData.version,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        elements: {
          waterSupplyDescription: formData.waterSupplyDescription,
          hazardIdentification: formData.hazardIdentification,
          riskAssessment: formData.riskAssessment,
          preventiveMeasures: formData.preventiveMeasures,
          operationalMonitoring: formData.operationalMonitoring,
          verificationMonitoring: formData.verificationMonitoring,
          correctiveActions: formData.correctiveActions,
          multiBarrierApproach: formData.multiBarrierApproach,
          emergencyResponse: formData.emergencyResponse,
          residualDisinfection: formData.residualDisinfection,
          waterQuantityManagement: formData.waterQuantityManagement,
          reviewProcedures: formData.reviewProcedures,
        },
      };

      await apiClient.put(`/compliance/dwsp/${planId}`, payload);
      router.push(`/dashboard/compliance/${planId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update compliance plan');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  if (error && !plan) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
          <Link href="/dashboard/compliance" className="text-red-700 underline mt-2 inline-block">
            ← Back to compliance plans
          </Link>
        </div>
      </div>
    );
  }

  if (plan?.status !== 'DRAFT') {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">Only DRAFT plans can be edited. This plan is currently {plan?.status}.</p>
          <Link href={`/dashboard/compliance/${planId}`} className="text-yellow-900 underline mt-2 inline-block">
            ← Back to plan details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/dashboard/compliance/${planId}`} className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to plan details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Edit Compliance Plan</h1>
        <p className="text-gray-600 mt-1">Update your Drinking Water Safety Plan (DWSP)</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Auckland Water Supply DWSP 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan Type *
              </label>
              <select
                required
                value={formData.planType}
                onChange={(e) => handleChange('planType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DWSP">DWSP (Drinking Water Safety Plan)</option>
                <option value="WATER_SUPPLY_SAFETY_PLAN">Water Supply Safety Plan</option>
                <option value="RISK_MANAGEMENT_PLAN">Risk Management Plan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version *
              </label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => handleChange('version', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of this compliance plan"
              />
            </div>
          </div>
        </div>

        {/* DWSP Elements (12 Mandatory Requirements) */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            DWSP Elements
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Complete all 12 mandatory requirements for Taumata Arowai compliance
          </p>

          <div className="space-y-6">
            {/* Element 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                1. Water Supply Description *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Comprehensive description of the water supply system, including sources, treatment, and distribution
              </p>
              <textarea
                required
                value={formData.waterSupplyDescription}
                onChange={(e) => handleChange('waterSupplyDescription', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your water supply system..."
              />
            </div>

            {/* Element 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                2. Hazard Identification *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Identification of all potential hazards from source to consumer
              </p>
              <textarea
                required
                value={formData.hazardIdentification}
                onChange={(e) => handleChange('hazardIdentification', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="List and describe identified hazards..."
              />
            </div>

            {/* Element 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                3. Risk Assessment *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Assessment of risks associated with identified hazards
              </p>
              <textarea
                required
                value={formData.riskAssessment}
                onChange={(e) => handleChange('riskAssessment', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Assess and document risks..."
              />
            </div>

            {/* Element 4 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                4. Preventive Measures *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Control measures to prevent or minimize identified risks
              </p>
              <textarea
                required
                value={formData.preventiveMeasures}
                onChange={(e) => handleChange('preventiveMeasures', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe preventive measures..."
              />
            </div>

            {/* Element 5 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                5. Operational Monitoring *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Regular monitoring to ensure control measures are working
              </p>
              <textarea
                required
                value={formData.operationalMonitoring}
                onChange={(e) => handleChange('operationalMonitoring', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe operational monitoring procedures..."
              />
            </div>

            {/* Element 6 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                6. Verification Monitoring *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Verification that the water supply meets drinking water standards
              </p>
              <textarea
                required
                value={formData.verificationMonitoring}
                onChange={(e) => handleChange('verificationMonitoring', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe verification monitoring procedures..."
              />
            </div>

            {/* Element 7 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                7. Corrective Actions *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Procedures for corrective action when control measures fail
              </p>
              <textarea
                required
                value={formData.correctiveActions}
                onChange={(e) => handleChange('correctiveActions', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe corrective action procedures..."
              />
            </div>

            {/* Element 8 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                8. Multi-Barrier Approach *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Multiple barriers to ensure water safety from source to tap
              </p>
              <textarea
                required
                value={formData.multiBarrierApproach}
                onChange={(e) => handleChange('multiBarrierApproach', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your multi-barrier approach..."
              />
            </div>

            {/* Element 9 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                9. Emergency Response *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Procedures for responding to emergencies and incidents
              </p>
              <textarea
                required
                value={formData.emergencyResponse}
                onChange={(e) => handleChange('emergencyResponse', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe emergency response procedures..."
              />
            </div>

            {/* Element 10 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                10. Residual Disinfection *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Maintenance of adequate residual disinfectant in the distribution system
              </p>
              <textarea
                required
                value={formData.residualDisinfection}
                onChange={(e) => handleChange('residualDisinfection', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe residual disinfection procedures..."
              />
            </div>

            {/* Element 11 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                11. Water Quantity Management *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Management of water quantity to ensure adequate supply
              </p>
              <textarea
                required
                value={formData.waterQuantityManagement}
                onChange={(e) => handleChange('waterQuantityManagement', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe water quantity management procedures..."
              />
            </div>

            {/* Element 12 */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                12. Review Procedures *
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Regular review and update of the DWSP
              </p>
              <textarea
                required
                value={formData.reviewProcedures}
                onChange={(e) => handleChange('reviewProcedures', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe DWSP review procedures..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/compliance/${planId}`}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
  );
}
