'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Recommendation {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  recommendation: string;
}

interface AnalysisResult {
  completenessScore: number;
  missingElements: string[];
  recommendations: Recommendation[];
  strengths: string[];
  complianceRisks: string[];
  summary: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
  };
}

export function DWSPAnalyzer() {
  const [documentContent, setDocumentContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocumentContent(content);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!documentContent.trim()) {
      setError('Please provide document content');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/analyze-dwsp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          documentContent,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('AI quota exceeded. Please upgrade your plan.');
        }
        throw new Error('Failed to analyze document');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <Info className="w-5 h-5" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-700';
    if (score >= 75) return 'text-blue-700';
    if (score >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-600" />
          DWSP Document Analyzer
        </h2>
        <p className="text-gray-600 mb-4">
          Upload or paste your Drinking Water Safety Plan (DWSP) document for AI-powered compliance analysis.
          The AI will check all 12 mandatory elements and provide recommendations.
        </p>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document (TXT, MD, or plain text)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                Choose File
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-gray-500">or paste text below</span>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Content
            </label>
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Paste your DWSP document content here..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
            <p className="text-xs text-gray-500 mt-1">
              {documentContent.length.toLocaleString()} characters
              {documentContent.length > 60000 && (
                <span className="text-yellow-600 ml-2">
                  (Will be truncated to 60,000 characters for analysis)
                </span>
              )}
            </p>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!documentContent.trim() || isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing... (this may take 5-10 seconds)
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Analyze DWSP
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Analysis Results</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-2">Completeness Score</p>
                <p className={`text-5xl font-bold ${getScoreColor(result.completenessScore)}`}>
                  {result.completenessScore}
                  <span className="text-2xl text-gray-400">/100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Analysis Cost</p>
                <p className="text-lg font-semibold text-gray-800">
                  ${(result.usage.estimatedCost / 100).toFixed(3)}
                </p>
                <p className="text-xs text-gray-500">
                  {result.usage.inputTokens + result.usage.outputTokens} tokens
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-3">Executive Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{result.summary}</p>
          </div>

          {/* Missing Elements */}
          {result.missingElements.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Missing Elements ({result.missingElements.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-red-700">
                {result.missingElements.map((element, index) => (
                  <li key={index}>{element}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4">
                Recommendations ({result.recommendations.length})
              </h3>
              <div className="space-y-4">
                {result.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getSeverityColor(rec.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(rec.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{rec.category}</p>
                          <span className="text-xs uppercase px-2 py-1 rounded bg-white bg-opacity-50">
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-sm mb-2">
                          <strong>Issue:</strong> {rec.issue}
                        </p>
                        <p className="text-sm">
                          <strong>Recommendation:</strong> {rec.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-green-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Strengths ({result.strengths.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                {result.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Compliance Risks */}
          {result.complianceRisks.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Compliance Risks ({result.complianceRisks.length})
              </h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                {result.complianceRisks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
