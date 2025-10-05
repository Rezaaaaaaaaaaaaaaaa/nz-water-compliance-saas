'use client';

/**
 * Dashboard Layout
 *
 * Main layout for authenticated pages with sidebar navigation
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FlowComplyIcon } from '@/components/branding/FlowComplyLogo';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  roles?: string[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Assets', href: '/dashboard/assets', icon: '🏗️' },
  { name: 'Compliance Plans', href: '/dashboard/compliance', icon: '📋' },
  { name: 'Documents', href: '/dashboard/documents', icon: '📄' },
  { name: 'Reports', href: '/dashboard/reports', icon: '📈' },
  {
    name: 'Monitoring',
    href: '/dashboard/monitoring',
    icon: '🔍',
    roles: ['SYSTEM_ADMIN', 'AUDITOR'],
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Filter navigation items based on user role
  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-blue-900 text-white transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-blue-800">
          {sidebarOpen ? (
            <div className="flex items-center space-x-2">
              <FlowComplyIcon size={32} variant="white" />
              <h1 className="text-xl font-bold">FlowComply</h1>
            </div>
          ) : (
            <FlowComplyIcon size={24} variant="white" />
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-blue-800"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
            {sidebarOpen && (
              <div className="mb-3">
                <p className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</p>
                <p className="text-xs text-blue-200">{user.email}</p>
                <p className="text-xs text-blue-300 mt-1">{user.role.replace('_', ' ')}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium bg-blue-800 hover:bg-blue-700 transition-colors"
            >
              <span className="text-xl mr-2">🚪</span>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className={`${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } transition-all duration-300`}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          {user?.organization && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {user.organization.name}
              </p>
              <p className="text-xs text-gray-500">Organization</p>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
