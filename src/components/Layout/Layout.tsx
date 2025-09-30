import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
  <Sidebar />
  
  <div className="flex flex-col w-0 flex-1 overflow-hidden md:ml-56">
    <Header />
    <main className="flex-1 relative overflow-y-auto focus:outline-none pt-16">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="route-fade-enter">
            {children}
          </div>
        </div>
      </div>
    </main>
  </div>
</div>

  );
};

export default Layout;