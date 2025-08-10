import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface SmoothLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function SmoothLink({ href, children, className = "", onClick }: SmoothLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call optional onClick handler
    if (onClick) onClick();
    
    // Add smooth transition effect
    const currentPage = document.body;
    currentPage.style.transition = 'opacity 0.3s ease-out';
    currentPage.style.opacity = '0.7';
    
    // Navigate after brief delay
    setTimeout(() => {
      window.location.href = href;
    }, 150);
  };

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.a>
  );
}

// Enhanced button component with smooth interactions
export function SmoothButton({ 
  children, 
  onClick, 
  className = "", 
  disabled = false,
  variant = "primary"
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const baseClasses = "px-6 py-3 rounded-lg font-medium transition-all duration-200";
  const variantClasses = {
    primary: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/25",
    secondary: "bg-white text-gray-900 hover:bg-gray-100 shadow-lg",
    ghost: "text-white hover:text-orange-400 hover:bg-white/10"
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  );
}