import { useForm, Link, Head } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        company: '',
        contact: '',
        password: '',
        terms: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Register" />
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
                        alt="Decor Circle"
                        className="h-[550px] opacity-90"
                    />
                </div>

                {/* Decorative red circle top-right */}
                <div className="absolute top-[-17rem] right-[-250px] flex">
                    <img
                        src="/images/red-circle.png"
                        alt="Decor Circle"
                        className="h-[550px] opacity-90"
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

                {/* Register card */}
                <div className="bg-white shadow-lg rounded-md w-[400px] p-8">
                    <form onSubmit={submit}>
                        {/* First + Last Name */}
                        <div className="flex space-x-3 mb-4">
                            <input
                                type="text"
                                name="first_name"
                                value={data.first_name}
                                onChange={(e) =>
                                    setData('first_name', e.target.value)
                                }
                                placeholder="First Name"
                                className="w-1/2 border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            />
                            <input
                                type="text"
                                name="last_name"
                                value={data.last_name}
                                onChange={(e) =>
                                    setData('last_name', e.target.value)
                                }
                                placeholder="Last Name"
                                className="w-1/2 border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <input
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                placeholder="Email"
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Company */}
                        <div className="mb-4">
                            <input
                                type="text"
                                name="company"
                                value={data.company}
                                onChange={(e) =>
                                    setData('company', e.target.value)
                                }
                                placeholder="Company"
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Contact */}
                        <div className="mb-4">
                            <input
                                type="text"
                                name="contact"
                                value={data.contact}
                                onChange={(e) =>
                                    setData('contact', e.target.value)
                                }
                                placeholder="Contact"
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <input
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder="Password"
                                className="w-full border border-gray-400 px-3 py-2 rounded-md focus:ring focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Terms of Service */}
                        <div className="flex items-center mb-4 text-sm">
                            <input
                                type="checkbox"
                                name="terms"
                                checked={data.terms}
                                onChange={(e) =>
                                    setData('terms', e.target.checked)
                                }
                                className="mr-2"
                                required
                            />
                            <span>
                                I have read and agree to the{' '}
                                <a
                                    href="#"
                                    className="text-blue-600 hover:underline"
                                >
                                    terms of service
                                </a>
                            </span>
                        </div>

                        {/* Sign-up button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gray-100 border border-gray-400 py-2 rounded-md hover:bg-gray-200 transition font-medium"
                        >
                            Sign-up
                        </button>

                        {/* Already registered */}
                        <p className="text-sm text-gray-600 text-center mt-3">
                            Already have an account?{' '}
                            <Link
                                href={route('login')}
                                className="font-bold hover:underline"
                            >
                                SIGN IN
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </>
    );
}
