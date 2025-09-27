<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;
    protected $fillable = ['supplier_id', 'invoice_number', 'invoice_date', 'due_date', 'total', 'status', 'invoice_file'];

    // --- FIX: ADD THIS RELATIONSHIP ---
    /**
     * Get the supplier that this invoice belongs to.
     * This was missing and causing a 500 error in InvoiceController.
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
