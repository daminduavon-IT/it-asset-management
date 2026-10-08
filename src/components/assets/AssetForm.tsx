import type { ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import type { AssetInput } from '../../types';
import { isRefNumberTaken } from '../../config/assetService';
import {
    CATEGORIES, CONDITIONS, DEPARTMENTS, LOCATIONS, STATUSES, isComputerCategory, withCurrent
} from '../../constants/assets';

interface AssetFormProps {
    defaultValues: Partial<AssetInput>;
    /** Asset being edited — excluded from the duplicate reference-number check */
    assetId?: string;
    submitLabel: string;
    submittingLabel: string;
    onSubmit: (data: AssetInput) => Promise<void>;
    onCancel: () => void;
}

const INPUT_CLASS = 'mt-2 block w-full rounded-xl border-0 py-2.5 text-slate-900 bg-white/50 backdrop-blur-sm shadow-sm ring-1 ring-inset ring-slate-200 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 transition-all aria-[invalid=true]:ring-red-400';
const SECTION_TITLE_CLASS = 'text-base font-semibold leading-7 text-gray-900 border-b pb-2 mb-4';

// Empty number inputs mean "not set"; the service fills the DB default
const toNumber = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : Number(value));

function Field({ id, label, error, hint, className = 'sm:col-span-3', children }: {
    id: string;
    label: string;
    error?: string;
    hint?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={className}>
            <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900">{label}</label>
            {children}
            {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
            {error && <p id={`${id}-error`} className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

export default function AssetForm({ defaultValues, assetId, submitLabel, submittingLabel, onSubmit, onCancel }: AssetFormProps) {
    const { register, handleSubmit, control, setError, formState: { errors, isSubmitting } } = useForm<AssetInput>({ defaultValues });
    const watchedCategory = useWatch({ control, name: 'category' });
    const isComputerAsset = isComputerCategory(watchedCategory);

    // Accessibility wiring shared by every control
    const a11y = (name: keyof AssetInput) => ({
        id: `asset-${name}`,
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `asset-${name}-error` : undefined,
    });

    const submit = async (values: AssetInput) => {
        try {
            if (await isRefNumberTaken(values.refNumber, assetId)) {
                setError('refNumber', { type: 'duplicate', message: 'This reference number is already used by another asset' }, { shouldFocus: true });
                return;
            }
        } catch (error) {
            // Could not verify — let the save go ahead rather than block the user
            console.error('Could not check reference number:', error);
        }
        await onSubmit(values);
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate className="p-6 sm:p-8 space-y-8">

            {/* Section 1: Basic Details */}
            <div>
                <h3 className={SECTION_TITLE_CLASS}>Device Information</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <Field id="asset-assetName" label="Asset Name *" error={errors.assetName?.message}>
                        <input
                            type="text"
                            {...register('assetName', {
                                required: 'Asset name is required',
                                validate: value => value.trim() !== '' || 'Asset name is required'
                            })}
                            {...a11y('assetName')}
                            className={INPUT_CLASS}
                            placeholder="e.g. Dell Latitude 5420"
                        />
                    </Field>

                    <Field id="asset-category" label="Category *" error={errors.category?.message}>
                        <select {...register('category', { required: 'Category is required' })} {...a11y('category')} className={INPUT_CLASS}>
                            <option value="">Select category</option>
                            {withCurrent(CATEGORIES, defaultValues.category).map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </Field>

                    <Field id="asset-brand" label="Brand" className="sm:col-span-2">
                        <input type="text" {...register('brand')} {...a11y('brand')} className={INPUT_CLASS} />
                    </Field>

                    <Field id="asset-model" label="Model" className="sm:col-span-2">
                        <input type="text" {...register('model')} {...a11y('model')} className={INPUT_CLASS} />
                    </Field>

                    <Field id="asset-serialNumber" label="Serial Number" className="sm:col-span-2">
                        <input type="text" {...register('serialNumber')} {...a11y('serialNumber')} className={INPUT_CLASS} />
                    </Field>
                </div>
            </div>

            {/* Section 2: Specifications (Laptop/Desktop only) */}
            {isComputerAsset && (
                <div>
                    <h3 className={SECTION_TITLE_CLASS}>Specifications</h3>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                        <Field id="asset-processorType" label="Processor Type">
                            <input type="text" {...register('processorType')} {...a11y('processorType')} placeholder="e.g. Intel Core i5 11th Gen" className={INPUT_CLASS} />
                        </Field>
                        <Field id="asset-ram" label="RAM">
                            <input type="text" {...register('ram')} {...a11y('ram')} placeholder="e.g. 8 GB" className={INPUT_CLASS} />
                        </Field>
                        <Field id="asset-storage" label="Storage">
                            <input type="text" {...register('storage')} {...a11y('storage')} placeholder="e.g. 512 GB SSD" className={INPUT_CLASS} />
                        </Field>
                        <Field id="asset-os" label="Operating System">
                            <input type="text" {...register('os')} {...a11y('os')} placeholder="e.g. Windows 11 Pro" className={INPUT_CLASS} />
                        </Field>
                    </div>
                </div>
            )}

            {/* Section 3: Tracking & Financial */}
            <div>
                <h3 className={SECTION_TITLE_CLASS}>Financial & Tracking</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <Field id="asset-refNumber" label="Internal Ref Number *" error={errors.refNumber?.message} className="sm:col-span-2">
                        <input
                            type="text"
                            {...register('refNumber', {
                                required: 'Reference number is required',
                                validate: value => value.trim() !== '' || 'Reference number is required'
                            })}
                            {...a11y('refNumber')}
                            className={INPUT_CLASS}
                            placeholder="APC-IT-XXX-000"
                        />
                    </Field>

                    <Field id="asset-quantity" label="Quantity" error={errors.quantity?.message} className="sm:col-span-2">
                        <input
                            type="number"
                            min={1}
                            step={1}
                            {...register('quantity', {
                                setValueAs: toNumber,
                                validate: value => value === undefined || (Number.isInteger(value) && value >= 1) || 'Quantity must be a whole number of at least 1'
                            })}
                            {...a11y('quantity')}
                            className={INPUT_CLASS}
                        />
                    </Field>

                    <Field id="asset-unitPrice" label="Unit Price (LKR)" error={errors.unitPrice?.message} className="sm:col-span-2">
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            {...register('unitPrice', {
                                setValueAs: toNumber,
                                validate: value => value === undefined || (Number.isFinite(value) && value >= 0) || 'Unit price cannot be negative'
                            })}
                            {...a11y('unitPrice')}
                            className={INPUT_CLASS}
                        />
                    </Field>

                    <Field id="asset-purchaseDate" label="Purchase Date" className="sm:col-span-2">
                        <input type="date" {...register('purchaseDate', { deps: 'warrantyEnd' })} {...a11y('purchaseDate')} className={INPUT_CLASS} />
                    </Field>

                    <Field id="asset-warrantyEnd" label="Warranty End" error={errors.warrantyEnd?.message} className="sm:col-span-2">
                        <input
                            type="date"
                            {...register('warrantyEnd', {
                                validate: (value, values) =>
                                    !value || !values.purchaseDate || value >= values.purchaseDate || 'Warranty end must be on or after the purchase date'
                            })}
                            {...a11y('warrantyEnd')}
                            className={INPUT_CLASS}
                        />
                    </Field>

                    <Field id="asset-nextServiceDate" label="Next Service Date" hint="Optional: Set a reminder for upcoming maintenance." className="sm:col-span-2">
                        <input type="date" {...register('nextServiceDate')} {...a11y('nextServiceDate')} className={INPUT_CLASS} />
                    </Field>
                </div>
            </div>

            {/* Section 4: Status & Assignment */}
            <div>
                <h3 className={SECTION_TITLE_CLASS}>Allocation</h3>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                    <Field id="asset-location" label="Location">
                        <select {...register('location')} {...a11y('location')} className={INPUT_CLASS}>
                            {withCurrent(LOCATIONS, defaultValues.location).map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </Field>

                    <Field id="asset-department" label="Department *" error={errors.department?.message}>
                        <select {...register('department', { required: 'Department is required' })} {...a11y('department')} className={INPUT_CLASS}>
                            <option value="">Select department</option>
                            {withCurrent(DEPARTMENTS, defaultValues.department).map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </Field>

                    <Field id="asset-assignedTo" label="Assigned To (Employee Name)" error={errors.assignedTo?.message}>
                        <input
                            type="text"
                            {...register('assignedTo', {
                                validate: (value, values) => {
                                    const assignee = (value ?? '').trim();
                                    if (values.status === 'Assigned' && !assignee) return 'Enter who this asset is assigned to, or change the status';
                                    if (values.status === 'Available' && assignee) return 'An "Available" asset cannot have an assignee — clear this or set the status to "Assigned"';
                                    return true;
                                }
                            })}
                            {...a11y('assignedTo')}
                            className={INPUT_CLASS}
                        />
                    </Field>

                    <Field id="asset-status" label="Status *">
                        <select {...register('status', { required: true, deps: 'assignedTo' })} {...a11y('status')} className={INPUT_CLASS}>
                            {STATUSES.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </Field>

                    <Field id="asset-condition" label="Condition">
                        <select {...register('condition')} {...a11y('condition')} className={INPUT_CLASS}>
                            {withCurrent(CONDITIONS, defaultValues.condition).map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </Field>

                    <Field id="asset-remarks" label="Remarks">
                        <input type="text" {...register('remarks')} {...a11y('remarks')} className={INPUT_CLASS} />
                    </Field>
                </div>
            </div>

            <div className="flex items-center justify-end gap-x-4 border-t pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm font-semibold leading-6 text-slate-600 flex items-center gap-2 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors"
                >
                    <X className="h-5 w-5" />
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:scale-105 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 flex items-center gap-2 transition-all duration-300"
                >
                    <Save className="h-5 w-5" />
                    {isSubmitting ? submittingLabel : submitLabel}
                </button>
            </div>
        </form>
    );
}
