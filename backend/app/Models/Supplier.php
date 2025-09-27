<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'abn',
        'primary_contact_person',
        'email_address',
        'phone_number',
        'street_address',
        'city',
        'state',
        'postcode',
        'entity_type',
        'entity_status',
        'product_categories'
    ];

    protected $casts = [
        'product_categories' => 'array',
    ];

    // --- FIX: ADD THESE RELATIONSHIPS ---
    /**
     * Get the ingredients supplied by this supplier.
     * This was missing and causing a 500 error in SupplierController.
     */
    public function ingredients()
    {
        return $this->hasMany(Ingredient::class, 'primary_supplier_id');
    }

    /**
     * Get the invoices from this supplier.
     * This was missing and causing a 500 error in SupplierController.
     */
    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}
