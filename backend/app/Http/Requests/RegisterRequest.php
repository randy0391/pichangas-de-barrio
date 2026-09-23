<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'dni' => 'required|string|max:20|unique:users',
            'phone' => 'required|string|max:20',
            'position' => 'nullable|in:portero,defensa,medio,delantero',
            'payment_receipt' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ];
    }
}