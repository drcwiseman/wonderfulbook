import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 py-16 px-4 md:px-8 border-t border-orange-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Books</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#categories" className="hover:text-orange-600 transition-colors">Categories</a></li>
              <li><a href="#featured" className="hover:text-orange-600 transition-colors">New Releases</a></li>
              <li><a href="#featured" className="hover:text-orange-600 transition-colors">Bestsellers</a></li>
              <li><a href="#featured" className="hover:text-orange-600 transition-colors">Free Books</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Account</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-orange-600 transition-colors">My Library</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Reading History</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Bookmarks</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Settings</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Support</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-orange-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Technical Issues</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-gray-900">Company</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="#" className="hover:text-orange-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-orange-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-orange-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-orange-600 text-2xl font-bold mb-4 md:mb-0">Wonderful Books</div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          <div className="text-center mt-6 text-gray-600 text-sm">
            <p>&copy; 2025 Wonderful Books. All rights reserved.</p>
            <p className="mt-2">Unlimited access to thousands of books. Read anywhere, anytime. No downloads required.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
