'use client';

import { useState } from 'react';
import { Bot, FileText, Droplets, BarChart3, MessageSquare, Sparkles } from 'lucide-react';
import { AIChatWidget } from '@/components/ai-chat-widget';
import { DWSPAnalyzer } from '@/components/dwsp-analyzer';
import { AIUsageDashboard } from '@/components/ai-usage-dashboard';

type TabType = 'overview' | 'chat' | 'dwsp' | 'usage';

export default function AIFeaturesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chatOpen, setChatOpen] = useState(false);

  const features = [
    {
      id: 'chat' as TabType,
      icon: MessageSquare,
      title: 'AI Compliance Assistant',
      description: 'Ask questions about Taumata Arowai regulations and get instant, context-aware answers.',
      color: 'blue',
      benefits: [
        'Instant answers to compliance questions',
        'Organization-specific guidance',
        'Regulation citations and explanations',
        'Available 24/7',
      ],
    },
    {
      id: 'dwsp' as TabType,
      icon: FileText,
      title: 'DWSP Document Analyzer',
      description: 'AI-powered analysis of your Drinking Water Safety Plans for completeness and compliance.',
      color: 'green',
      benefits: [
        'Checks all 12 mandatory elements',
        'Identifies missing sections',
        'Severity-ranked recommendations',
        'Compliance risk assessment',
      ],
    },
    {
      id: 'water-quality' as TabType,
      icon: Droplets,
      title: 'Water Quality Analysis',
      description: 'Intelligent anomaly detection and trend analysis for water quality test results.',
      color: 'purple',
      benefits: [
        'E. coli and pathogen detection alerts',
        'pH and chlorine monitoring',
        'Trend identification',
        'Regulatory exceedance warnings',
      ],
    },
    {
      id: 'usage' as TabType,
      icon: BarChart3,
      title: 'Usage Dashboard',
      description: 'Monitor your AI feature usage, quota, and costs in real-time.',
      color: 'yellow',
      benefits: [
        'Track requests and tokens',
        'Monitor monthly costs',
        'Feature usage breakdown',
        'Quota management',
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-100' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', hover: 'hover:bg-yellow-100' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Features</h1>
          <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Powered by Claude
          </span>
        </div>
        <p className="text-gray-600 text-lg">
          Enhance your compliance workflow with AI-powered analysis, insights, and assistance.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('dwsp')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'dwsp'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            DWSP Analyzer
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'usage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Usage & Quota
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              const colors = getColorClasses(feature.color);
              return (
                <div
                  key={feature.id}
                  className={`border rounded-lg p-6 ${colors.border} ${colors.bg} ${colors.hover} transition-all cursor-pointer`}
                  onClick={() => setActiveTab(feature.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-white ${colors.border} border`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 ${colors.text}`}>
                        {feature.title}
                      </h3>
                      <p className="text-gray-700 mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className={`${colors.text} font-bold`}>•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`mt-4 px-4 py-2 ${colors.text} font-semibold rounded-lg border ${colors.border} bg-white hover:bg-opacity-50 transition-colors`}
                      >
                        Try {feature.title} →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Why Use AI Features?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">⚡ Save Time</h3>
                <p className="text-blue-100">
                  Reduce compliance work from hours to minutes. AI analysis provides instant insights.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">🎯 Improve Accuracy</h3>
                <p className="text-blue-100">
                  Catch issues early with AI-powered analysis. Never miss a mandatory element.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">💰 Cost Effective</h3>
                <p className="text-blue-100">
                  Starting at $10/month. Saves ~10 hours/week = $2,000/month value.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Quick Start Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <h4 className="font-semibold mb-2">1. Try the AI Assistant</h4>
                <p className="text-gray-600 text-sm">
                  Click the chat icon in the bottom right or navigate to the AI Assistant tab to ask your first compliance question.
                </p>
              </div>
              <div className="border-l-4 border-green-600 pl-4">
                <h4 className="font-semibold mb-2">2. Analyze Your DWSP</h4>
                <p className="text-gray-600 text-sm">
                  Upload your DWSP document to get instant feedback on completeness and compliance.
                </p>
              </div>
              <div className="border-l-4 border-purple-600 pl-4">
                <h4 className="font-semibold mb-2">3. Monitor Usage</h4>
                <p className="text-gray-600 text-sm">
                  Check your usage dashboard to track requests, tokens, and costs throughout the month.
                </p>
              </div>
              <div className="border-l-4 border-yellow-600 pl-4">
                <h4 className="font-semibold mb-2">4. Upgrade if Needed</h4>
                <p className="text-gray-600 text-sm">
                  If you hit quota limits, upgrade to BASIC or PREMIUM for more capacity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'chat' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Compliance Assistant</h2>
              <p className="text-gray-600 mt-1">
                Ask questions about regulations, requirements, or your organization's compliance status
              </p>
            </div>
            <button
              onClick={() => setChatOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Open Chat
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Example Questions:</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="cursor-pointer hover:underline">
                • What are the E. coli testing requirements for my water supply?
              </li>
              <li className="cursor-pointer hover:underline">
                • How do I create a compliant DWSP?
              </li>
              <li className="cursor-pointer hover:underline">
                • What should I do if I detect E. coli in treated water?
              </li>
              <li className="cursor-pointer hover:underline">
                • When is my DWQAR submission due?
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'dwsp' && <DWSPAnalyzer />}

      {activeTab === 'usage' && <AIUsageDashboard />}

      {/* Floating Chat Widget */}
      <AIChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
