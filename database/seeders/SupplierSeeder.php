<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::firstOrCreate(['company_name' => 'Metro Coffee Co', 'email_address' => 'orders@metrocoffee.com']);
        Supplier::firstOrCreate(['company_name' => 'Fresh Produce Plus', 'email_address' => 'supply@freshplus.com.au']);
    }
}
