import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface BackButtonProps {
  onClick?: () => void;
  href?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ 
  onClick, 
  href, 
  label = "Back", 
  className = "" 
}: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    } else {
      window.history.back();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="ghost"
        onClick={handleClick}
        className={`text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors ${className}`}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {label}
      </Button>
    </motion.div>
  );
}