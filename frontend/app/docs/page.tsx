'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Code, Users, Shield, FileText, Database, Bell, BarChart3, Sparkles } from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <FlowComplyLogo size="md" />
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete guides, API references, and resources for FlowComply
          </p>
        </div>

        {/* Quick Start */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              New to FlowComply?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start with our interactive demo to see the platform in action, or jump into the getting started guide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/demo/dashboard"
                className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
              >
                Try Interactive Demo
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium"
              >
                Getting Started Guide
              </Link>
            </div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Documentation Sections
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'DWSP Management',
                description: 'Learn how to create, manage, and submit Drinking Water Safety Plans',
                topics: ['Creating DWSPs', '12 DWSP Elements', 'Submission Workflow', 'Version Control']
              },
              {
                icon: Database,
                title: 'Asset Management',
                description: 'Track and monitor your water infrastructure and assets',
                topics: ['Adding Assets', 'Risk Classification', 'GPS Coordinates', 'Condition Monitoring']
              },
              {
                icon: FileText,
                title: 'Document Control',
                description: 'Manage compliance documents with version control and retention',
                topics: ['Uploading Documents', 'Document Categories', '7-Year Retention', 'Search & Filters']
              },
              {
                icon: BarChart3,
                title: 'Analytics & Reporting',
                description: 'Generate reports and analyze compliance metrics',
                topics: ['Compliance Scoring', 'Custom Reports', 'Data Export', 'Dashboard Widgets']
              },
              {
                icon: Bell,
                title: 'Notifications',
                description: 'Set up alerts and reminders for compliance deadlines',
                topics: ['Email Notifications', 'Deadline Reminders', 'Alert Rules', 'Notification Preferences']
              },
              {
                icon: Users,
                title: 'User Management',
                description: 'Add team members and manage roles and permissions',
                topics: ['Adding Users', 'Role Types', 'Permissions', 'Multi-Tenancy']
              },
              {
                icon: Sparkles,
                title: 'AI Features',
                description: 'Use AI-powered tools for compliance assistance',
                topics: ['AI Assistant', 'DWSP Analyzer', 'Water Quality AI', 'Anomaly Detection']
              },
              {
                icon: Code,
                title: 'API Reference',
                description: 'Integrate FlowComply with your existing systems',
                topics: ['Authentication', 'Endpoints', 'Rate Limits', 'Webhooks']
              },
              {
                icon: BookOpen,
                title: 'Best Practices',
                description: 'Tips and guidelines for effective compliance management',
                topics: ['DWSP Templates', 'Data Entry Tips', 'Workflow Optimization', 'Compliance Checklists']
              }
            ].map((section, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4">
                  <section.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{section.description}</p>
                <ul className="space-y-1">
                  {section.topics.map((topic, tIndex) => (
                    <li key={tIndex} className="text-sm text-gray-600">
                      • {topic}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* API Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            API Reference
          </h2>
          <div className="bg-gray-50 rounded-xl p-8">
            <div className="flex items-start mb-6">
              <Code className="h-8 w-8 text-blue-600 mr-4 mt-1" />
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">REST API Documentation</h3>
                <p className="text-gray-700 mb-4">
                  FlowComply provides a comprehensive REST API for integrating compliance data with your existing systems.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">API Base URL</h4>
              <code className="block bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
                http://localhost:3000/api/v1
              </code>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Authentication</h4>
                <p className="text-sm text-gray-600">JWT token-based authentication with secure API keys</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Rate Limits</h4>
                <p className="text-sm text-gray-600">100 requests per minute for standard plans</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Data Format</h4>
                <p className="text-sm text-gray-600">JSON request and response bodies</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Endpoints</h4>
                <p className="text-sm text-gray-600">60+ endpoints covering all features</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="http://localhost:3000/api/v1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View API Docs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Request API Access
              </Link>
            </div>
          </div>
        </section>

        {/* Regulatory References */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Regulatory References
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Taumata Arowai Resources</h3>
              <p className="text-gray-700 mb-4">
                Official resources from New Zealand's water services regulator
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  <a
                    href="https://www.taumataarowai.govt.nz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Taumata Arowai Official Website →
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.taumataarowai.govt.nz/for-water-suppliers/drinking-water-safety-plans/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    DWSP Guidelines →
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.legislation.govt.nz/act/public/2021/0007/latest/LMS351697.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Water Services Act 2021 →
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">DWQAR Compliance</h3>
              <p className="text-gray-700 mb-4">
                Drinking Water Quality Assurance Rules compliance information
              </p>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>• 12 mandatory DWSP elements</li>
                <li>• 7-year record retention requirements</li>
                <li>• Multi-barrier approach validation</li>
                <li>• Monitoring and reporting obligations</li>
                <li>• Audit log requirements</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Need Help?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Check our support center or contact us directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/support"
              className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Visit Support Center
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors text-lg font-medium"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="/docs" className="hover:text-white">Documentation</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} FlowComply - NZ Water Compliance Management</p>
        </div>
      </footer>
    </div>
  );
}
