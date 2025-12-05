<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use App\Models\User; // ✅ This line fixes the error

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['admin', 'supplier', 'tpu', 'inspection', 'gsps'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }

        // Assign admin role to user with ID 1
        $user = User::find(1);
        if ($user) {
            $user->assignRole('admin');
        }
    }
}
