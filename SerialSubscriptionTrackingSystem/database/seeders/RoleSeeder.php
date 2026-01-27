<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Roles are now stored directly in the User model
        // No separate roles table needed for MongoDB
        $this->command->info('Roles are stored directly in User documents for MongoDB.');
    }
}
