'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Users, Zap, Heart, Target, Award } from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function AboutPage() {
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

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            About FlowComply
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Modern compliance management software built specifically for New Zealand water utilities
            to meet Taumata Arowai regulatory requirements.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              To simplify water compliance management, making it easier for New Zealand utilities to ensure
              safe drinking water for their communities while meeting all regulatory requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              FlowComply was created in response to the Water Services Act 2021 and the establishment
              of Taumata Arowai as New Zealand's dedicated water services regulator. We recognized that
              water utilities needed modern, purpose-built tools to manage the complex compliance
              requirements introduced by this new regulatory framework.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our platform brings together all aspects of water compliance management — from Drinking
              Water Safety Plans (DWSPs) to asset management, document control, and reporting — in
              one integrated system. We've incorporated AI-powered features to help compliance teams
              work more efficiently and catch potential issues earlier.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Today, FlowComply serves water utilities across New Zealand, helping them protect public
              health through better compliance management.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Our Core Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Public Safety First',
                description: 'We prioritize the safety of New Zealand communities by helping utilities maintain the highest compliance standards.'
              },
              {
                icon: Users,
                title: 'User-Centered Design',
                description: 'We build tools that compliance professionals actually want to use, making their work easier and more effective.'
              },
              {
                icon: Zap,
                title: 'Continuous Innovation',
                description: 'We leverage AI and modern technology to continuously improve compliance workflows and catch issues earlier.'
              },
              {
                icon: Heart,
                title: 'Customer Success',
                description: 'Your success is our success. We provide dedicated support to ensure you get maximum value from FlowComply.'
              },
              {
                icon: Target,
                title: 'Regulatory Excellence',
                description: 'We stay current with all Taumata Arowai requirements and regulatory changes to keep you compliant.'
              },
              {
                icon: Award,
                title: 'Quality & Reliability',
                description: 'We maintain high standards for data security, system uptime, and accuracy you can depend on.'
              }
            ].map((value, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Built for NZ Regulatory Requirements
          </h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Water Services Act 2021</h3>
                <p className="text-gray-700">
                  FlowComply is built to support compliance with the Water Services Act 2021, which
                  established new standards for drinking water safety in New Zealand.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Taumata Arowai Regulations</h3>
                <p className="text-gray-700">
                  Our platform implements all requirements from Taumata Arowai, including DWSP
                  management, monitoring protocols, and reporting obligations.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Drinking Water Quality Assurance Rules (DWQAR)</h3>
                <p className="text-gray-700">
                  We ensure full compliance with DWQAR requirements, including comprehensive audit
                  logging, document retention, and quality assurance processes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Modern Technology Stack
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Features</h3>
              <p className="text-gray-700 mb-4">
                We leverage Claude AI by Anthropic to provide intelligent compliance assistance,
                automated DWSP analysis, and water quality anomaly detection.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 24/7 AI compliance assistant</li>
                <li>• Automated document analysis</li>
                <li>• Intelligent water quality monitoring</li>
                <li>• Proactive compliance recommendations</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Infrastructure</h3>
              <p className="text-gray-700 mb-4">
                Built on modern, scalable cloud infrastructure with enterprise-grade security
                and reliability.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 99.9% uptime SLA</li>
                <li>• End-to-end encryption</li>
                <li>• Secure cloud storage (AWS S3)</li>
                <li>• Automated backups & disaster recovery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Learn More?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            See how FlowComply can help your organization meet all Taumata Arowai requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              Contact Us
            </Link>
            <Link
              href="/demo/dashboard"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium"
            >
              Try Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} FlowComply - NZ Water Compliance Management
          </p>
        </div>
      </footer>
    </div>
  );
}
