/**
 * Custom Report Builder Component
 *
 * Interactive report builder for creating custom compliance reports
 * with drag-and-drop sections, data selection, and formatting options
 */

"use client";

import { useState, useMemo } from "react";

export interface ReportSection {
  id: string;
  type:
    | "header"
    | "summary"
    | "table"
    | "chart"
    | "timeline"
    | "checklist"
    | "text"
    | "image";
  title: string;
  content: Record<string, unknown>;
  config: {
    showTitle?: boolean;
    fontSize?: "small" | "medium" | "large";
    alignment?: "left" | "center" | "right";
    columns?: number;
  };
  order: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "compliance" | "operational" | "financial" | "audit" | "custom";
  sections: ReportSection[];
  settings: {
    pageSize: "A4" | "Letter" | "Legal";
    orientation: "portrait" | "landscape";
    includeHeader: boolean;
    includeFooter: boolean;
    includeTOC: boolean;
  };
  createdDate: string;
  lastModified: string;
}

interface CustomReportBuilderProps {
  template?: ReportTemplate;
  onSave: (template: ReportTemplate) => void;
  onPreview?: (template: ReportTemplate) => void;
  onCancel?: () => void;
}

const sectionTypes = [
  {
    type: "header",
    label: "Header",
    icon: "📌",
    description: "Report title and metadata",
  },
  {
    type: "summary",
    label: "Summary",
    icon: "📊",
    description: "Executive summary with key stats",
  },
  {
    type: "table",
    label: "Data Table",
    icon: "📋",
    description: "Tabular data display",
  },
  {
    type: "chart",
    label: "Chart",
    icon: "📈",
    description: "Visual data representation",
  },
  {
    type: "timeline",
    label: "Timeline",
    icon: "📅",
    description: "Chronological events",
  },
  {
    type: "checklist",
    label: "Checklist",
    icon: "✓",
    description: "Compliance checklist",
  },
  {
    type: "text",
    label: "Text Block",
    icon: "📝",
    description: "Free-form text content",
  },
  {
    type: "image",
    label: "Image",
    icon: "🖼️",
    description: "Image or diagram",
  },
];

const categoryConfig = {
  compliance: { label: "Compliance Report", icon: "📋", color: "#3b82f6" },
  operational: { label: "Operational Report", icon: "⚙️", color: "#10b981" },
  financial: { label: "Financial Report", icon: "💰", color: "#f59e0b" },
  audit: { label: "Audit Report", icon: "🔍", color: "#8b5cf6" },
  custom: { label: "Custom Report", icon: "🎨", color: "#6b7280" },
};

