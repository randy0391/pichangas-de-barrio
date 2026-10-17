<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGalleryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:15360',
        ];
    }

    public function messages(): array
    {
        return [
            'cover_image.image' => 'El archivo debe ser una imagen valida.',
            'cover_image.mimes' => 'La imagen de portada debe estar en formato JPG, JPEG, PNG, WEBP o GIF.',
            'cover_image.max' => 'La imagen de portada no debe pesar mas de 15MB.',
        ];
    }
}