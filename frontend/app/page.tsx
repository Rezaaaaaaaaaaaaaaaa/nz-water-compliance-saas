'use client';

import Link from 'next/link';
import {
  Shield,
  FileText,
  BarChart3,
  Bell,
  Users,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  Zap,
  Lock,
  TrendingUp,
  Clock,
  Database,
  Award
} from 'lucide-react';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <FlowComplyLogo size="md" />
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#demo" className="text-gray-600 hover:text-gray-900">Demo</a>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Award className="h-4 w-4" />
                <span>Taumata Arowai Compliant</span>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Water Compliance Made <span className="text-blue-600">Simple</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Complete regulatory compliance management for New Zealand water utilities.
                Streamline DWSP creation, asset management, and regulatory reporting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:border-gray-400 transition-colors text-lg font-medium"
                >
                  <Play className="mr-2 h-5 w-5" />
                  View Demo
                </a>
              </div>
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span>14-day free trial</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform">
                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">Compliance Score</span>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">94%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm opacity-90">Assets Tracked</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">24</div>
                    <div className="text-sm opacity-90">Active DWSPs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 font-medium">Trusted by leading NZ water utilities</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
            {['Auckland Water', 'Wellington Water', 'Christchurch City', 'Hamilton City'].map((city) => (
              <div key={city} className="text-xl font-bold text-gray-400">{city}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A comprehensive platform built specifically for New Zealand water suppliers to meet
              all Taumata Arowai regulatory requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'DWSP Management',
                description: 'Complete 12-element DWSP builder with validation against all Taumata Arowai requirements. Draft saving and submission workflow.',
                color: 'blue'
              },
              {
                icon: Database,
                title: 'Asset Management',
                description: 'Track all water infrastructure with risk-based classification, condition monitoring, and GPS coordinates.',
                color: 'green'
              },
              {
                icon: FileText,
                title: 'Document Control',
                description: 'S3-backed document storage with version control, 7-year retention, and advanced search capabilities.',
                color: 'purple'
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Real-time compliance metrics, asset trends, and actionable insights with visual dashboards.',
                color: 'orange'
              },
              {
                icon: TrendingUp,
                title: 'Compliance Scoring',
                description: 'Automated 0-100 compliance score based on 6 weighted components with historical tracking.',
                color: 'indigo'
              },
              {
                icon: Bell,
                title: 'Smart Notifications',
                description: 'Automated deadline reminders, compliance alerts, and quarterly regulation review notifications.',
                color: 'red'
              },
              {
                icon: Users,
                title: 'Role-Based Access',
                description: 'Multi-tenant architecture with 5 role types and granular permissions per resource.',
                color: 'teal'
              },
              {
                icon: Lock,
                title: 'Security & Audit',
                description: 'Immutable audit logs, data encryption, and 7-year retention for regulatory compliance.',
                color: 'gray'
              },
              {
                icon: Zap,
                title: 'Data Export',
                description: 'CSV exports for all data types with date range filtering and regulatory-ready formats.',
                color: 'yellow'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">12</div>
              <div className="text-blue-200">Mandatory DWSP Elements</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">60+</div>
              <div className="text-blue-200">API Endpoints</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">7</div>
              <div className="text-blue-200">Year Data Retention</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-200">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Compliance */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                100% Taumata Arowai Compliant
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Built to meet all requirements of the Water Services Act 2021 and
                Drinking Water Quality Assurance Rules (DWQAR).
              </p>
              <div className="space-y-4">
                {[
                  'All 12 mandatory DWSP elements covered',
                  '7-year audit log retention',
                  'Quarterly regulation review system',
                  'Immutable compliance records',
                  'Export-ready for regulator submission',
                  'Multi-barrier approach validation'
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-xl p-8 border-2 border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">12 DWSP Elements</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Water Supply Description',
                  'Hazard Identification',
                  'Risk Assessment',
                  'Preventive Measures',
                  'Operational Monitoring',
                  'Verification Monitoring',
                  'Corrective Actions',
                  'Multi-Barrier Approach',
                  'Emergency Response',
                  'Residual Disinfection',
                  'Water Quantity',
                  'Review Procedures'
                ].map((element, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2 text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{element}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your organization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$299',
                period: '/month',
                description: 'Perfect for small water utilities',
                features: [
                  'Up to 100 assets',
                  '2 active DWSPs',
                  '5 team members',
                  'Basic analytics',
                  'Email support',
                  '1GB document storage'
                ],
                cta: 'Start Free Trial',
                highlighted: false
              },
              {
                name: 'Professional',
                price: '$699',
                period: '/month',
                description: 'Most popular for medium utilities',
                features: [
                  'Up to 500 assets',
                  'Unlimited DWSPs',
                  '15 team members',
                  'Advanced analytics',
                  'Priority support',
                  '10GB document storage',
                  'Compliance scoring',
                  'Custom reports'
                ],
                cta: 'Start Free Trial',
                highlighted: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large-scale operations',
                features: [
                  'Unlimited assets',
                  'Unlimited DWSPs',
                  'Unlimited team members',
                  'Full analytics suite',
                  '24/7 phone support',
                  'Unlimited storage',
                  'API access',
                  'Custom integrations',
                  'Dedicated account manager'
                ],
                cta: 'Contact Sales',
                highlighted: false
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl p-8 ${
                  plan.highlighted
                    ? 'bg-blue-600 text-white shadow-2xl scale-105 border-4 border-blue-400'
                    : 'bg-white border-2 border-gray-200'
                }`}
              >
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-lg ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <CheckCircle2 className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? 'text-blue-200' : 'text-green-500'
                      }`} />
                      <span className={plan.highlighted ? 'text-white' : 'text-gray-700'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.price === 'Custom' ? '#contact' : '/register'}
                  className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-gray-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            See FlowComply in Action
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Experience the full power of our platform with pre-loaded sample data.
            No registration required.
          </p>
          <Link
            href="/demo/dashboard"
            className="inline-flex items-center justify-center bg-blue-600 text-white px-12 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
          >
            <Play className="mr-3 h-6 w-6" />
            Launch Interactive Demo
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Simplify Your Compliance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading NZ water utilities in ensuring safe, compliant drinking water for your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#contact"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white/10 transition-colors text-lg font-medium"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <FlowComplyLogo size="sm" variant="white" />
              <p className="text-sm text-gray-400 mt-4">
                Professional water compliance management for New Zealand utilities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white">Demo</a></li>
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} flowcomply.com - All rights reserved. Built for NZ water utilities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
