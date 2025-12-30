import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Facebook, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { handleMetaOAuthCallback } from '../../lib/meta-ads';

export const MetaAdsCallback: React.FC = () => {
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Connecting to Facebook...');

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get code and state from URL
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');
                const errorReason = urlParams.get('error_reason');

                if (error) {
                    setStatus('error');
                    setMessage(errorReason || 'Authorization was denied or failed.');
                    return;
                }

                if (!code) {
                    setStatus('error');
                    setMessage('No authorization code received from Facebook.');
                    return;
                }

                setMessage('Exchanging authorization code...');
                await handleMetaOAuthCallback(code, state || undefined);
                
                setStatus('success');
                setMessage('Successfully connected to Facebook! Redirecting...');
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = '/integrations/meta-ads';
                }, 2000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Failed to connect to Facebook.');
            }
        };

        processCallback();
    }, []);

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div className="flex justify-center">
                        {status === 'processing' && (
                            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                        )}
                        {status === 'success' && (
                            <CheckCircle className="h-12 w-12 text-green-600" />
                        )}
                        {status === 'error' && (
                            <XCircle className="h-12 w-12 text-red-600" />
                        )}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                        <Facebook className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-semibold text-gray-900">
                            {status === 'processing' && 'Connecting...'}
                            {status === 'success' && 'Connected!'}
                            {status === 'error' && 'Connection Failed'}
                        </h2>
                    </div>
                    
                    <p className="text-gray-600">{message}</p>
                    
                    {status === 'error' && (
                        <button
                            onClick={() => window.location.href = '/integrations/meta-ads'}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Go Back
                        </button>
                    )}
                </div>
            </div>
        </Layout>
    );
};

