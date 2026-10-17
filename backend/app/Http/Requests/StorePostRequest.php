<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'category' => 'required|in:noticia,anuncio,novedad',
            'status' => 'required|in:borrador,publicado',
            'featured_image' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,gif|max:15360',
            'link' => 'nullable|url|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'featured_image.image' => 'El archivo debe ser una imagen valida.',
            'featured_image.mimes' => 'La imagen destacada debe estar en formato JPG, JPEG, PNG, WEBP o GIF.',
            'featured_image.max' => 'La imagen destacada no debe pesar mas de 15MB.',
        ];
    }
}