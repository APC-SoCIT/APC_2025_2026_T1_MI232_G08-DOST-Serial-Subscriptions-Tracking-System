import { useForm, Link, Head } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />
            <div className="min-h-screen flex items-center justify-center bg-[#0046A3] relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
                {/* Top-left DOST logo */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <img
                        src="/images/dost-logo1.png"
                        alt="DOST Logo"
                        className="h-10 sm:h-14"
                    />
                </div>

                {/* Decorative red circle bottom-left - scales on different screens */}
                <div className="absolute bottom-[-8rem] left-[-80px] sm:bottom-[-12rem] sm:left-[-150px] md:bottom-[-17rem] md:left-[-250px]">
                    <img
                        src="/images/red-circle.png"
                        alt="Decor Right"
                        className="h-[200px] sm:h-[300px] md:h-[400px] lg:h-[550px] transform scale-x-[-1] opacity-90"
                    />
                </div>

                {/* Decorative red bars top-right - scaled on smaller screens */}
                <div className="absolute top-0 right-0">
                    <img
                        src="/images/red-bars.png"
                        alt="Decor"
                        className="h-24 sm:h-32 md:h-40 opacity-90"
                    />
                </div>

                {/* Bottom-right DOST branding */}
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

                {/* Login card */}
                <div className="bg-white shadow-lg rounded-md w-full max-w-[360px] p-6 sm:p-8 mb-16 sm:mb-0">
                    <form onSubmit={submit}>
                        {/* Email */}
                        <div className="mb-4">
                            <input
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Email"
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
