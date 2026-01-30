<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Run RoleSeeder first to create all roles
        $this->call(RoleSeeder::class);
        
        // Then run UserSeeder to create users with roles
        $this->call(UserSeeder::class);
    }
}
