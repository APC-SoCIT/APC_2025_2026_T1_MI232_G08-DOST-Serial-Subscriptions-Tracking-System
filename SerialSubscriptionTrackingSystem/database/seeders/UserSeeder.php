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
        $admin = User::firstOrCreate(
            ['email' => 'admin@dost.gov.ph'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('Password123'),
                'email_verified_at' => now(),
            ]
        );
        $admin->assignRole('admin');

        // Supplier User
        $supplier = User::firstOrCreate(
            ['email' => 'supplier@dost.gov.ph'],
            [
                'name' => 'Supplier Account',
                'password' => Hash::make('Password123'),
                'email_verified_at' => now(),
            ]
        );
        $supplier->assignRole('supplier');

        // TPU User
        $tpu = User::firstOrCreate(
            ['email' => 'tpu@dost.gov.ph'],
            [
                'name' => 'TPU Officer',
                'password' => Hash::make('Password123'),
                'email_verified_at' => now(),
            ]
        );
        $tpu->assignRole('tpu');

        // GSPS User
        $gsps = User::firstOrCreate(
            ['email' => 'gsps@dost.gov.ph'],
            [
                'name' => 'GSPS Officer',
                'password' => Hash::make('Password123'),
                'email_verified_at' => now(),
            ]
        );
        $gsps->assignRole('gsps');

        // Inspection Team User
        $inspection = User::firstOrCreate(
            ['email' => 'inspection@dost.gov.ph'],
            [
                'name' => 'Inspection Team',
                'password' => Hash::make('Password123'),
                'email_verified_at' => now(),
            ]
        );
        $inspection->assignRole('inspection');
    }
}
