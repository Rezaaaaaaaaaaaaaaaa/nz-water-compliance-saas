'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen, Video, Mail, MessageCircle, FileText, HelpCircle, Search, Zap } from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
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
            Support Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers, tutorials, and resources to help you get the most out of FlowComply
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: BookOpen,
              title: 'Documentation',
              description: 'Complete guides and API references',
              href: '/docs',
              color: 'blue'
            },
            {
              icon: Video,
              title: 'Video Tutorials',
              description: 'Step-by-step video guides',
              href: '#tutorials',
              color: 'purple'
            },
            {
              icon: Mail,
              title: 'Contact Support',
              description: 'Get help from our team',
              href: '/contact',
              color: 'green'
            },
            {
              icon: MessageCircle,
              title: 'Community Forum',
              description: 'Connect with other users',
              href: '#forum',
              color: 'orange'
            }
          ].map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 group"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${item.color}-100 text-${item.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: 'How do I get started with FlowComply?',
                answer: 'After registering, you can start by creating your organization profile, adding team members, and importing existing DWSPs. Our onboarding wizard will guide you through the initial setup process.'
              },
              {
                question: 'Can I import existing compliance data?',
                answer: 'Yes! FlowComply supports CSV imports for assets, water quality data, and other compliance records. You can also manually upload existing DWSP documents for AI analysis.'
              },
              {
                question: 'How does the AI compliance assistant work?',
                answer: 'Our AI assistant is trained on Taumata Arowai regulations and can answer questions about compliance requirements, analyze DWSP documents, and detect water quality anomalies using Claude AI technology.'
              },
              {
                question: 'Is FlowComply approved by Taumata Arowai?',
                answer: 'FlowComply is designed to meet all Taumata Arowai requirements and DWQAR compliance rules. While the platform itself is not "approved," it helps you maintain compliant records and processes that meet regulatory standards.'
              },
              {
                question: 'How do I add team members?',
                answer: 'Go to Settings > Team Members and click "Invite User." You can assign roles (Admin, Manager, Inspector, Auditor, or Viewer) to control access levels for each team member.'
              },
              {
                question: 'Can I export my compliance data?',
                answer: 'Absolutely. FlowComply provides CSV exports for all data types, including assets, water quality results, compliance plans, and reports. You can also generate PDF reports for submission to regulators.'
              },
              {
                question: 'What happens to my data if I cancel?',
                answer: 'You have 30 days after cancellation to export all your data. After that period, data is retained for 7 years in compliance with DWQAR requirements but is no longer accessible through the platform interface.'
              },
              {
                question: 'How secure is my data?',
                answer: 'We use enterprise-grade security including end-to-end encryption, secure cloud storage (AWS S3), role-based access controls, and comprehensive audit logging. All data is encrypted both in transit and at rest.'
              },
              {
                question: 'Do you offer training?',
                answer: 'Yes! We provide comprehensive onboarding training, video tutorials, documentation, and ongoing support. Enterprise customers receive dedicated training sessions for their teams.'
              },
              {
                question: 'How often are regulations updated in the system?',
                answer: 'We review Taumata Arowai regulations quarterly and update the platform immediately when significant changes occur. You\'ll receive notifications about regulatory updates that affect your compliance work.'
              },
              {
                question: 'Can I use FlowComply offline?',
                answer: 'FlowComply is a cloud-based platform that requires an internet connection. However, you can export reports and data for offline viewing, and we\'re working on offline capabilities for field inspections.'
              },
              {
                question: 'What browsers are supported?',
                answer: 'FlowComply works best on modern browsers including Chrome, Firefox, Safari, and Edge (latest versions). We recommend keeping your browser up to date for the best experience and security.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <HelpCircle className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Getting Started Guide
          </h2>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-8">
              {[
                {
                  step: 1,
                  title: 'Create Your Account',
                  description: 'Sign up and set up your organization profile with basic information about your water utility.'
                },
                {
                  step: 2,
                  title: 'Add Assets & Infrastructure',
                  description: 'Import or manually add your water supply assets, treatment plants, and distribution networks.'
                },
                {
                  step: 3,
                  title: 'Upload or Create DWSPs',
                  description: 'Import existing Drinking Water Safety Plans or create new ones using our structured builder.'
                },
                {
                  step: 4,
                  title: 'Set Up Monitoring',
                  description: 'Configure water quality monitoring schedules and set up automated alerts for compliance deadlines.'
                },
                {
                  step: 5,
                  title: 'Invite Your Team',
                  description: 'Add team members and assign appropriate roles for collaborative compliance management.'
                },
                {
                  step: 6,
                  title: 'Explore AI Features',
                  description: 'Try the AI compliance assistant, DWSP analyzer, and water quality anomaly detection tools.'
                }
              ].map((item) => (
                <div key={item.step} className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Additional Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'User Guide',
                description: 'Comprehensive documentation covering all features and workflows',
                link: '/docs'
              },
              {
                icon: Zap,
                title: 'Quick Start Checklist',
                description: 'Essential tasks to complete in your first week',
                link: '#checklist'
              },
              {
                icon: Search,
                title: 'Knowledge Base',
                description: 'Searchable articles and troubleshooting guides',
                link: '#kb'
              }
            ].map((resource, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                <resource.icon className="h-8 w-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                <Link href={resource.link} className="text-blue-600 hover:underline text-sm font-medium">
                  Learn more →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Our support team is here to help. Get in touch and we'll respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Support
            </Link>
            <Link
              href="/demo/dashboard"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium"
            >
              Try Demo
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
