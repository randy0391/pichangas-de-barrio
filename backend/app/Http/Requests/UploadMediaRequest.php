<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gallery_id' => 'nullable|exists:galleries,id',
            'post_id' => 'nullable|exists:posts,id',
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,webp,mp4,mov,avi|max:20480', // 20MB max
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string',
            'sort_order' => 'integer',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Debes seleccionar un archivo para subir.',
            'file.mimes' => 'El archivo debe ser una foto (JPG, PNG, WEBP, GIF) o un video (MP4, MOV, AVI).',
            'file.max' => 'El archivo no puede superar los 20MB.',
        ];
    }
}