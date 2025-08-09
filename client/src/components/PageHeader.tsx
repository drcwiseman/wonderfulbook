import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";
import Breadcrumb from "@/components/Breadcrumb";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  backButtonHref?: string;
  onBackClick?: () => void;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBackButton = true,
  backButtonLabel,
  backButtonHref,
  onBackClick,
  breadcrumbs,
  actions,
  className = ""
}: PageHeaderProps) {
  return (
    <motion.div 
      className={`bg-white border-b border-gray-200 px-4 md:px-8 py-6 ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Back Button */}
            {showBackButton && (
              <BackButton
                onClick={onBackClick}
                href={backButtonHref}
                label={backButtonLabel}
              />
            )}
            
            {/* Title Section */}
            <div>
              <motion.h1 
                className="text-3xl font-bold text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p 
                  className="text-gray-600 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {actions && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {actions}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}