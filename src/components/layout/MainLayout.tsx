import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import LoadingSpinner from '../common/LoadingSpinner';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="h-screen flex overflow-hidden bg-slate-50 relative">
            {/* Ambient Background blobs */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

            {/* Mobile off-canvas Sidebar and Desktop Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Column */}
            <div className="flex flex-col w-0 flex-1 overflow-hidden">
                <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

                <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {/* Nested routes render here (pages are code-split, see App.tsx) */}
                            <Suspense fallback={<div className="py-20 flex justify-center"><LoadingSpinner /></div>}>
                                <Outlet />
                            </Suspense>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
