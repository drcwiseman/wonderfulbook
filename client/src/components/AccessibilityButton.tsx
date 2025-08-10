import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Accessibility } from "lucide-react";
import AccessibilityPanel from "./AccessibilityPanel";

export default function AccessibilityButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Accessibility Button */}
      <motion.div
        className="fixed bottom-6 left-6 z-30"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            aria-label="Open accessibility settings"
          >
            <Accessibility className="w-6 h-6" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Accessibility Panel */}
      <AccessibilityPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}