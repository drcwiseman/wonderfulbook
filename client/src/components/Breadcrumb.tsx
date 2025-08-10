import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const [, setLocation] = useLocation();
  
  return (
    <motion.nav 
      className={`flex items-center space-x-2 text-sm ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;
        
        return (
          <div key={index} className="flex items-center space-x-2">
            {item.href && !isLast ? (
              <motion.button
                onClick={() => setLocation(item.href!)}
                className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </motion.button>
            ) : (
              <div className={`flex items-center space-x-1 ${isLast ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </div>
            )}
            {!isLast && (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </div>
        );
      })}
    </motion.nav>
  );
}