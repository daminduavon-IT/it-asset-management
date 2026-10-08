import type { ReactNode } from 'react';

/** Branded full-screen frame shared by the sign-in and password-reset pages. */
export default function AuthShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#005500] to-emerald-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-white">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl">
                        <img src="/avon-logo-sm.png" className="h-24 w-auto mx-auto object-contain" alt="Company Logo" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                    Avon Pharmo Chem
                </h2>
                <p className="mt-2 text-center text-sm text-emerald-100">
                    {subtitle}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white/95 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/50">
                    {children}
                </div>
            </div>
        </div>
    );
}
