<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'gallery_id' => 'nullable|exists:galleries,id',
            'post_id' => 'nullable|exists:posts,id',
            'file' => 'required|file|mimes:jpeg,png,jpg,gif,mp4,mov,avi|max:20480', // 20MB max
            'title' => 'nullable|string|max:255',
            'caption' => 'nullable|string',
            'sort_order' => 'integer',
        ];
    }
}