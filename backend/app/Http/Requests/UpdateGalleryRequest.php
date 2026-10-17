<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGalleryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:1000',
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
