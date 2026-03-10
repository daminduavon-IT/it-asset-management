import { useEffect, useState } from 'react';
import {
    MonitorSmartphone,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { DashboardStats } from '../../types';
import { getDashboardStats } from '../../config/assetService';
import toast from 'react-hot-toast';

// Chart Colors based on brand and standard dashboard colors
const CATEGORY_COLORS = ['#005500', '#F29100', '#FDB913', '#059669', '#3b82f6', '#8b5cf6', '#f43f5e'];
const LOCATION_COLORS = ['#3f6212', '#F29100', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

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
                                <div key={item.name} className="relative overflow-hidden rounded-xl bg-white px-4 pb-12 pt-5 shadow-sm border border-gray-100 sm:px-6 sm:pt-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <h3 className="text-base font-bold leading-6 text-gray-900 mb-6 border-b border-gray-50 pb-4">
                                Assets by Category
                            </h3>
                            <div className="flex-1 min-h-[350px] sm:min-h-[300px] w-full relative">
                                {stats && Object.keys(stats.byCategory).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="40%"
                                                innerRadius={50}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {Object.entries(stats.byCategory).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [`${value} Assets`, 'Count']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={80}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', paddingTop: '20px', lineHeight: '20px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                                        No category data available
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Assets by Location */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <h3 className="text-base font-bold leading-6 text-gray-900 mb-6 border-b border-gray-50 pb-4">
                                Assets by Location
                            </h3>
                            <div className="flex-1 min-h-[350px] sm:min-h-[300px] w-full relative">
                                {stats && Object.keys(stats.byLocation).length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={Object.entries(stats.byLocation).map(([name, value]) => ({ name, value }))}
                                                cx="50%"
                                                cy="40%"
                                                innerRadius={50}
                                                outerRadius={90}
                                                paddingAngle={2}
                                                dataKey="value"
                                            >
                                                {Object.entries(stats.byLocation).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [`${value} Assets`, 'Count']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', zIndex: 50 }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={80}
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '12px', paddingTop: '20px', lineHeight: '20px' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 font-medium">
                                        No location data available
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Service Reminders */}
                    {stats?.serviceReminders && stats.serviceReminders.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-bold leading-6 text-gray-900">
                                    Upcoming Service Reminders
                                </h3>
                                <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    {stats.serviceReminders.length} Due Soon
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {stats.serviceReminders.map(asset => (
                                    <Link key={asset.id} to={`/assets/${asset.id}`} className="block">
                                        <div className="border border-gray-100 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/50 transition-colors group cursor-pointer relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 truncate pr-4">{asset.assetName}</h4>
                                                    <p className="text-xs text-gray-500">{asset.refNumber}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100/50">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                                <span className="text-sm font-medium text-orange-600">
                                                    Due: {new Date(asset.nextServiceDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
