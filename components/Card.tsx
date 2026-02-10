import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm ${className} ${onClick ? 'cursor-pointer hover:border-neutral-700 transition-colors' : ''}`}
    >
      {children}
    </div>
  );
};

export default Card;
