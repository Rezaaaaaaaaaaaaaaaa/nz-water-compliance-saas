/**
 * DWSP Progress Checklist Component
 *
 * Visual checklist showing completion status of all 12 mandatory DWSP elements
 */

'use client';

import { useState } from 'react';

export interface DWSPElement {
  id: string;
  number: number;
  title: string;
  description: string;
  isComplete: boolean;
  completionPercentage: number;
  lastUpdated?: string;
  requiredFields?: string[];
  completedFields?: string[];
}

interface DWSPProgressChecklistProps {
  elements: DWSPElement[];
  onElementClick?: (element: DWSPElement) => void;
  showDetails?: boolean;
}

const elementCategories = {
  'Supply Description': [1, 2],
  'Risk Assessment': [3, 4, 5],
  'Monitoring & Response': [6, 7, 8],
  'Management Systems': [9, 10, 11, 12],
};

export function DWSPProgressChecklist({
  elements,
  onElementClick,
  showDetails = true,
}: DWSPProgressChecklistProps) {
  const [expandedElement, setExpandedElement] = useState<string | null>(null);

  // Calculate overall completion
  const overallCompletion = Math.round(
    elements.reduce((sum, el) => sum + el.completionPercentage, 0) / elements.length
  );
  const completedCount = elements.filter(el => el.isComplete).length;

  return (
    <div className="w-full">
      {/* Progress Header */}
      <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">DWSP Completion Progress</h2>
            <p className="text-blue-100 mt-1">
              Drinking Water Safety Plan - Taumata Arowai Requirements
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{overallCompletion}%</div>
            <div className="text-blue-100 text-sm mt-1">
              {completedCount} of {elements.length} complete
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full h-4 bg-blue-400 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${overallCompletion}%` }}
          />
        </div>
      </div>

      {/* Category Sections */}
      {Object.entries(elementCategories).map(([category, elementNumbers]) => {
        const categoryElements = elements.filter(el => elementNumbers.includes(el.number));
        const categoryCompletion = Math.round(
          categoryElements.reduce((sum, el) => sum + el.completionPercentage, 0) / categoryElements.length
        );

        return (
          <div key={category} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
              <span className="text-sm font-medium text-gray-600">
                {categoryCompletion}% Complete
              </span>
            </div>

            <div className="space-y-3">
              {categoryElements.map(element => {
                const isExpanded = expandedElement === element.id;

                return (
                  <div
                    key={element.id}
                    className={`border-2 rounded-lg transition-all ${
                      element.isComplete
                        ? 'border-green-300 bg-green-50'
                        : element.completionPercentage > 0
                          ? 'border-yellow-300 bg-yellow-50'
                          : 'border-gray-300 bg-white'
                    }`}
                  >
                    {/* Element Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-opacity-80"
                      onClick={() => {
                        setExpandedElement(isExpanded ? null : element.id);
                        if (onElementClick) onElementClick(element);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox/Status Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {element.isComplete ? (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : element.completionPercentage > 0 ? (
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {Math.round(element.completionPercentage)}
                            </div>
                          ) : (
                            <div className="w-8 h-8 border-2 border-gray-300 rounded-full" />
                          )}
                        </div>

                        {/* Element Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-500">
                                  Element {element.number}
                                </span>
                                {element.isComplete && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded-full">
                                    COMPLETE
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base font-semibold text-gray-800 mt-1">
                                {element.title}
                              </h4>
                              {!showDetails && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {element.description}
                                </p>
                              )}
                            </div>

                            {/* Expand Icon */}
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isExpanded ? 'transform rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          {/* Progress Bar */}
                          {!element.isComplete && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{element.completionPercentage}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    element.completionPercentage === 100
                                      ? 'bg-green-500'
                                      : element.completionPercentage > 0
                                        ? 'bg-yellow-500'
                                        : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${element.completionPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && showDetails && (
                      <div className="border-t-2 border-gray-200 p-4 bg-white bg-opacity-50">
                        <p className="text-sm text-gray-700 mb-4">
                          {element.description}
                        </p>

                        {element.requiredFields && element.requiredFields.length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                              Required Information:
                            </h5>
                            <ul className="space-y-2">
                              {element.requiredFields.map((field, idx) => {
                                const isFieldComplete = element.completedFields?.includes(field);
                                return (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    {isFieldComplete ? (
                                      <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    )}
                                    <span className={isFieldComplete ? 'text-gray-700 line-through' : 'text-gray-600'}>
                                      {field}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {element.lastUpdated && (
                          <p className="text-xs text-gray-500 mt-4">
                            Last updated: {new Date(element.lastUpdated).toLocaleString('en-NZ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer Actions */}
      <div className="mt-6 p-4 bg-gray-100 rounded-lg flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {completedCount === elements.length ? (
            <span className="flex items-center gap-2 text-green-600 font-semibold">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              All elements complete! Ready for submission.
            </span>
          ) : (
            `${elements.length - completedCount} element${elements.length - completedCount !== 1 ? 's' : ''} remaining`
          )}
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Save Progress
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              completedCount === elements.length
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={completedCount !== elements.length}
          >
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}
