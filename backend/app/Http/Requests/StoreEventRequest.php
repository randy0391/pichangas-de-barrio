<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'event_date' => 'required|date',
            'event_time' => 'required|date_format:H:i',
            'max_participants' => 'nullable|integer|min:1',
            'cover_image' => 'nullable|image|max:2048',
            'status' => 'nullable|in:proximo,completado,cancelado',
        ];
    }
}