import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MonitorSmartphone,
    PlusSquare,
    ShieldAlert,
    X
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'All Assets', href: '/assets', icon: MonitorSmartphone },
    { name: 'Add Asset', href: '/assets/add', icon: PlusSquare },
    { name: 'Audit Logs', href: '/audit-logs', icon: ShieldAlert },
];

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

// "All Assets" covers the list, details and edit pages, but not "Add Asset" (which also lives under /assets)
const isNavItemActive = (href: string, pathname: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/assets') return pathname.startsWith('/assets') && pathname !== '/assets/add';
    return pathname.startsWith(href);
};

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const { pathname } = useLocation();

    // Escape closes the mobile menu
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    // Shared navigation renderer to keep code DRY
    const renderNavItems = () => (
        <nav className="mt-6 flex-1 px-3 space-y-2">
            {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.href, pathname);
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={onClose} // Auto-close on mobile when clicking a link
                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1 hover:shadow-sm'
                        }`}
                    >
                        <Icon
                            className={`mr-3 flex-shrink-0 h-5 w-5 transition-transform duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-110'}`}
                            aria-hidden="true"
                        />
                        {item.name}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <>
            {/* Mobile Off-Canvas Menu overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
                    {/* Background darkening overlay */}
                    <div
                        className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                        aria-hidden="true"
                    ></div>

                    {/* Sliding sidebar */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900/95 backdrop-blur-2xl border-r border-white/10 transform transition duration-300 ease-in-out shadow-2xl">
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
                                    src="/avon-logo-sm.png"
                                    alt="Avon Pharmo Chem Logo"
                                    className="h-12 w-auto object-contain bg-white/10 p-2 rounded-xl border border-white/20"
                                />
                            </div>
                            {renderNavItems()}
                        </div>
                    </div>
                    {/* Dummy element to force sidebar to shrink to fit close icon */}
                    <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
                </div>
            )}

            {/* Desktop Static Sidebar */}
            <div className="hidden lg:flex lg:flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-20">
                <div className="flex flex-col w-64 bg-slate-900/95 backdrop-blur-2xl border-r border-white/10">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center justify-center flex-shrink-0 px-4 mb-2">
                            <img
                                src="/avon-logo-sm.png"
                                alt="Avon Pharmo Chem Logo"
                                className="h-12 w-auto object-contain bg-white/10 p-2 rounded-xl border border-white/20"
                            />
                        </div>
                        {renderNavItems()}
                    </div>
                    <div className="flex-shrink-0 px-4 py-4 border-t border-white/10 text-xs text-slate-500">
                        Avon Pharmo Chem · IT Asset Management
                    </div>
                </div>
            </div>
        </>
    );
}
