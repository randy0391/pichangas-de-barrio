<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreConvocatoriaRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'maps_url' => 'nullable|string',
            'match_date' => 'required|date',
            'match_time' => 'required|date_format:H:i',
            'max_players' => 'integer|min:1',
            'num_teams' => 'integer|min:2|max:10',
            'rival' => 'nullable|string|max:255',
            'cost_per_player' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:abierta,cerrada,completada,cancelada',
        ];
    }
}