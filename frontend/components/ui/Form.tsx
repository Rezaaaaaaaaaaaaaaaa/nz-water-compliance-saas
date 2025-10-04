import React from 'react';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      {children}
    </form>
  );
};

export interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({ children, className = '' }) => {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
};

export interface FormRowProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const FormRow: React.FC<FormRowProps> = ({ children, columns = 2, className = '' }) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
      {children}
    </div>
  );
};

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'between',
  className = '',
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={`flex items-center ${alignClasses[align]} gap-3 ${className}`}>
      {children}
    </div>
  );
};

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  required = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({ children, className = '' }) => {
  return <p className={`text-sm text-red-600 ${className}`}>{children}</p>;
};

export interface FormHelperTextProps {
  children: React.ReactNode;
  className?: string;
}

export const FormHelperText: React.FC<FormHelperTextProps> = ({ children, className = '' }) => {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
};
