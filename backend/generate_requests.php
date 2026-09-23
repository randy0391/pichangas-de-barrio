<?php
$baseDir = __DIR__;

$requests = [
    'LoginRequest' => <<<'PHP'
<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'email' => 'required|email',
            'password' => 'required',
        ];
    }
}
PHP,
    'RegisterRequest' => <<<'PHP'
<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
PHP,
    'StorePostRequest' => <<<'PHP'
<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|in:noticia,anuncio,novedad',
            'status' => 'required|in:borrador,publicado',
            'featured_image' => 'nullable|image|max:2048',
        ];
    }
}
PHP,
    'UpdatePostRequest' => <<<'PHP'
<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'category' => 'sometimes|in:noticia,anuncio,novedad',
            'status' => 'sometimes|in:borrador,publicado',
            'featured_image' => 'nullable|image|max:2048',
        ];
    }
}
PHP,
    'StoreEventRequest' => <<<'PHP'
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
            'cover_image' => 'nullable|image|max:2048',
            'status' => 'nullable|in:proximo,completado,cancelado',
        ];
    }
}
PHP,
    'UpdateEventRequest' => <<<'PHP'
<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'location' => 'sometimes|string|max:255',
            'event_date' => 'sometimes|date',
            'event_time' => 'sometimes|date_format:H:i',
            'cover_image' => 'nullable|image|max:2048',
            'status' => 'nullable|in:proximo,completado,cancelado',
        ];
    }
}
PHP,
    'StoreConvocatoriaRequest' => <<<'PHP'
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
            'match_date' => 'required|date',
            'match_time' => 'required|date_format:H:i',
            'max_players' => 'integer|min:1',
            'rival' => 'nullable|string|max:255',
            'status' => 'nullable|in:abierta,cerrada,completada,cancelada',
        ];
    }
}
PHP,
    'UpdateConvocatoriaRequest' => <<<'PHP'
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
            'rival' => 'nullable|string|max:255',
            'status' => 'nullable|in:abierta,cerrada,completada,cancelada',
        ];
    }
}
PHP,
    'StoreGalleryRequest' => <<<'PHP'
<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class StoreGalleryRequest extends FormRequest
{
    public function authorize() { return true; }
    public function rules() {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|max:2048',
        ];
    }
}
PHP,
    'UploadMediaRequest' => <<<'PHP'
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
PHP
];

foreach ($requests as $name => $content) {
    file_put_contents("$baseDir/app/Http/Requests/$name.php", $content);
}

echo "Requests created.\n";
