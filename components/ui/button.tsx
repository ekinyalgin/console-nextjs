// components/ui/button.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react';

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

const buttonVariants = {
  primary:
    'px-4 py-2 rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-primary text-white hover:bg-primary/90 text-sm',
  secondary:
    'bg-gray-500 text-white text-xs px-4 font-semibold py-2 rounded hover:bg-gray-600 transition',
  outline:
    'bg-transparent border border-gray-500 text-black text-xs px-4 font-semibold py-2 rounded-sm hover:bg-gray-600 hover:text-white transition ',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent hover:bg-gray-100',
  none: 'bg-transparent p-0 m-0',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          '',
          buttonVariants[variant], // Seçilen varyasyonun stilini uygula
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
