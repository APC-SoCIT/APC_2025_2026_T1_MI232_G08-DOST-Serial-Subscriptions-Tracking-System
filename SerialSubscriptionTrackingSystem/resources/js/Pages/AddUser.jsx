import React, { useState } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { router } from "@inertiajs/react";

export default function AddUser() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    password_confirmation: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submit = (e) => {
    e.preventDefault();
    router.post("/users", form, {
      preserveScroll: true,
      onSuccess: () => setErrors({}),
      onError: (validationErrors) => setErrors(validationErrors),
    });
  };

  return (
    <AdminLayout header="Add User">
      <div className="max-w-xl bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Create New User</h3>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            className="w-full border rounded-md px-4 py-2"
            value={form.name}
            onChange={handleChange}
            required
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}

          <input
            type="text"
            name="email"
            placeholder="Email Address"
            autoComplete="email"
            className="w-full border rounded-md px-4 py-2"
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}

          <select
            name="role"
            className="w-full border rounded-md px-4 py-2"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="librarian">Librarian</option>
            <option value="supplier">Supplier</option>
          </select>
          {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full border rounded-md px-4 py-2"
            value={form.password}
            onChange={handleChange}
            required
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}

          <input
            type="password"
            name="password_confirmation"
            placeholder="Confirm Password"
            className="w-full border rounded-md px-4 py-2"
            value={form.password_confirmation}
            onChange={handleChange}
            required
          />
          {errors.password_confirmation && <p className="text-sm text-red-600">{errors.password_confirmation}</p>}

          <button
            type="submit"
            className="w-full bg-[#0f57a3] text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create User
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
