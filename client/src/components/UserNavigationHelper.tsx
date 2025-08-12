import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  BookOpen, 
  User, 
  BarChart3, 
  Settings, 
  ArrowLeft, 
  HelpCircle, 
  Menu,
  X,
  Crown
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

interface UserNavigationHelperProps {
  currentPage?: string;
  showOnMobile?: boolean;
}

export function UserNavigationHelper({ 
  currentPage = '', 
  showOnMobile = true 
}: UserNavigationHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const navigationItems = [
    { icon: Home, label: 'Home', href: '/', color: 'text-blue-600' },
    { icon: BookOpen, label: 'Library', href: '/library', color: 'text-orange-600', auth: true },
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', color: 'text-green-600', auth: true },
    { icon: Crown, label: 'Subscribe', href: '/subscribe', color: 'text-purple-600', auth: true },
    { icon: User, label: 'Profile', href: '/profile', color: 'text-indigo-600', auth: true },
  ];

  const quickActions = [
    { 
      label: 'Need Help?', 
      action: () => window.location.href = 'mailto:support@wonderfulbooks.com',
      icon: HelpCircle,
      color: 'text-gray-600'
    },
    { 
      label: 'Go Back', 
      action: () => window.history.back(),
      icon: ArrowLeft,
      color: 'text-gray-600'
    },
  ];

  const handleNavigation = (href: string) => {
    setLocation(href);
    setIsOpen(false);
  };

  const filteredItems = navigationItems.filter(item => 
    !item.auth || (item.auth && isAuthenticated)
  );

  if (!showOnMobile && window.innerWidth < 768) {
    return null;
  }

  return (
    <>
      {/* Floating Navigation Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          size="sm"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Navigation Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Navigation Panel */}
          <div className="fixed bottom-24 right-6 z-50">
            <Card className="w-64 shadow-2xl border-2 border-orange-200">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <div className="text-sm font-semibold text-gray-900">
                    Quick Navigation
                  </div>
                  {isAuthenticated && (
                    <div className="text-xs text-gray-600 mt-1">
                      Welcome, {(user as any)?.firstName || 'Reader'}!
                    </div>
                  )}
                </div>

                {/* Main Navigation */}
                <div className="space-y-2 mb-4">
                  {filteredItems.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-10 hover:bg-orange-50"
                      onClick={() => handleNavigation(item.href)}
                    >
                      <item.icon className={`w-4 h-4 mr-3 ${item.color}`} />
                      <span className="text-gray-900">{item.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4" />

                {/* Quick Actions */}
                <div className="space-y-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start h-10 hover:bg-gray-50"
                      onClick={() => {
                        action.action();
                        setIsOpen(false);
                      }}
                    >
                      <action.icon className={`w-4 h-4 mr-3 ${action.color}`} />
                      <span className="text-gray-700">{action.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Current Page Indicator */}
                {currentPage && (
                  <>
                    <div className="border-t border-gray-200 my-4" />
                    <div className="text-xs text-gray-500 text-center">
                      Currently on: <span className="font-medium text-gray-700">{currentPage}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

export default UserNavigationHelper;