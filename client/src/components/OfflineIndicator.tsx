import { useOfflineReading } from '@/hooks/useOfflineReading';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Download, HardDrive } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, cachedBooks } = useOfflineReading();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-20 right-4 z-40"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-md border ${
          isOnline 
            ? 'bg-green-500/20 border-green-500/30 text-green-400' 
            : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          
          {cachedBooks.length > 0 && (
            <>
              <div className="w-px h-4 bg-current opacity-30" />
              <div className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs">
                  {cachedBooks.length} downloaded
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}