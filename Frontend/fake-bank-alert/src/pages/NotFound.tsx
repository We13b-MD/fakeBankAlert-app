import { Shield, Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="flex items-center justify-center mb-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-2xl shadow-lg">
                        <Shield className="w-10 h-10 text-teal-500" strokeWidth={2.5} />
                    </div>
                </div>

                {/* 404 Text */}
                <h1 className="text-7xl font-bold text-slate-900 mb-2">404</h1>
                <h2 className="text-2xl font-bold text-slate-700 mb-3">Page Not Found</h2>
                <p className="text-slate-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="w-full sm:w-auto border-slate-300 hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Link to="/" className="w-full sm:w-auto">
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
