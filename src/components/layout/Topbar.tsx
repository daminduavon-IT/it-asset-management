import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
    onOpenSidebar?: () => void;
}

export default function Topbar({ onOpenSidebar }: TopbarProps) {
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
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm sticky top-0 transition-all">
            <button
                type="button"
                onClick={onOpenSidebar}
                className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#005500] lg:hidden hover:bg-emerald-50 active:bg-emerald-100 transition-colors"
            >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex-1 px-4 flex justify-between h-full items-center min-w-0">
                <div className="flex-1 flex min-w-0 overflow-hidden">
                    <h2 className="text-lg font-bold text-gray-800 lg:hidden flex items-center gap-2 truncate">
                        <img src="/avon-logo.png" className="h-8 w-8 object-contain flex-shrink-0" alt="Logo" />
                        <span className="truncate">AVON IT</span>
                    </h2>
                </div>
                <div className="ml-2 flex flex-shrink-0 items-center md:ml-6 gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/50 px-2 sm:px-4 py-1.5 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow max-w-[120px] sm:max-w-none overflow-hidden">
                        <div className="h-6 w-6 flex-shrink-0 rounded-full bg-gradient-to-r from-[#005500] to-emerald-600 flex items-center justify-center text-white">
                            <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="hidden sm:inline-block font-medium">
                            {currentUser?.email || 'Admin User'}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 group"
                        title="Logout"
                    >
                        <span className="sr-only">Log out</span>
                        <LogOut className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </div>
    );
}
