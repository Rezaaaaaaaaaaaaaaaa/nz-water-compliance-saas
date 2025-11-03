'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { Input } from '@/components/ui';
import { useToast } from '@/components/ui';
import { FlowComplyLogo } from '@/components/branding/FlowComplyLogo';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationType: 'WATER_SUPPLIER',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        organizationName: data.organizationName,
        organizationType: data.organizationType,
      });

      toast.success('Registration successful! Welcome aboard.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <FlowComplyLogo size="lg" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start your 14-day free trial
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName')}
                id="register-firstName"
              />

              <Input
                label="Last Name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
                id="register-lastName"
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="john.doe@example.co.nz"
              error={errors.email?.message}
              {...register('email')}
              id="register-email"
            />

            <Input
              label="Organization Name"
              placeholder="Wellington Water Limited"
              error={errors.organizationName?.message}
              {...register('organizationName')}
              id="register-organizationName"
            />

            <div>
              <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Type *
              </label>
              <select
                id="organizationType"
                {...register('organizationType')}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="WATER_SUPPLIER">Water Supplier</option>
                <option value="CONSULTANT">Consultant</option>
                <option value="REGULATOR">Regulator</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.organizationType && (
                <p className="mt-1 text-sm text-red-600">{errors.organizationType.message}</p>
              )}
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              helperText="Must contain uppercase, lowercase, and number"
              error={errors.password?.message}
              {...register('password')}
              id="register-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
              id="register-confirmPassword"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By registering, you agree to comply with{' '}
              <a href="https://www.taumataarowai.govt.nz" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                Taumata Arowai
              </a>{' '}
              regulatory requirements
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
