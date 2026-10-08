import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { AssetInput } from '../../types';
import { createAsset } from '../../config/assetService';
import AssetForm from '../../components/assets/AssetForm';
import { usePageTitle } from '../../hooks/usePageTitle';

const NEW_ASSET_DEFAULTS: Partial<AssetInput> = {
    category: '',
    department: '',
    location: 'Head Office',
    status: 'Available',
    condition: 'Good',
    quantity: 1
};

export default function AddAssetPage() {
    usePageTitle('Add Asset');
    const navigate = useNavigate();

    const onSubmit = async (data: AssetInput) => {
        try {
            await createAsset(data);
            toast.success('Asset added successfully!');
            navigate('/assets');
        } catch (error) {
            toast.error('Failed to add asset. Check permissions or network.');
            console.error(error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New IT Asset</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Register a new device into the Avon Pharmo Chem IT inventory system.
                </p>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <AssetForm
                    defaultValues={NEW_ASSET_DEFAULTS}
                    submitLabel="Save Asset"
                    submittingLabel="Saving..."
                    onSubmit={onSubmit}
                    onCancel={() => navigate('/assets')}
                />
            </div>
        </div>
    );
}
