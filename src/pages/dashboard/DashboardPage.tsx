import { useEffect, useState } from 'react';
import {
    MonitorSmartphone,
    CheckCircle2,
    Clock,
    AlertTriangle
} from 'lucide-react';
import type { DashboardStats } from '../../types';
import { getDashboardStats } from '../../config/assetService';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        { name: 'Total IT Assets', value: stats?.totalAssets || 0, icon: MonitorSmartphone, color: 'bg-primary-500' },
        { name: 'Assigned to Staff', value: stats?.assignedAssets || 0, icon: CheckCircle2, color: 'bg-emerald-500' },
        { name: 'Available in Stock', value: stats?.availableAssets || 0, icon: Clock, color: 'bg-blue-500' },
        { name: 'Under Repair', value: stats?.underRepair || 0, icon: AlertTriangle, color: 'bg-amber-500' },
    ];

    // We will handle loading inline inside the layout

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Real-time metrics for Avon Pharmo Chem IT assets.
                </p>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.name} className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow-sm border border-gray-100 sm:px-6 sm:pt-6 hover:shadow-md transition-shadow">
                                    <dt>
                                        <div className={`absolute rounded-lg p-3 ${item.color}`}>
                                            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </div>
                                        <p className="ml-16 truncate text-sm font-medium text-gray-500">
                                            {item.name}
                                        </p>
                                    </dt>
                                    <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {item.value}
                                        </p>
                                    </dd>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                        {/* Assets by Category */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                                Assets by Category
                            </h3>
                            <div className="space-y-4">
                                {stats && Object.entries(stats.byCategory).map(([category, count]) => (
                                    <div key={category} className="flex items-center">
                                        <div className="w-24 text-sm font-medium text-gray-600">{category}</div>
                                        <div className="flex-1 ml-4 relative">
                                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                <div
                                                    className="bg-primary-500 h-2.5 rounded-full"
                                                    style={{ width: `${(count / stats.totalAssets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-12 text-right text-sm font-medium text-gray-900">{count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Assets by Location */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">
                                Assets by Location
                            </h3>
                            <div className="space-y-4">
                                {stats && Object.entries(stats.byLocation).map(([location, count]) => (
                                    <div key={location} className="flex items-center">
                                        <div className="w-28 text-sm font-medium text-gray-600">{location}</div>
                                        <div className="flex-1 ml-4 relative">
                                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                <div
                                                    className="bg-emerald-500 h-2.5 rounded-full"
                                                    style={{ width: `${(count / stats.totalAssets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-12 text-right text-sm font-medium text-gray-900">{count}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
