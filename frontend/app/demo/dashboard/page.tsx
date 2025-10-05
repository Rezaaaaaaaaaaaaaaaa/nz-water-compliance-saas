'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Database,
  FileText,
  Shield,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Activity,
  ArrowLeft,
  Download,
  Calendar
} from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

// Sample demo data
const demoData = {
  complianceScore: 94,
  assets: {
    total: 156,
    critical: 12,
    high: 28,
    medium: 64,
    low: 52
  },
  dwsps: {
    active: 24,
    submitted: 18,
    draft: 6
  },
  documents: {
    total: 342,
    thisMonth: 28
  },
  recentActivity: [
    { id: 1, type: 'DWSP', action: 'Submitted', item: 'Auckland Central DWSP Q4', time: '2 hours ago' },
    { id: 2, type: 'Asset', action: 'Updated', item: 'Water Treatment Plant #3', time: '5 hours ago' },
    { id: 3, type: 'Document', action: 'Uploaded', item: 'Monthly Report - September', time: '1 day ago' },
    { id: 4, type: 'Alert', action: 'Resolved', item: 'Chlorine level below threshold', time: '2 days ago' }
  ],
  criticalAssets: [
    { id: 1, name: 'Main Reservoir A', risk: 'CRITICAL', lastInspection: '2024-09-15', status: 'Needs Attention' },
    { id: 2, name: 'Treatment Plant #1', risk: 'CRITICAL', lastInspection: '2024-09-20', status: 'Good' },
    { id: 3, name: 'Pump Station B', risk: 'HIGH', lastInspection: '2024-09-18', status: 'Fair' }
  ],
  upcomingDeadlines: [
    { id: 1, title: 'Q4 DWSP Submission', date: '2024-10-15', daysLeft: 10 },
    { id: 2, title: 'Monthly Water Quality Report', date: '2024-10-05', daysLeft: 0 },
    { id: 3, title: 'Annual Asset Inspection', date: '2024-10-20', daysLeft: 15 }
  ]
};

