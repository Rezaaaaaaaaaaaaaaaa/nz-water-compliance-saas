'use client';

/**
 * Create Compliance Plan - Multi-Step Wizard
 *
 * Guide users through creating a DWSP with all 12 mandatory elements
 */

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { dwspApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CreateCompliancePlanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    planType: 'DWSP',
    targetDate: '',

    // Water Supply Description
    supplyName: '',
    supplyType: '',
    population: '',
    supplyClassification: '',

    // Hazards (simplified - will be JSON in actual implementation)
    hazards: '',

    // Risk Assessment
    riskAssessmentSummary: '',

    // Preventive Measures
    preventiveMeasures: '',

    // Operational Monitoring
    operationalMonitoring: '',

    // Verification Monitoring
    verificationMonitoring: '',

    // Corrective Actions
    correctiveActions: '',

    // Multi-Barrier Approach
    multiBarrierApproach: '',

    // Emergency Response
    emergencyResponse: '',

    // Residual Disinfection
    residualDisinfection: '',

    // Water Quantity
    waterQuantity: '',

    // Review Procedures
    reviewProcedures: '',
  });

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Plan overview' },
    {
      number: 2,
      title: 'Water Supply Description',
      description: 'Element 1',
    },
    { number: 3, title: 'Hazard & Risk', description: 'Elements 2-3' },
    {
      number: 4,
      title: 'Preventive Measures',
      description: 'Element 4',
    },
    { number: 5, title: 'Monitoring', description: 'Elements 5-6' },
    {
      number: 6,
      title: 'Response & Review',
      description: 'Elements 7-12',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      // Build DWSP content structure matching backend expectations
      const dwspContent = {
        waterSupplyDescription: {
          supplyName: formData.supplyName,
          supplyType: formData.supplyType,
          population: parseInt(formData.population),
          classification: formData.supplyClassification,
        },
        hazards: formData.hazards ? JSON.parse(formData.hazards) : [],
        riskAssessment: {
          summary: formData.riskAssessmentSummary,
        },
        preventiveMeasures: formData.preventiveMeasures
          ? JSON.parse(formData.preventiveMeasures)
          : [],
        operationalMonitoring: {
          summary: formData.operationalMonitoring,
        },
        verificationMonitoring: {
          summary: formData.verificationMonitoring,
        },
        correctiveActions: formData.correctiveActions
          ? JSON.parse(formData.correctiveActions)
          : [],
        multiBarrierApproach: {
          description: formData.multiBarrierApproach,
        },
        emergencyResponse: {
          procedures: formData.emergencyResponse,
        },
        residualDisinfection: {
          details: formData.residualDisinfection,
        },
        waterQuantity: {
          management: formData.waterQuantity,
        },
        reviewProcedures: {
          schedule: formData.reviewProcedures,
        },
      };

      await dwspApi.create({
        title: formData.title,
        description: formData.description,
        planType: formData.planType,
        targetDate: formData.targetDate || undefined,
        content: dwspContent,
      });

      router.push('/dashboard/compliance');
    } catch (err: any) {
      console.error('Create error:', err);
      setError(
        err.response?.data?.message || 'Failed to create compliance plan'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Auckland City DWSP 2025"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the compliance plan..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type *
                </label>
                <select
                  name="planType"
                  value={formData.planType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DWSP">DWSP</option>
                  <option value="ANNUAL_COMPLIANCE">Annual Compliance</option>
                  <option value="IMPROVEMENT_PLAN">Improvement Plan</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  name="targetDate"
                  value={formData.targetDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Element 1: Water Supply Description
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply Name *
              </label>
              <input
                type="text"
                name="supplyName"
                value={formData.supplyName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Auckland Central Water Supply"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supply Type *
                </label>
                <select
                  name="supplyType"
                  value={formData.supplyType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="MUNICIPAL">Municipal</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="RURAL">Rural</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Population Served *
                </label>
                <input
                  type="number"
                  name="population"
                  value={formData.population}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply Classification *
              </label>
              <select
                name="supplyClassification"
                value={formData.supplyClassification}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="LARGE">Large (>500 people)</option>
                <option value="MEDIUM">Medium (101-500 people)</option>
                <option value="SMALL">Small (25-100 people)</option>
                <option value="MINOR">Minor (&lt;25 people)</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Elements 2-3: Hazard Identification & Risk Assessment
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hazards (JSON format) *
              </label>
              <textarea
                name="hazards"
                value={formData.hazards}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='[{"hazard": "Microbial contamination", "source": "Surface water", "likelihood": "Possible", "consequence": "Major", "riskRating": "High"}]'
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter hazards as JSON array
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Risk Assessment Summary *
              </label>
              <textarea
                name="riskAssessmentSummary"
                value={formData.riskAssessmentSummary}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Summary of risk assessment methodology and findings..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Element 4: Preventive Measures
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preventive Measures (JSON format) *
              </label>
              <textarea
                name="preventiveMeasures"
                value={formData.preventiveMeasures}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='[{"measure": "UV disinfection", "hazardAddressed": "Microbial contamination", "responsibility": "Treatment operator", "frequency": "Continuous"}]'
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter preventive measures as JSON array
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Elements 5-6: Operational & Verification Monitoring
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Operational Monitoring *
              </label>
              <textarea
                name="operationalMonitoring"
                value={formData.operationalMonitoring}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe operational monitoring procedures (e.g., daily chlorine residual checks, turbidity monitoring)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Monitoring *
              </label>
              <textarea
                name="verificationMonitoring"
                value={formData.verificationMonitoring}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe verification monitoring procedures (e.g., monthly E.coli testing, quarterly chemical analysis)..."
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Elements 7-12: Response, Barriers & Review
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corrective Actions (JSON format) *
              </label>
              <textarea
                name="correctiveActions"
                value={formData.correctiveActions}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder='[{"trigger": "Chlorine below 0.2 mg/L", "action": "Increase chlorine dose, notify supervisor", "responsibility": "Operator"}]'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Multi-Barrier Approach *
              </label>
              <textarea
                name="multiBarrierApproach"
                value={formData.multiBarrierApproach}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe barriers (e.g., source protection, treatment, distribution integrity)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Response Procedures *
              </label>
              <textarea
                name="emergencyResponse"
                value={formData.emergencyResponse}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Emergency procedures and contacts..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Residual Disinfection Details *
                </label>
                <textarea
                  name="residualDisinfection"
                  value={formData.residualDisinfection}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Disinfection approach..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Water Quantity Management *
                </label>
                <textarea
                  name="waterQuantity"
                  value={formData.waterQuantity}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Quantity monitoring..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review Procedures *
              </label>
              <textarea
                name="reviewProcedures"
                value={formData.reviewProcedures}
                onChange={handleChange}
                required
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Schedule and procedures for DWSP review..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Compliance Plan
          </h1>
          <p className="text-gray-600 mt-1">
            Complete all 12 mandatory elements for Taumata Arowai
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.number}
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs font-medium">{step.title}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-1 w-16 mx-2 ${
                      currentStep > step.number
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </span>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Plan'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
