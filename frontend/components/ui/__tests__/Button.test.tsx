import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies default variant (primary)', () => {
    render(<Button>Default Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600', 'text-white', 'hover:bg-gray-700');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-transparent', 'text-gray-700', 'hover:bg-gray-100');
  });

  it('applies outline variant styles', () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-white', 'border', 'border-gray-300', 'text-gray-700');
  });

  it('applies small size styles', () => {
    render(<Button size="sm">Small</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies medium size styles (default)', () => {
    render(<Button size="md">Medium</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('applies large size styles', () => {
    render(<Button size="lg">Large</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Check for spinner SVG
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('animate-spin');
  });

  it('disables button when isLoading is true', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders left icon when provided', () => {
    const LeftIcon = () => <span data-testid="left-icon">L</span>;

    render(<Button leftIcon={<LeftIcon />}>With Left Icon</Button>);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByText('With Left Icon')).toBeInTheDocument();
  });

  it('renders right icon when provided', () => {
    const RightIcon = () => <span data-testid="right-icon">R</span>;

    render(<Button rightIcon={<RightIcon />}>With Right Icon</Button>);

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('With Right Icon')).toBeInTheDocument();
  });

  it('renders both left and right icons', () => {
    const LeftIcon = () => <span data-testid="left-icon">L</span>;
    const RightIcon = () => <span data-testid="right-icon">R</span>;

    render(
      <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Both Icons
      </Button>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('Both Icons')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    // Should still have base classes
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('forwards ref to button element', () => {
    const ref = React.createRef<HTMLButtonElement>();

    render(<Button ref={ref}>With Ref</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toBe('With Ref');
  });

  it('passes through HTML button attributes', () => {
    render(
      <Button type="submit" name="submit-button" data-testid="custom-button">
        Submit
      </Button>
    );

    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('name', 'submit-button');
  });
});
