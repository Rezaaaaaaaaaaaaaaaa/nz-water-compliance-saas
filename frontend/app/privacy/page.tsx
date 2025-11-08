
'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function PrivacyPolicyPage() {
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              FlowComply ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our water
              compliance management platform.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you register for FlowComply, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>Name and email address</li>
              <li>Organization name and details</li>
              <li>Job title and role</li>
              <li>Password (encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Compliance Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To provide our compliance management services, we process:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Drinking Water Safety Plans (DWSPs)</li>
              <li>Water quality test results and monitoring data</li>
              <li>Asset information and infrastructure details</li>
              <li>Compliance documents and reports</li>
              <li>Audit logs and system activity</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Usage Information</h3>
            <p className="text-gray-700 leading-relaxed">
              We automatically collect information about how you interact with our platform, including
              IP addresses, browser type, device information, and pages visited.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide and maintain our compliance management services</li>
              <li>Process and analyze compliance data</li>
              <li>Send notifications about compliance deadlines and system updates</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Improve our platform and develop new features</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations and regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
              <div className="flex items-start">
                <Shield className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Enterprise-Grade Security</h3>
                  <p className="text-gray-700 text-sm">
                    We implement comprehensive security measures to protect your data, including encryption,
                    access controls, and regular security audits.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our security measures include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>End-to-end encryption for data in transit (TLS 1.3)</li>
              <li>Encryption at rest for all stored data</li>
              <li>Multi-factor authentication options</li>
              <li>Role-based access controls</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Automated backup and disaster recovery procedures</li>
              <li>Audit logging of all system access and changes</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In compliance with the Drinking Water Quality Assurance Rules (DWQAR) and other regulations:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Compliance records and audit logs are retained for a minimum of 7 years</li>
              <li>Water quality monitoring data is retained as required by Taumata Arowai</li>
              <li>Account information is retained while your subscription is active and for a reasonable period thereafter</li>
              <li>You may request deletion of your personal information, subject to legal retention requirements</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>With your organization:</strong> Data is shared with authorized users within your organization</li>
              <li><strong>Service providers:</strong> We use trusted third-party services for hosting (AWS), email, and analytics</li>
              <li><strong>Regulatory authorities:</strong> When required by law or regulation (e.g., Taumata Arowai)</li>
              <li><strong>Legal requirements:</strong> To comply with valid legal processes or protect our rights</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Under New Zealand privacy law, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Export your compliance data</li>
              <li>Object to certain processing activities</li>
              <li>Lodge a complaint with the Privacy Commissioner</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@flowcomply.com" className="text-blue-600 hover:underline">
                privacy@flowcomply.com
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies to maintain your session and remember your preferences. We also use
              analytics cookies to understand how users interact with our platform and improve our services.
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date. Your
              continued use of FlowComply after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@flowcomply.com</p>
              <p className="text-gray-700 mb-2"><strong>Website:</strong> flowcomply.com</p>
              <p className="text-gray-700"><strong>Location:</strong> New Zealand</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <div className="flex justify-center space-x-6 mb-4">
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} FlowComply - NZ Water Compliance Management</p>
        </div>
      </footer>
    </div>
  );
}
