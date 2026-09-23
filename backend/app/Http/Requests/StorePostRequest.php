<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'category' => 'required|in:noticia,anuncio,novedad',
            'status' => 'required|in:borrador,publicado',
            'featured_image' => 'nullable|image|max:2048',
            'link' => 'nullable|url|max:500',
        ];
    }
}