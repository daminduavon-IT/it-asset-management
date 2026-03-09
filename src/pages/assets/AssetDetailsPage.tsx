import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, DollarSign, MapPin, Tag, User, Info, Hash } from 'lucide-react';
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
            case 'Available': return 'bg-blue-100 text-blue-800';
            case 'Assigned': return 'bg-emerald-100 text-emerald-800';
            case 'Under Repair': return 'bg-amber-100 text-amber-800';
            case 'Retired': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;

    if (!asset) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Asset not found</h3>
                <Link to="/assets" className="mt-4 text-primary-600 hover:text-primary-800">Return to inventory</Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/assets" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            {asset.assetName}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(asset.status)}`}>
                                {asset.status}
                            </span>
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Ref NO: {asset.refNumber} | SN: {asset.serialNumber || 'N/A'}
                        </p>
                    </div>
                </div>
                <Link
                    to={`/assets/edit/${asset.id}`}
                    className="inline-flex items-center gap-2 justify-center rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    Edit Asset
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                            <Info className="h-5 w-5 text-gray-400" />
                            <h3 className="text-base font-semibold text-gray-900">Device Specifications</h3>
                        </div>
                        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Tag className="h-4 w-4" /> Category</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{asset.category}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Tag className="h-4 w-4" /> Brand & Model</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{asset.brand} {asset.model}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Hash className="h-4 w-4" /> Serial Number</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 inline-block rounded border">{asset.serialNumber || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Hash className="h-4 w-4" /> Internal Ref</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 inline-block rounded border">{asset.refNumber}</dd>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                            <h3 className="text-base font-semibold text-gray-900">Financial Data</h3>
                        </div>
                        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Unit Price</dt>
                                <dd className="mt-1 text-lg text-gray-900 font-semibold">
                                    {asset.unitPrice ? `LKR ${asset.unitPrice.toLocaleString()}` : 'N/A'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Calendar className="h-4 w-4" /> Purchase Date</dt>
                                <dd className="mt-1 text-sm text-gray-900">
                                    {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'Unknown'}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Card */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900">Allocation</h3>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><User className="h-4 w-4" /> Assigned To</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-medium">{asset.assignedTo || 'Unassigned'}</dd>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-medium">{asset.location || 'Unknown'}</dd>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <dt className="text-sm font-medium text-gray-500 flex items-center gap-2"><Info className="h-4 w-4" /> Remarks</dt>
                                <dd className="mt-1 text-sm text-gray-900">{asset.remarks || 'No remarks added.'}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
