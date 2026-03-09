import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    return (
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200 shadow-sm">
            <button
                type="button"
                className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden hover:bg-gray-50"
            >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex-1 px-4 flex justify-between h-full items-center">
                <div className="flex-1 flex">
                    <h2 className="text-lg font-medium text-gray-800 lg:hidden">
                        Dashboard
                    </h2>
                </div>
                <div className="ml-4 flex items-center md:ml-6 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="hidden sm:inline-block font-medium">
                            {currentUser?.email || 'Admin User'}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        title="Logout"
                    >
                        <span className="sr-only">Log out</span>
                        <LogOut className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
