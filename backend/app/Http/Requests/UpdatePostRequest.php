<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'category' => 'nullable|in:noticia,anuncio,novedad',
            'status' => 'nullable|in:borrador,publicado',
            'featured_image' => 'nullable|image|max:2048',
            'link' => 'nullable|url|max:500',
        ];
    }
}