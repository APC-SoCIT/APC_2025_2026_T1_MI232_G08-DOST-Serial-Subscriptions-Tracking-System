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

                        {/* Divider */}
                        <div className="flex items-center justify-center my-3">
                            <hr className="w-1/3 border-gray-400" />
                            <span className="px-2 text-sm text-gray-500">or</span>
                            <hr className="w-1/3 border-gray-400" />
                        </div>

                        {/* Sign up */}
                        <p className="text-sm text-gray-600 text-center">
                            Need an account?{' '}
                            <Link
                                href={route('register')}
                                className="font-bold hover:underline"
                            >
                                SIGN UP
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
