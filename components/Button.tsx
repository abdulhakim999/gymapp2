import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-50 disabled:pointer-events-none rounded-xl";
  
  const variants = {
    primary: "bg-lime-400 text-neutral-950 hover:bg-lime-500 focus:ring-lime-400",
    secondary: "bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-neutral-600",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 focus:ring-red-500",
    ghost: "bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800",
    outline: "border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white bg-transparent"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-12 px-5 text-sm",
    lg: "h-14 px-8 text-base",
    icon: "h-10 w-10 p-2"
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
