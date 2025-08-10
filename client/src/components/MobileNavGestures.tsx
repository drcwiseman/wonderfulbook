import React, { useState, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { useLocation } from "wouter";

interface SwipeNavProps {
  children: React.ReactNode;
}

export default function MobileNavGestures({ children }: SwipeNavProps) {
  const [location, setLocation] = useLocation();
  const controls = useAnimation();
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  const routes = ["/", "/bookstore", "/library", "/dashboard"];
  const currentIndex = routes.indexOf(location);

  const handlePanEnd = (event: any, info: PanInfo) => {
    const threshold = 100; // Minimum swipe distance
    const velocity = 500; // Minimum swipe velocity

    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > velocity) {
      if (info.offset.x > 0 && currentIndex > 0) {
        // Swipe right - go to previous route
        setLocation(routes[currentIndex - 1]);
      } else if (info.offset.x < 0 && currentIndex < routes.length - 1) {
        // Swipe left - go to next route
        setLocation(routes[currentIndex + 1]);
      }
    }

    // Reset animation
    controls.start({ x: 0, transition: { duration: 0.3, ease: "easeOut" } });
    setIsSwipeActive(false);
  };

  const handlePan = (event: any, info: PanInfo) => {
    if (window.innerWidth > 768) return; // Only on mobile

    const clampedX = Math.max(-50, Math.min(50, info.offset.x * 0.5));
    controls.start({ x: clampedX, transition: { duration: 0 } });
    setIsSwipeActive(Math.abs(info.offset.x) > 20);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      animate={controls}
      className="min-h-screen relative"
    >
      {children}
      
      {/* Swipe indicators */}
      {isSwipeActive && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-50 md:hidden">
          {routes.map((route, index) => (
            <div
              key={route}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-orange-500 scale-125'
                  : 'bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Enhanced touch feedback for buttons
export function TouchButton({ 
  children, 
  onClick, 
  className = "",
  disabled = false 
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${disabled ? 'opacity-50' : ''}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      style={{ touchAction: 'manipulation' }} // Prevents zoom on double tap
    >
      {children}
    </motion.button>
  );
}