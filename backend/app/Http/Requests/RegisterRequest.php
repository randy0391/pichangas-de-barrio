<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        $isBeforeMidnight = now()->timezone('America/Lima')->lt(\Carbon\Carbon::parse('2026-09-24 00:00:00', 'America/Lima'));

        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'dni' => 'required|string|max:20|unique:users',
            'phone' => 'required|string|max:20|unique:users',
            'position' => 'nullable|in:portero,defensa,medio,delantero',
            'birth_date' => 'required|date',
            'payment_receipt' => $isBeforeMidnight ? 'nullable|file|mimes:jpeg,png,jpg,pdf|max:5120' : 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ];
    }
}