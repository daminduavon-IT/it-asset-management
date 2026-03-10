import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MonitorSmartphone,
    PlusSquare,
    Settings,
    X
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'All Assets', href: '/assets', icon: MonitorSmartphone },
    { name: 'Add Asset', href: '/assets/add', icon: PlusSquare },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    // Shared navigation renderer to keep code DRY
    const renderNavItems = () => (
        <nav className="mt-6 flex-1 px-3 space-y-2">
            {navigation.map((item) => {
                const Icon = item.icon;
                return (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={onClose} // Auto-close on mobile when clicking a link
                        className={({ isActive }) =>
                            `group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-[#F29100] to-[#FDB913] text-white shadow-md'
                                : 'text-emerald-100 hover:bg-[#003a00]/80 hover:text-white hover:translate-x-1'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Icon
                                    className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-emerald-300 group-hover:text-emerald-100'}`}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Off-Canvas Menu overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    {/* Background darkening overlay */}
                    <div 
                        className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity" 
                        onClick={onClose}
                        aria-hidden="true"
                    ></div>

                    {/* Sliding sidebar */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#004e00]/95 backdrop-blur-xl border-r border-[#003a00] transform transition duration-300 ease-in-out shadow-2xl">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                            <button
                                type="button"
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-black/20 hover:bg-black/40 text-white"
                                onClick={onClose}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center justify-center flex-shrink-0 px-4 mb-2">
                                <img 
                                    src="/avon-logo.png" 
                                    alt="Avon Pharmo Chem Logo" 
                                    className="h-12 w-auto object-contain bg-white/10 p-2 rounded-xl border border-white/20" 
                                />
                            </div>
                            {renderNavItems()}
                        </div>
                        
                        {/* Settings footer for mobile */}
                        <div className="flex-shrink-0 flex bg-[#003a00]/95 p-4 border-t border-[#002f00]">
                            <a href="#" className="flex-shrink-0 w-full group block">
                                <div className="flex items-center">
                                    <Settings className="inline-block h-8 w-8 rounded-full text-emerald-400 group-hover:text-[#FDB913] transition-colors duration-200 transform group-hover:rotate-45" />
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-white">System Settings</p>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                    {/* Dummy element to force sidebar to shrink to fit close icon */}
                    <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
                </div>
            )}

            {/* Desktop Static Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0 shadow-lg relative z-20">
                <div className="flex flex-col w-64 bg-[#004e00]/95 backdrop-blur-xl border-r border-[#003a00]">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center justify-center flex-shrink-0 px-4 mb-2">
                            <img 
                                src="/avon-logo.png" 
                                alt="Avon Pharmo Chem Logo" 
                                className="h-12 w-auto object-contain bg-white/10 p-2 rounded-xl border border-white/20" 
                            />
                        </div>
                        {renderNavItems()}
                    </div>
                    <div className="flex-shrink-0 flex bg-[#003a00]/95 p-4 border-t border-[#002f00]">
                        <a href="#" className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div>
                                    <Settings className="inline-block h-8 w-8 rounded-full text-emerald-400 group-hover:text-[#FDB913] transition-colors duration-200 transform group-hover:rotate-45" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-white">System Settings</p>
                                    <p className="text-xs font-medium text-emerald-300 group-hover:text-emerald-100 transition-colors">
                                        View configuration
                                    </p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
