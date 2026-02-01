import { AlertCircle, CheckCircle2 } from "lucide-react";

interface DraftAlertProps {
    status?: string;
    product: {
        name?: string;
        mainCategoryId?: number | null;
        description?: string;
        basePrice?: number;
        hasCoverImage?: boolean;
        complianceConfirmed?: boolean;
    };
    className?: string;
}

export function DraftAlert({ status, product, className }: DraftAlertProps) {
    if (status === 'published') return null; // Show for 'draft', undefined, null, etc.

    const requiredFields = [
        { key: 'name', label: 'Product Name' },
        { key: 'mainCategoryId', label: 'Main Category' },
        { key: 'description', label: 'Description' },
        { key: 'basePrice', label: 'Base Price' },
        { key: 'hasCoverImage', label: 'Cover Image' },
        { key: 'complianceConfirmed', label: 'Compliance Declaration' },
    ] as const;

    const missingFields = requiredFields.filter(field => {
        const val = product[field.key as keyof typeof product];
        // Check for undefined, null, empty string, or negative number (for price)
        if (val === undefined || val === null) return true;
        if (typeof val === 'string' && val.trim() === '') return true;
        if (typeof val === 'number' && val < 0) return true;
        if (typeof val === 'boolean' && val === false) return true; // Check for hasCoverImage
        return false;
    });

    return (
        <div className={`p-4 rounded-lg border flex items-start gap-4 bg-orange-50 border-orange-200 text-orange-900 ${className || ''}`}>
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
                <h3 className="font-semibold mb-1 text-orange-800">Product is in Draft Status</h3>
                <p className="text-sm mb-2 text-orange-700/90">
                    The admin will not be able to approve this product until it's published.
                </p>


                {missingFields.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-sm font-medium text-orange-800">Required to publish:</span>
                        {missingFields.map(field => (
                            <span
                                key={field.key}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                            >
                                {field.label}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="mt-2 flex items-center text-sm text-green-700 font-medium">
                        <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-600" />
                        All required fields are filled. You can now publish this product.
                    </div>
                )}
            </div>
        </div>
    );
}
