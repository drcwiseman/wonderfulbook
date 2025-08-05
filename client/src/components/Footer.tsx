export default function Footer() {
  return (
    <footer className="bg-netflix-gray py-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">Books</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#categories" className="hover:text-white transition-colors">Categories</a></li>
              <li><a href="#featured" className="hover:text-white transition-colors">New Releases</a></li>
              <li><a href="#featured" className="hover:text-white transition-colors">Bestsellers</a></li>
              <li><a href="#featured" className="hover:text-white transition-colors">Free Books</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">My Library</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Reading History</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bookmarks</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Settings</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Technical Issues</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-netflix-red text-2xl font-bold mb-4 md:mb-0">Wonderful Books</div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <i className="fab fa-linkedin"></i>
              </a>
            </div>
          </div>
          <div className="text-center mt-6 text-gray-500 text-sm">
            <p>&copy; 2024 Wonderful Books. All rights reserved.</p>
            <p className="mt-2">Unlimited access to thousands of books. Read anywhere, anytime. No downloads required.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
