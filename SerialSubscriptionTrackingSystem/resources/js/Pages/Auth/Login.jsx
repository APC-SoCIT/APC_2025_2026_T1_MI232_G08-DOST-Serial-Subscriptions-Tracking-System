import { useForm, Link, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    // Check for inactivity logout message
    const [inactivityMessage, setInactivityMessage] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reason') === 'inactivity') {
            setInactivityMessage('You were logged out due to inactivity.');
            // Clean up the URL without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen flex items-center justify-center bg-[#0046A3] relative overflow-hidden">
                {/* Top-left DOST logo */}
                <div className="absolute top-6 left-6">
                    <img
                        src="/images/dost-logo1.png"
                        alt="DOST Logo"
                        className="h-14"
                    />
                </div>

                {/* Decorative red circle bottom-left */}
                <div className="absolute bottom-[-17rem] left-[-250px] flex">
                    <img
                        src="/images/red-circle.png"
                        alt="Decor Right"
                        className="h-[550px] transform scale-x-[-1] opacity-90"
                    />
                </div>

                {/* Decorative red bars top-right */}
                <div className="absolute top-0 right-0">
                    <img
                        src="/images/red-bars.png"
                        alt="Decor"
                        className="h-40 opacity-90"
                    />
                </div>

                {/* Bottom-right DOST branding */}
                <div className="absolute bottom-6 right-6 flex items-center space-x-3 bg-white/90 px-3 py-2 rounded-md">
                    <img
                        src="/images/dost-logo1.png"
                        alt="DOST Logo"
                        className="h-10"
                    />
                    <p className="text-xs text-black font-medium leading-tight">
                        Department of Science and Technology <br />
                        Science and Technology Information Institute
                    </p>
                </div>

                {/* Login card */}
                <div className="bg-white shadow-lg rounded-md w-[360px] p-8">
                    {/* Inactivity logout message */}
                    {inactivityMessage && (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                            <p className="text-amber-700 text-sm text-center">
                                {inactivityMessage}
                            </p>
                        </div>
                    )}

                    {/* Status message (e.g., password reset) */}
                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600 text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        {/* Email */}
                        <div className="mb-4">
                            <input
                                type="text"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Email"
                                autoComplete="email"
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Password"
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Sign-in button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gray-100 border border-gray-400 py-2 rounded-md hover:bg-gray-200 transition font-medium"
                        >
                            Sign-in
                        </button>

                        {/* Forgot password */}
                        <div className="mt-3 text-center">
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-gray-700 hover:underline"
                                >
                                    forgot password?
                                </Link>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
