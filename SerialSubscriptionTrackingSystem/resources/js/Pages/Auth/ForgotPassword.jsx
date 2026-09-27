import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />

            <div className="min-h-screen flex items-center justify-center bg-[#0046A3] relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <img
                        src="/images/dost-logo1.png"
                        alt="DOST Logo"
                        className="h-10 sm:h-14"
                    />
                </div>

                <div className="absolute bottom-[-8rem] left-[-80px] sm:bottom-[-12rem] sm:left-[-150px] md:bottom-[-17rem] md:left-[-250px]">
                    <img
                        src="/images/red-circle.png"
                        alt="Decor Right"
                        className="h-[200px] sm:h-[300px] md:h-[400px] lg:h-[550px] transform scale-x-[-1] opacity-90"
                    />
                </div>

                <div className="absolute top-0 right-0">
                    <img
                        src="/images/red-bars.png"
                        alt="Decor"
                        className="h-24 sm:h-32 md:h-40 opacity-90"
                    />
                </div>

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 sm:left-auto sm:transform-none sm:translate-x-0 sm:bottom-6 sm:right-6 flex items-center space-x-2 sm:space-x-3 bg-white/90 px-2 sm:px-3 py-2 rounded-md max-w-[90%] sm:max-w-none">
                    <img
                        src="/images/dost-logo1.png"
                        alt="DOST Logo"
                        className="h-8 sm:h-10 flex-shrink-0"
                    />
                    <p className="text-[10px] sm:text-xs text-black font-medium leading-tight">
                        Department of Science and Technology <br />
                        Science and Technology Information Institute
                    </p>
                </div>

                <div className="bg-white shadow-lg rounded-md w-full max-w-[360px] p-6 sm:p-8 mb-16 sm:mb-0">
                    <h1 className="mb-2 text-xl font-semibold text-[#004A98]">
                        Forgot Password
                    </h1>

                    <p className="mb-4 text-sm text-gray-600">
                        Forgot your password? No problem. Just let us know your email
                        address and we will email you a password reset link that will
                        allow you to choose a new one.
                    </p>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="mb-4">
                            <input
                                id="email"
                                type="text"
                                name="email"
                                value={data.email}
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                autoComplete="email"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gray-100 border border-gray-400 py-2 rounded-md hover:bg-gray-200 transition font-medium disabled:opacity-50"
                        >
                            Email Password Reset Link
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}

