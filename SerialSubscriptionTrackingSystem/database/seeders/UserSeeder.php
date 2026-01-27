<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@dost.gov.ph'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'role' => 'admin',
            ]
        );

        // TPU User
        $tpu = User::updateOrCreate(
            ['email' => 'tpu@dost.gov.ph'],
            [
                'name' => 'TPU Officer',
                'password' => Hash::make('tpu123'),
                'email_verified_at' => now(),
                'role' => 'tpu',
            ]
        );

        // GSPS User
        $gsps = User::updateOrCreate(
            ['email' => 'gsps@dost.gov.ph'],
            [
                'name' => 'GSPS Officer',
                'password' => Hash::make('gsps123'),
                'email_verified_at' => now(),
                'role' => 'gsps',
            ]
        );

        // Inspection Team User
        $inspection = User::updateOrCreate(
            ['email' => 'inspection@dost.gov.ph'],
            [
                'name' => 'Inspection Team',
                'password' => Hash::make('inspection123'),
                'email_verified_at' => now(),
                'role' => 'inspection',
            ]
        );

        // Supplier User
        $supplier = User::updateOrCreate(
            ['email' => 'supplier@email.com'],
            [
                'name' => 'Supplier Account',
                'password' => Hash::make('supplier123'),
                'email_verified_at' => now(),
                'role' => 'supplier',
            ]
        );
    }
}
