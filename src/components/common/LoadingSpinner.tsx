interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3'
    };

    const spinner = (
        <div className={`animate-spin rounded-full border-t-transparent border-primary-600 ${sizeClasses[size]}`}></div>
    );

    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50/50 backdrop-blur-sm z-50 fixed inset-0">
                {spinner}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4">
            {spinner}
        </div>
    );
}
