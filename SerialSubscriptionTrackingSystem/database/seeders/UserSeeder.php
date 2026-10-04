<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seed account emails and passwords are read from the .env file.
     * No credentials are stored in this file. For local development only;
     * do not run this seeder on the deployed (production) system.
     */
    public function run(): void
    {
        $accounts = [
            ['role' => 'admin',      'name' => 'Admin User',       'email' => env('SEED_ADMIN_EMAIL'),      'password' => env('SEED_ADMIN_PASSWORD')],
            ['role' => 'tpu',        'name' => 'TPU Officer',      'email' => env('SEED_TPU_EMAIL'),        'password' => env('SEED_TPU_PASSWORD')],
            ['role' => 'gsps',       'name' => 'GSPS Officer',     'email' => env('SEED_GSPS_EMAIL'),       'password' => env('SEED_GSPS_PASSWORD')],
            ['role' => 'inspection', 'name' => 'Inspection Team',  'email' => env('SEED_INSPECTION_EMAIL'), 'password' => env('SEED_INSPECTION_PASSWORD')],
            ['role' => 'supplier',   'name' => 'Supplier Account', 'email' => env('SEED_SUPPLIER_EMAIL'),   'password' => env('SEED_SUPPLIER_PASSWORD')],
        ];

        foreach ($accounts as $account) {
            // Skip any account whose email is not set in .env
            if (empty($account['email'])) {
                continue;
            }

            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    // Use the password from .env, or a random one if none is set
                    'password' => Hash::make($account['password'] ?: Str::random(20)),
                    'email_verified_at' => now(),
                    'role' => $account['role'],
                ]
            );
        }
    }
}