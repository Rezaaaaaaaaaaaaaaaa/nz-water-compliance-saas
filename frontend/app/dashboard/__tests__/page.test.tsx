import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../page';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api';

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the API module
jest.mock('@/lib/api', () => ({
  assetsApi: {
    statistics: jest.fn(),
  },
  dwspApi: {
    list: jest.fn(),
  },
  documentsApi: {
    list: jest.fn(),
  },
  reportsApi: {
    list: jest.fn(),
  },
}));

// Mock DashboardLayout
jest.mock('@/components/dashboard/DashboardLayout', () => ({
  DashboardLayout: ({ children }: any) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Mock ErrorBoundary
jest.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Building2: () => <span>Building2Icon</span>,
  FileText: () => <span>FileTextIcon</span>,
  BarChart3: () => <span>BarChart3Icon</span>,
  PlusCircle: () => <span>PlusCircleIcon</span>,
  CheckCircle: () => <span>CheckCircleIcon</span>,
  AlertTriangle: () => <span>AlertTriangleIcon</span>,
  Loader: () => <span data-testid="loader-icon">LoaderIcon</span>,
}));

describe('DashboardPage', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'ADMIN',
    organizationId: 'org-1',
  };

  const mockStats = {
    total: 10,
    critical: 2,
    needingInspection: 3,
  };

  const mockCompliancePlans = [
    { id: '1', status: 'APPROVED', name: 'Plan 1' },
    { id: '2', status: 'DRAFT', name: 'Plan 2' },
    { id: '3', status: 'IN_REVIEW', name: 'Plan 3' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    jest.spyOn(api.assetsApi, 'statistics').mockResolvedValue(mockStats);
    jest.spyOn(api.dwspApi, 'list').mockResolvedValue({
      total: 3,
      compliancePlans: mockCompliancePlans,
    });
    jest.spyOn(api.documentsApi, 'list').mockResolvedValue({
      total: 25,
    });
    jest.spyOn(api.reportsApi, 'list').mockResolvedValue({
      total: 15,
      reports: [
        { id: '1', status: 'SUBMITTED' },
        { id: '2', status: 'DRAFT' },
      ],
    });
  });

  it('renders loading state initially', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('displays welcome message with user name', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John!/i)).toBeInTheDocument();
    });
  });

  it('loads and displays dashboard statistics', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      // Check if stats are displayed
      expect(screen.getByText('10')).toBeInTheDocument(); // Total assets
      expect(screen.getByText('2 Critical')).toBeInTheDocument();
      expect(screen.getByText('3 Need Inspection')).toBeInTheDocument();
    });

    // Verify API calls were made
    expect(api.assetsApi.statistics).toHaveBeenCalledTimes(1);
    expect(api.dwspApi.list).toHaveBeenCalledWith({ limit: 1000 });
    expect(api.documentsApi.list).toHaveBeenCalledWith({ limit: 1 });
    expect(api.reportsApi.list).toHaveBeenCalledWith({ limit: 1 });
  });

  it('displays quick action links', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Create Compliance Plan')).toBeInTheDocument();
      expect(screen.getByText('Manage Assets')).toBeInTheDocument();
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });

    // Check links have correct hrefs
    const complianceLink = screen.getByText('Create Compliance Plan').closest('a');
    const assetsLink = screen.getByText('Manage Assets').closest('a');
    const reportsLink = screen.getByText('Generate Report').closest('a');

    expect(complianceLink).toHaveAttribute('href', '/dashboard/compliance');
    expect(assetsLink).toHaveAttribute('href', '/dashboard/assets');
    expect(reportsLink).toHaveAttribute('href', '/dashboard/reports');
  });

  it('handles API errors gracefully', async () => {
    jest.spyOn(api.assetsApi, 'statistics').mockRejectedValue(new Error('API Error'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DashboardPage />);

    await waitFor(() => {
      // Should not show loading state anymore
      expect(screen.queryByText('Loading dashboard...')).not.toBeInTheDocument();
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load dashboard data:',
      expect.any(Error)
    );
  });
});
