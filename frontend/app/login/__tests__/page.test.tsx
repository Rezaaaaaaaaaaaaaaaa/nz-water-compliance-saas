import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the UI components
jest.mock('@/components/ui', () => ({
  Input: ({ label, error, id, ...props }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock the FlowComplyLogo component
jest.mock('@/components/branding/FlowComplyLogo', () => ({
  FlowComplyLogo: ({ size }: any) => <div data-testid="flow-comply-logo">FlowComply Logo ({size})</div>,
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/login',
    query: {},
    asPath: '/login',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false,
    });

    // Mock the router
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders the login form', () => {
    render(<LoginPage />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders the FlowComply logo', () => {
    render(<LoginPage />);

    expect(screen.getByTestId('flow-comply-logo')).toBeInTheDocument();
  });

  it('displays the subtitle', () => {
    render(<LoginPage />);

    expect(screen.getByText('Water Compliance Management for NZ Utilities')).toBeInTheDocument();
  });

  it('displays a link to the registration page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /register here/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('displays a link to Taumata Arowai', () => {
    render(<LoginPage />);

    const taumataLink = screen.getByRole('link', { name: /taumata arowai/i });
    expect(taumataLink).toBeInTheDocument();
    expect(taumataLink).toHaveAttribute('href', 'https://www.taumataarowai.govt.nz');
    expect(taumataLink).toHaveAttribute('target', '_blank');
    expect(taumataLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login failure', async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        data: {
          error: 'Invalid credentials',
        },
      },
    };
    mockLogin.mockRejectedValueOnce(mockError);

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Signing in...');
    });
  });
});
