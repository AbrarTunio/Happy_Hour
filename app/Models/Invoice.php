<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;
    protected $fillable = ['supplier_id', 'invoice_number', 'invoice_date', 'due_date', 'total', 'status', 'invoice_file', 'ai_extraction_data'];

    // --- FIX: ADD THIS RELATIONSHIP ---
    /**
     * Get the supplier that this invoice belongs to.
     * This was missing and causing a 500 error in InvoiceController.
     */
    protected $casts = [
        'ai_extraction_data' => 'array',
        'invoice_date' => 'date',
        'due_date' => 'date',
    ];
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
