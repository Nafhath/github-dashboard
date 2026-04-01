import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshAuth } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const finish = async () => {
            const status = searchParams.get('status');

            if (status === 'success') {
                await refreshAuth();
                showToast('Signed in with GitHub', 'success');
                navigate('/', { replace: true });
                return;
            }

            showToast('GitHub sign-in failed. Please try again.', 'error');
            navigate('/', { replace: true });
        };

        finish();
    }, [navigate, refreshAuth, searchParams, showToast]);

    return (
        <div className="min-h-screen bg-[#0b121e] flex items-center justify-center text-slate-200">
            <div className="text-center space-y-4">
                <Spinner size={42} />
                <p className="text-sm text-slate-400">Finishing GitHub sign-in...</p>
            </div>
        </div>
    );
};
