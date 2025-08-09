import { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SelectionDropdownProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  showSearch?: boolean;
}

export function SelectionDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  label,
  description,
  required = false,
  disabled = false,
  className = "",
  error,
  size = 'md',
  showSearch = false
}: SelectionDropdownProps) {
  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base'
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="space-y-1">
          <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}

      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className={`
            ${sizeClasses[size]}
            ${error ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600
            hover:border-gray-400 dark:hover:border-gray-500
            focus:ring-2 focus:ring-orange-500 focus:border-orange-500
          `}
        >
          <div className="flex items-center gap-2 flex-1 text-left">
            {selectedOption?.icon && (
              <span className="flex-shrink-0">
                {selectedOption.icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <SelectValue placeholder={placeholder} />
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
        </SelectTrigger>

        <SelectContent className="max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              No options available
            </div>
          ) : (
            options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={`
                  cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700
                  focus:bg-orange-50 dark:focus:bg-orange-900/20
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-2 w-full">
                  {option.icon && (
                    <span className="flex-shrink-0">
                      {option.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {option.description}
                      </div>
                    )}
                  </div>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-orange-600 dark:text-orange-500 flex-shrink-0" />
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// Export common option builders for convenience
export const createOption = (value: string, label: string, options?: Partial<SelectOption>): SelectOption => ({
  value,
  label,
  ...options
});

export const createOptionsFromArray = (items: string[]): SelectOption[] =>
  items.map(item => createOption(item, item));

export const createOptionsFromObject = (obj: Record<string, string>): SelectOption[] =>
  Object.entries(obj).map(([value, label]) => createOption(value, label));