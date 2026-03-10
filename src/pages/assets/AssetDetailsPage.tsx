import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, DollarSign, MapPin, Tag, User, Info, Hash, Monitor, Activity, Building } from 'lucide-react';
import type { Asset } from '../../types';
import { getAssetById } from '../../config/assetService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AssetDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAsset = async () => {
            if (!id) return;
            try {
                const data = await getAssetById(id);
                setAsset(data);
            } catch (error) {
                console.error('Failed to load asset', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAsset();
    }, [id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/30';
            case 'Assigned': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30';
            case 'Under Repair': return 'bg-[#F29100] text-white shadow-lg shadow-[#F29100]/30';
            case 'Retired': return 'bg-red-500 text-white shadow-lg shadow-red-500/30';
            default: return 'bg-gray-500 text-white shadow-lg shadow-gray-500/30';
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    if (!asset) {
        return (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
                <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Monitor className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Asset not found</h3>
                <p className="text-gray-500 mt-2 mb-6">The asset you are looking for does not exist or has been removed.</p>
                <Link to="/assets" className="inline-flex items-center gap-2 bg-[#005500] text-white px-6 py-2.5 rounded-lg hover:bg-emerald-800 transition-colors font-medium shadow-md">
                    <ArrowLeft className="h-4 w-4" />
                    Return to inventory
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Premium Header Banner */}
            <div className="bg-gradient-to-br from-[#005500] via-[#004400] to-emerald-900 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                {/* Decorative background blur elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-20 w-48 h-48 bg-[#FDB913] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-start gap-8">
                    <Link to="/assets" className="inline-flex items-center gap-2 text-emerald-100/80 hover:text-white transition-all text-sm font-semibold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 hover:border-white/20">
                        <ArrowLeft className="h-4 w-4" /> Back to Inventory
                    </Link>
                    
                    <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                {asset.assetName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${getStatusBadge(asset.status)}`}>
                                    {asset.status.toUpperCase()}
                                </span>
                                <span className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-emerald-50 text-sm font-medium flex items-center gap-2 shadow-inner">
                                    <Tag className="h-3.5 w-3.5 text-emerald-300" /> Ref: {asset.refNumber}
                                </span>
                                <span className="bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 text-emerald-50 text-sm font-medium flex items-center gap-2 shadow-inner">
                                    <Hash className="h-3.5 w-3.5 text-emerald-300" /> SN: {asset.serialNumber || 'N/A'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                            <Link
                                to={`/assets/edit/${asset.id}`}
                                className="inline-flex items-center gap-2 rounded-xl bg-white text-[#005500] hover:bg-emerald-50 px-6 py-3 text-sm font-bold shadow-xl transition-all hover:-translate-y-0.5"
                            >
                                <Edit className="h-4 w-4" />
                                Edit Asset
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Columns */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Device Specifications */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-emerald-50/50 to-transparent">
                            <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl text-[#005500] shadow-sm transform group-hover:scale-110 transition-transform">
                                <Monitor className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Device Specifications</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                            <InfoRow icon={Tag} label="Category" value={asset.category} />
                            <InfoRow icon={Info} label="Brand & Model" value={`${asset.brand} ${asset.model}`} />
                            <InfoRow icon={Hash} label="Serial Number" value={asset.serialNumber || 'N/A'} mono />
                            <InfoRow icon={Hash} label="Internal Reference" value={asset.refNumber} mono />
                        </div>
                    </div>

                    {/* Financial Data */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center gap-4 bg-gradient-to-r from-orange-50/50 to-transparent">
                            <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl text-[#F29100] shadow-sm transform group-hover:scale-110 transition-transform">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Financial Data</h3>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
                            <div>
                                <dt className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Unit Price</dt>
                                <dd className="text-3xl font-extrabold text-[#005500] drop-shadow-sm">
                                    {asset.unitPrice ? `LKR ${asset.unitPrice.toLocaleString()}` : 'N/A'}
                                </dd>
                            </div>
                            <InfoRow icon={Calendar} label="Purchase Date" value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'} />
                            {asset.nextServiceDate && (
                                <InfoRow icon={Calendar} label="Next Service Date" value={new Date(asset.nextServiceDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} highlight />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-8 lg:col-span-1">
                    {/* Allocation */}
                    <div className="bg-gradient-to-b from-white to-gray-50/50 rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative hover:shadow-lg transition-shadow duration-300 group">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none"></div>
                        
                        <div className="px-8 py-6 border-b border-gray-100/50 flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl text-blue-600 shadow-sm transform group-hover:scale-110 transition-transform">
                                <User className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Allocation</h3>
                        </div>
                        <div className="p-8 space-y-8 relative z-10">
                            <InfoRow icon={User} label="Assigned To" value={asset.assignedTo || 'Unassigned'} highlight />
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
                            <InfoRow icon={Building} label="Department" value={asset.department || 'Not Specified'} />
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
                            <InfoRow icon={MapPin} label="Location" value={asset.location || 'Unknown'} />
                            <div className="h-px bg-gradient-to-r from-gray-200 to-transparent w-full" />
                            <InfoRow icon={Activity} label="Remarks" value={asset.remarks || 'No remarks added.'} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for cleaner and more consistent rows
function InfoRow({ icon: Icon, label, value, mono = false, highlight = false }: any) {
    return (
        <div className="group/row">
            <dt className="text-sm font-semibold text-gray-400 flex items-center gap-2 mb-2 uppercase tracking-wider group-hover/row:text-[#005500] transition-colors">
                <Icon className="h-4 w-4 opacity-70" />
                {label}
            </dt>
            <dd className={`text-base ${highlight ? 'text-blue-700 font-bold text-xl' : 'text-gray-900 font-semibold text-lg'} ${mono ? 'font-mono bg-gray-100/80 px-3 py-1.5 inline-block rounded-lg border border-gray-200 text-sm shadow-inner' : ''}`}>
                {value}
            </dd>
        </div>
    );
}
