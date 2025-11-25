<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReconciliation extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch',
        'date',
        'status',
        'receipt_file_path',
        'total_sales_from_receipt',
        'recipe_breakdown',
        'total_breakdown_sales',
        'total_cogs',
        'variance',
    ];

    protected $casts = [
        'date' => 'date',
        'recipe_breakdown' => 'array',
    ];
}
