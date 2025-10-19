'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 mb-8">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Important Notice</h3>
              <p className="text-gray-700 text-sm">
                Please read these Terms of Service carefully before using FlowComply. By accessing or using
                our platform, you agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By registering for, accessing, or using FlowComply ("the Service"), you agree to comply with and
              be legally bound by these Terms of Service and our Privacy Policy. If you do not agree to these
              terms, please do not use our Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              FlowComply provides a cloud-based water compliance management platform designed to help New Zealand
              water utilities meet Taumata Arowai regulatory requirements. The Service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Drinking Water Safety Plan (DWSP) management</li>
              <li>Asset and infrastructure tracking</li>
              <li>Document management and storage</li>
              <li>Compliance reporting and analytics</li>
              <li>AI-powered compliance assistance</li>
              <li>Water quality monitoring and alerts</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.1 Registration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use FlowComply, you must register an account and provide accurate, complete information.
              You are responsible for maintaining the confidentiality of your account credentials.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">3.2 Authorized Use</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You may only use the Service for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Use the Service in any way that violates applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated means to access the Service without permission</li>
              <li>Share your account with unauthorized persons</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data and Content</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 Your Data</h3>
            <p className="text-gray-700 leading-relaxed">
              You retain all rights to the compliance data and content you upload to FlowComply. You grant us
              permission to store, process, and display your data solely for the purpose of providing the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Data Accuracy</h3>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for the accuracy and completeness of data you input into the Service.
              FlowComply is a tool to help manage compliance but does not replace your obligation to ensure
              regulatory compliance.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.3 Backup and Export</h3>
            <p className="text-gray-700 leading-relaxed">
              While we maintain regular backups, you are responsible for maintaining your own backups of critical
              data. You can export your data at any time using our export features.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Fees and Payment</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              FlowComply is a paid service with pricing based on your organization's needs. Terms include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Fees are outlined in your subscription agreement</li>
              <li>Payment is required in advance on a monthly or annual basis</li>
              <li>Failure to pay may result in service suspension</li>
              <li>We reserve the right to change prices with 30 days notice</li>
              <li>Refunds are provided according to our refund policy</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed">
              We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. We may perform
              scheduled maintenance and will provide advance notice when possible. We are not liable for
              service interruptions beyond our reasonable control.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              FlowComply and all associated software, features, and content (excluding your data) are the
              property of FlowComply and protected by copyright, trademark, and other laws. You may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Copy, modify, or create derivative works of the Service</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Remove or alter any proprietary notices</li>
              <li>Use our trademarks without written permission</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT
              WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED. YOUR USE OF THE SERVICE IS AT YOUR
              OWN RISK. FLOWCOMPLY IS A COMPLIANCE MANAGEMENT TOOL AND DOES NOT PROVIDE LEGAL OR REGULATORY
              ADVICE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FLOWCOMPLY SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
              INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Regulatory Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              While FlowComply is designed to help manage compliance with Taumata Arowai and Water Services
              Act 2021 requirements, you remain solely responsible for ensuring your organization's compliance
              with all applicable laws and regulations. FlowComply is a tool to assist compliance management
              but does not guarantee regulatory compliance.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Either party may terminate this agreement:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>We may suspend or terminate your account for violations of these Terms</li>
              <li>We may discontinue the Service with 90 days notice</li>
              <li>Upon termination, you may export your data within 30 days</li>
              <li>Data retention follows our Privacy Policy and regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. Material changes will be notified via email or through
              the Service. Your continued use of FlowComply after changes constitutes acceptance of the
              modified Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of New Zealand. Any disputes shall be resolved in
              New Zealand courts.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@flowcomply.com</p>
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
