import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MonitorSmartphone,
    PlusSquare,
    Settings
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'All Assets', href: '/assets', icon: MonitorSmartphone },
    { name: 'Add Asset', href: '/assets/add', icon: PlusSquare },
];

export default function Sidebar() {
    return (
        <div className="hidden lg:flex lg:flex-shrink-0">
            <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800">
                <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <h1 className="text-xl font-bold text-white tracking-widest">
                            AVON IT
                        </h1>
                    </div>
                    <nav className="mt-8 flex-1 px-2 space-y-2 bg-slate-900">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.name}
                                    to={item.href}
                                    className={({ isActive }) =>
                                        `group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-primary-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`
                                    }
                                >
                                    <Icon
                                        className="mr-3 flex-shrink-0 h-5 w-5"
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex-shrink-0 flex bg-slate-950 p-4">
                    <a href="#" className="flex-shrink-0 w-full group block">
                        <div className="flex items-center">
                            <div>
                                <Settings className="inline-block h-8 w-8 rounded-full text-slate-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">System Settings</p>
                                <p className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                                    View configuration
                                </p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