export default function DemoDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5" />
            <span className="font-medium">Demo Mode - Explore with sample data</span>
          </div>
          <Link href="/" className="flex items-center space-x-2 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <FlowComplyLogo size="md" />
              <span className="text-sm text-gray-500 border-l pl-3">Demo</span>
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-gray-900">
                <Users className="h-5 w-5" />
              </button>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-116px)]">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'assets' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Database className="h-5 w-5" />
              <span className="font-medium">Assets</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'documents' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('compliance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'compliance' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium">Compliance</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="font-medium">Analytics</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{demoData.complianceScore}%</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Compliance Score</h3>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${demoData.complianceScore}%`}}></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{demoData.assets.total}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Total Assets</h3>
                  <p className="mt-2 text-xs text-gray-500">{demoData.assets.critical} critical</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{demoData.dwsps.active}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Active DWSPs</h3>
                  <p className="mt-2 text-xs text-gray-500">{demoData.dwsps.submitted} submitted</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{demoData.documents.total}</span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600">Documents</h3>
                  <p className="mt-2 text-xs text-gray-500">{demoData.documents.thisMonth} this month</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Critical Assets */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Critical Assets</h2>
                  <div className="space-y-3">
                    {demoData.criticalAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{asset.name}</h3>
                          <p className="text-sm text-gray-500">Last inspection: {asset.lastInspection}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            asset.risk === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {asset.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
                  <div className="space-y-3">
                    {demoData.upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                            <p className="text-sm text-gray-500">{deadline.date}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          deadline.daysLeft === 0 ? 'bg-red-100 text-red-700' :
                          deadline.daysLeft < 7 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {deadline.daysLeft === 0 ? 'Today' : `${deadline.daysLeft} days`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {demoData.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'DWSP' ? 'bg-purple-100' :
                        activity.type === 'Asset' ? 'bg-blue-100' :
                        activity.type === 'Document' ? 'bg-orange-100' :
                        'bg-red-100'
                      }`}>
                        {activity.type === 'DWSP' && <Shield className="h-4 w-4 text-purple-600" />}
                        {activity.type === 'Asset' && <Database className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'Document' && <FileText className="h-4 w-4 text-orange-600" />}
                        {activity.type === 'Alert' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action} <span className="text-gray-600">{activity.item}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assets Tab */}
          {activeTab === 'assets' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 mb-4">
                  Track and manage all water infrastructure assets with risk-based classification.
                </p>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{demoData.assets.critical}</div>
                    <div className="text-sm text-gray-600">Critical</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{demoData.assets.high}</div>
                    <div className="text-sm text-gray-600">High</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{demoData.assets.medium}</div>
                    <div className="text-sm text-gray-600">Medium</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{demoData.assets.low}</div>
                    <div className="text-sm text-gray-600">Low</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Main Reservoir A', type: 'Reservoir', risk: 'CRITICAL', location: 'Auckland Central' },
                    { name: 'Treatment Plant #1', type: 'Treatment', risk: 'CRITICAL', location: 'North Shore' },
                    { name: 'Pump Station B', type: 'Pump Station', risk: 'HIGH', location: 'Waitakere' },
                    { name: 'Distribution Main 42', type: 'Pipeline', risk: 'MEDIUM', location: 'CBD' },
                    { name: 'Storage Tank C', type: 'Storage', risk: 'LOW', location: 'East Auckland' }
                  ].map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{asset.name}</h3>
                        <p className="text-sm text-gray-500">{asset.type} • {asset.location}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        asset.risk === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        asset.risk === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        asset.risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {asset.risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 mb-6">
                  Secure document storage with version control and 7-year retention.
                </p>
                <div className="space-y-3">
                  {[
                    { name: 'Q4 Compliance Report.pdf', type: 'Report', size: '2.4 MB', uploaded: '2024-09-30' },
                    { name: 'Asset Inspection Checklist.xlsx', type: 'Checklist', size: '156 KB', uploaded: '2024-09-28' },
                    { name: 'DWSP Auckland Central.docx', type: 'DWSP', size: '1.8 MB', uploaded: '2024-09-25' },
                    { name: 'Water Quality Test Results.csv', type: 'Data', size: '89 KB', uploaded: '2024-09-20' },
                    { name: 'Emergency Response Plan.pdf', type: 'Plan', size: '3.2 MB', uploaded: '2024-09-15' }
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-500">{doc.type} • {doc.size} • Uploaded {doc.uploaded}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Compliance Plans</h1>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <p className="text-gray-600 mb-6">
                  Manage all 12 mandatory DWSP elements for regulatory compliance.
                </p>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{demoData.dwsps.submitted}</div>
                    <div className="text-sm text-gray-600 mt-1">Submitted DWSPs</div>
                  </div>
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{demoData.dwsps.draft}</div>
                    <div className="text-sm text-gray-600 mt-1">Draft DWSPs</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'Auckland Central DWSP', status: 'Submitted', elements: 12, lastUpdate: '2024-09-30' },
                    { name: 'North Shore DWSP', status: 'Submitted', elements: 12, lastUpdate: '2024-09-28' },
                    { name: 'Waitakere DWSP', status: 'Draft', elements: 10, lastUpdate: '2024-09-25' },
                    { name: 'East Auckland DWSP', status: 'Draft', elements: 8, lastUpdate: '2024-09-20' }
                  ].map((dwsp, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{dwsp.name}</h3>
                        <p className="text-sm text-gray-500">{dwsp.elements}/12 elements • Updated {dwsp.lastUpdate}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        dwsp.status === 'Submitted' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {dwsp.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trend</h3>
                  <div className="space-y-3">
                    {[
                      { month: 'September', score: 94 },
                      { month: 'August', score: 91 },
                      { month: 'July', score: 88 }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{item.month}</span>
                          <span className="font-medium text-gray-900">{item.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: `${item.score}%`}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reservoirs</span>
                      <span className="font-medium">28</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Treatment Plants</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pump Stations</span>
                      <span className="font-medium">45</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pipelines</span>
                      <span className="font-medium">71</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Uploads This Month</span>
                      <span className="font-medium">{demoData.documents.thisMonth}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Storage</span>
                      <span className="font-medium">4.2 GB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Most Active User</span>
                      <span className="font-medium">J. Smith</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTA at bottom */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-blue-100 mb-6">
              Sign up now to access the full platform with your own data
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Start Free Trial
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