export function CustomReportBuilder({
  template: initialTemplate,
  onSave,
  onPreview,
  onCancel,
}: CustomReportBuilderProps) {
  const [name, setName] = useState(initialTemplate?.name || "");
  const [description, setDescription] = useState(
    initialTemplate?.description || "",
  );
  const [category, setCategory] = useState<ReportTemplate["category"]>(
    initialTemplate?.category || "custom",
  );
  const [sections, setSections] = useState<ReportSection[]>(
    initialTemplate?.sections || [],
  );
  const [settings, setSettings] = useState<ReportTemplate["settings"]>(
    initialTemplate?.settings || {
      pageSize: "A4",
      orientation: "portrait",
      includeHeader: true,
      includeFooter: true,
      includeTOC: false,
    },
  );
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);

  // Validation
  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Report name is required");
    if (sections.length === 0) errors.push("At least one section is required");

    return { isValid: errors.length === 0, errors };
  }, [name, sections]);

  // Add section
  const addSection = (type: ReportSection["type"]) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      type,
      title: `${sectionTypes.find((t) => t.type === type)?.label} ${sections.length + 1}`,
      content: {},
      config: {
        showTitle: true,
        fontSize: "medium",
        alignment: "left",
        columns: 1,
      },
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection.id);
    setShowAddSection(false);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    if (selectedSection === sectionId) setSelectedSection(null);
  };

  // Update section
  const updateSection = (
    sectionId: string,
    updates: Partial<ReportSection>,
  ) => {
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    );
  };

  // Move section
  const moveSection = (sectionId: string, direction: "up" | "down") => {
    const index = sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [
      newSections[swapIndex],
      newSections[index],
    ];

    // Update order
    newSections.forEach((s, i) => {
      s.order = i;
    });

    setSections(newSections);
  };

  // Save report
  const handleSave = () => {
    if (!validation.isValid) return;

    const report: ReportTemplate = {
      id: initialTemplate?.id || `report-${Date.now()}`,
      name,
      description,
      category,
      sections,
      settings,
      createdDate: initialTemplate?.createdDate || new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    onSave(report);
  };

  const selectedSectionData = sections.find((s) => s.id === selectedSection);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-2xl">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Report Name"
              className="w-full text-2xl font-bold text-gray-800 border-2 border-transparent focus:border-blue-500 rounded px-2 py-1 outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Report description..."
              className="w-full mt-2 text-sm text-gray-600 border-2 border-transparent focus:border-blue-500 rounded px-2 py-1 outline-none resize-none"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            {onPreview && (
              <button
                onClick={() =>
                  onPreview({
                    ...initialTemplate!,
                    name,
                    description,
                    category,
                    sections,
                    settings,
                  })
                }
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                👁️ Preview
              </button>
            )}
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!validation.isValid}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                validation.isValid
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              💾 Save Report
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ReportTemplate["category"])
              }
              className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Page Size:
            </span>
            <select
              value={settings.pageSize}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  pageSize: e.target.value as "A4" | "Letter" | "Legal",
                })
              }
              className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Orientation:
            </span>
            <select
              value={settings.orientation}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  orientation: e.target.value as "portrait" | "landscape",
                })
              }
              className="px-3 py-1 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="ml-auto">
            <span className="text-xs text-gray-500">
              {sections.length} section{sections.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-800 mb-1">
              Please fix the following:
            </p>
            <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="w-64 bg-gray-50 border-r-2 border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Section Types
          </h3>
          <div className="space-y-2">
            {sectionTypes.map((type) => (
              <button
                key={type.type}
                onClick={() => addSection(type.type as ReportSection["type"])}
                className="w-full p-3 text-left rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-white transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {type.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>

          {/* Page Settings */}
          <div className="mt-6 p-3 bg-white rounded-lg border-2 border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-3">
              Page Options
            </h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.includeHeader}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      includeHeader: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span>Include Header</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.includeFooter}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      includeFooter: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span>Include Footer</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.includeTOC}
                  onChange={(e) =>
                    setSettings({ ...settings, includeTOC: e.target.checked })
                  }
                  className="rounded"
                />
                <span>Table of Contents</span>
              </label>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
          {sections.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl text-gray-400 mb-2">👈</p>
                <p className="text-lg font-semibold text-gray-600 mb-1">
                  Start building your report
                </p>
                <p className="text-sm text-gray-500">
                  Add sections from the toolbox on the left
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-w-4xl mx-auto">
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section, index) => {
                  const typeInfo = sectionTypes.find(
                    (t) => t.type === section.type,
                  );
                  const isSelected = selectedSection === section.id;

                  return (
                    <div
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 shadow-lg"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{typeInfo?.icon}</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  title: e.target.value,
                                })
                              }
                              className="text-lg font-semibold text-gray-800 border-2 border-transparent hover:border-gray-200 focus:border-blue-500 rounded px-2 py-1 outline-none w-full"
                              placeholder="Section title..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {typeInfo?.label}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSection(section.id, "up");
                            }}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▲
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSection(section.id, "down");
                            }}
                            disabled={index === sections.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            ▼
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSection(section.id);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 ml-2"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Section preview based on type */}
                      <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-xs text-gray-500 italic">
                          {section.type === "table" &&
                            "Data table will appear here"}
                          {section.type === "chart" &&
                            "Chart visualization will appear here"}
                          {section.type === "summary" &&
                            "Summary statistics will appear here"}
                          {section.type === "header" &&
                            "Report header with title and metadata"}
                          {section.type === "timeline" &&
                            "Timeline of events will appear here"}
                          {section.type === "checklist" &&
                            "Compliance checklist items"}
                          {section.type === "text" && "Free-form text content"}
                          {section.type === "image" &&
                            "Image or diagram placeholder"}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Properties Panel */}
        {selectedSectionData && (
          <div className="w-80 bg-gray-50 border-l-2 border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700">
                Section Properties
              </h3>
              <button
                onClick={() => setSelectedSection(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={selectedSectionData.title}
                  onChange={(e) =>
                    updateSection(selectedSectionData.id, {
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSectionData.config.showTitle}
                    onChange={(e) =>
                      updateSection(selectedSectionData.id, {
                        config: {
                          ...selectedSectionData.config,
                          showTitle: e.target.checked,
                        },
                      })
                    }
                    className="rounded"
                  />
                  <span>Show Title</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Font Size
                </label>
                <select
                  value={selectedSectionData.config.fontSize}
                  onChange={(e) =>
                    updateSection(selectedSectionData.id, {
                      config: {
                        ...selectedSectionData.config,
                        fontSize: e.target.value as
                          | "small"
                          | "medium"
                          | "large",
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alignment
                </label>
                <select
                  value={selectedSectionData.config.alignment}
                  onChange={(e) =>
                    updateSection(selectedSectionData.id, {
                      config: {
                        ...selectedSectionData.config,
                        alignment: e.target.value as
                          | "left"
                          | "center"
                          | "right",
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              {selectedSectionData.type === "table" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Columns
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedSectionData.config.columns}
                    onChange={(e) =>
                      updateSection(selectedSectionData.id, {
                        config: {
                          ...selectedSectionData.config,
                          columns: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
