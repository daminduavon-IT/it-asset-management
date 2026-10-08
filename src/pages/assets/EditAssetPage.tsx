import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Asset, AssetInput } from '../../types';
import { getAssetById, updateAsset } from '../../config/assetService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AssetForm from '../../components/assets/AssetForm';
import { usePageTitle } from '../../hooks/usePageTitle';
import { toDateInput } from '../../utils/format';

// Stored nulls become '' so every input is controlled; dates fit <input type="date">
const toFormValues = (asset: Asset): AssetInput => ({
    assetName: asset.assetName,
    category: asset.category,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    refNumber: asset.refNumber,
    quantity: asset.quantity,
    unitPrice: asset.unitPrice,
    totalValue: asset.totalValue,
    location: asset.location,
    assignedTo: asset.assignedTo ?? '',
    department: asset.department,
    status: asset.status,
    condition: asset.condition,
    purchaseDate: toDateInput(asset.purchaseDate),
    warrantyEnd: toDateInput(asset.warrantyEnd),
    nextServiceDate: toDateInput(asset.nextServiceDate),
    remarks: asset.remarks ?? '',
    processorType: asset.processorType ?? '',
    ram: asset.ram ?? '',
    storage: asset.storage ?? '',
    os: asset.os ?? ''
});

export default function EditAssetPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [asset, setAsset] = useState<Asset | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    usePageTitle(asset ? `Edit ${asset.assetName}` : 'Edit Asset');

    useEffect(() => {
        if (!id) return;
        let ignore = false;

        const fetchAsset = async () => {
            setLoading(true);
            setLoadError(false);
            try {
                const data = await getAssetById(id);
                if (ignore) return;
                if (data) {
                    setAsset(data);
                } else {
                    toast.error('Asset not found');
                    navigate('/assets', { replace: true });
                }
            } catch (error) {
                if (ignore) return;
                setLoadError(true);
                toast.error('Failed to load asset data');
                console.error(error);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchAsset();
        return () => {
            ignore = true;
        };
    }, [id, navigate, reloadKey]);

    const onSubmit = async (data: AssetInput) => {
        if (!id) return;
        try {
            await updateAsset(id, data);
            toast.success('Asset updated successfully!');
            navigate('/assets');
        } catch (error) {
            toast.error('Failed to update asset. Check permissions.');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <div className="py-20 flex justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (loadError || !asset) {
        return (
            <div className="text-center py-16 glass-card rounded-3xl max-w-2xl mx-auto mt-10 space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Could not load this asset</h3>
                <p className="text-slate-500">Check your connection and try again.</p>
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => setReloadKey(key => key + 1)}
                        className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md"
                    >
                        Try again
                    </button>
                    <Link to="/assets" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                        <ArrowLeft className="h-4 w-4" />
                        Back to inventory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit IT Asset</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Modify the details for this inventory item.
                </p>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <AssetForm
                    key={asset.id}
                    defaultValues={toFormValues(asset)}
                    assetId={asset.id}
                    submitLabel="Update Asset"
                    submittingLabel="Updating..."
                    onSubmit={onSubmit}
                    onCancel={() => navigate('/assets')}
                />
            </div>
        </div>
    );
}
