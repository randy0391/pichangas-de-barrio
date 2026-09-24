<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('multas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('convocatoria_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 8, 2);
            $table->string('reason'); // 'falta', 'tardanza', or custom
            $table->enum('status', ['pendiente', 'en_revision', 'pagada'])->default('pendiente');
            $table->string('payment_receipt')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('multas');
    }
};
