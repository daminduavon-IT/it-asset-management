import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { addServiceLog } from '../../services/serviceLogService';
import type { ServiceLog } from '../../types';

interface Props {
    asset: { id: string; assetName: string; category: string };
    onClose: () => void;
    onSuccess: () => void;
}

type ServiceFormData = Omit<ServiceLog, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'createdByName' | 'assetId' | 'assetName' | 'assetCategory'>;

const INPUT_CLASS = 'mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 aria-[invalid=true]:ring-red-400';
const LABEL_CLASS = 'block text-sm font-medium leading-6 text-gray-900';

export default function AddServiceRecordModal({ asset, onClose, onSuccess }: Props) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ServiceFormData>();

    // Escape closes the dialog
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onClose, isSubmitting]);

    const onSubmit = async (data: ServiceFormData) => {
        try {
            await addServiceLog({
                assetId: asset.id,
                assetName: asset.assetName,
                assetCategory: asset.category,
                serviceDate: data.serviceDate,
                serviceType: data.serviceType,
                serviceDetails: data.serviceDetails,
                partsReplaced: data.partsReplaced,
                technicianName: data.technicianName,
                serviceProvider: data.serviceProvider,
                serviceCost: data.serviceCost ?? undefined,
                nextServiceDate: data.nextServiceDate,
                remarks: data.remarks
            });
            toast.success('Service record added successfully!');
            onSuccess();
        } catch (error) {
            toast.error('Failed to add service record.');
            console.error(error);
        }
    };

    return (
        /* Modal backdrop */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-modal-title"
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl text-[#005500]">
                            <Wrench className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="service-modal-title" className="text-lg font-bold text-gray-900">Add Service Record</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{asset.assetName}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-6">
                    {/* Row 1: Service Date + Type */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="service-serviceDate" className={LABEL_CLASS}>Service Date *</label>
                            <input
                                id="service-serviceDate"
                                type="date"
                                autoFocus
                                {...register('serviceDate', { required: 'Service date is required', deps: 'nextServiceDate' })}
                                aria-invalid={errors.serviceDate ? true : undefined}
                                className={INPUT_CLASS}
                            />
                            {errors.serviceDate && <span className="text-red-500 text-xs mt-1">{errors.serviceDate.message}</span>}
                        </div>
                        <div>
                            <label htmlFor="service-serviceType" className={LABEL_CLASS}>Service Type *</label>
                            <select
                                id="service-serviceType"
                                {...register('serviceType', { required: 'Service type is required' })}
                                aria-invalid={errors.serviceType ? true : undefined}
                                className={INPUT_CLASS}
                            >
                                <option value="">Select type</option>
                                <option value="Full Service">Full Service</option>
                                <option value="Repair">Repair</option>
                                <option value="OS Reinstall">OS Reinstall</option>
                                <option value="Hardware Upgrade">Hardware Upgrade</option>
                                <option value="Preventive Maintenance">Preventive Maintenance</option>
                                <option value="Cleaning">Cleaning</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.serviceType && <span className="text-red-500 text-xs mt-1">{errors.serviceType.message}</span>}
                        </div>
                    </div>

                    {/* Row 2: Service Details */}
                    <div>
                        <label htmlFor="service-serviceDetails" className={LABEL_CLASS}>Service Details</label>
                        <textarea
                            id="service-serviceDetails"
                            {...register('serviceDetails')}
                            rows={3}
                            placeholder="Describe what was done during this service..."
                            className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 resize-none"
                        />
                    </div>

                    {/* Row 3: Parts Replaced + Technician */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="service-partsReplaced" className={LABEL_CLASS}>Parts Replaced</label>
                            <input
                                id="service-partsReplaced"
                                type="text"
                                {...register('partsReplaced')}
                                placeholder="e.g. Battery, Cooling Fan"
                                className={INPUT_CLASS}
                            />
                            <p className="mt-1 text-xs text-gray-400">Separate multiple parts with commas</p>
                        </div>
                        <div>
                            <label htmlFor="service-technicianName" className={LABEL_CLASS}>Technician Name</label>
                            <input
                                id="service-technicianName"
                                type="text"
                                {...register('technicianName')}
                                placeholder="e.g. Nimal"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {/* Row 4: Service Provider + Cost */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="service-serviceProvider" className={LABEL_CLASS}>Service Provider</label>
                            <input
                                id="service-serviceProvider"
                                type="text"
                                {...register('serviceProvider')}
                                placeholder="e.g. Internal IT"
                                className={INPUT_CLASS}
                            />
                        </div>
                        <div>
                            <label htmlFor="service-serviceCost" className={LABEL_CLASS}>Service Cost (LKR)</label>
                            <input
                                id="service-serviceCost"
                                type="number"
                                min={0}
                                step="0.01"
                                {...register('serviceCost', {
                                    setValueAs: (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
                                    validate: (value) =>
                                        value === undefined || value === null || (Number.isFinite(value) && value >= 0) || 'Service cost cannot be negative'
                                })}
                                aria-invalid={errors.serviceCost ? true : undefined}
                                placeholder="e.g. 15000"
                                className={INPUT_CLASS}
                            />
                            {errors.serviceCost && <span className="text-red-500 text-xs mt-1">{errors.serviceCost.message}</span>}
                        </div>
                    </div>

                    {/* Row 5: Next Service Date + Remarks */}
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="service-nextServiceDate" className={LABEL_CLASS}>Next Service Date</label>
                            <input
                                id="service-nextServiceDate"
                                type="date"
                                {...register('nextServiceDate', {
                                    validate: (value, values) =>
                                        !value || !values.serviceDate || value > values.serviceDate || 'Next service date must be after the service date'
                                })}
                                aria-invalid={errors.nextServiceDate ? true : undefined}
                                className={INPUT_CLASS}
                            />
                            {errors.nextServiceDate && <span className="text-red-500 text-xs mt-1">{errors.nextServiceDate.message}</span>}
                        </div>
                        <div>
                            <label htmlFor="service-remarks" className={LABEL_CLASS}>Remarks</label>
                            <input
                                id="service-remarks"
                                type="text"
                                {...register('remarks')}
                                placeholder="e.g. Working properly"
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-x-4 border-t pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-semibold leading-6 text-gray-900 flex items-center gap-2 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-[#005500] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
