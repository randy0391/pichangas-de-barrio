<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateConvocatoriaRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'location' => 'sometimes|string|max:255',
            'match_date' => 'sometimes|date',
            'match_time' => 'sometimes|date_format:H:i',
            'max_players' => 'sometimes|integer|min:1',
            'num_teams' => 'sometimes|integer|min:2',
            'rival' => 'nullable|string|max:255',
            'status' => 'nullable|in:abierta,cerrada,completada,cancelada',
        ];
    }
}