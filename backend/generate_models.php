<?php

$baseDir = __DIR__;

// Create models
$models = [
    'User' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'phone', 'position', 'jersey_number', 'avatar', 'bio', 'role', 'status'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
PHP,
    'Post' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'slug', 'content', 'featured_image', 'category', 'status', 'published_at'
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
PHP,
    'Event' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'location', 'event_date', 'event_time', 'cover_image', 'status'
    ];

    protected $casts = [
        'event_date' => 'date',
        'event_time' => 'datetime:H:i',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function registrations()
    {
        return $this->hasMany(EventRegistration::class);
    }
}
PHP,
    'EventRegistration' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id', 'user_id', 'status'
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
PHP,
    'Convocatoria' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Convocatoria extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'location', 'match_date', 'match_time', 'max_players', 'rival', 'status'
    ];

    protected $casts = [
        'match_date' => 'date',
        'match_time' => 'datetime:H:i',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function confirmaciones()
    {
        return $this->hasMany(Confirmacion::class);
    }
}
PHP,
    'Confirmacion' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Confirmacion extends Model
{
    use HasFactory;
    protected $table = 'confirmaciones';

    protected $fillable = [
        'convocatoria_id', 'user_id', 'status', 'notes', 'confirmed_at'
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
    ];

    public function convocatoria()
    {
        return $this->belongsTo(Convocatoria::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
PHP,
    'Gallery' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'title', 'description', 'cover_image'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function media()
    {
        return $this->hasMany(Media::class);
    }
}
PHP,
    'Media' => <<<'PHP'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'gallery_id', 'post_id', 'user_id', 'type', 'file_path', 'thumbnail_path', 'title', 'caption', 'sort_order'
    ];

    public function gallery()
    {
        return $this->belongsTo(Gallery::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
PHP
];

foreach ($models as $name => $content) {
    file_put_contents("$baseDir/app/Models/$name.php", $content);
}

// Ensure Directories
$dirs = [
    'app/Http/Middleware',
    'app/Http/Resources',
    'app/Http/Requests',
    'app/Http/Controllers',
    'database/migrations',
    'database/seeders'
];
foreach ($dirs as $dir) {
    if (!is_dir("$baseDir/$dir")) {
        mkdir("$baseDir/$dir", 0755, true);
    }
}

// Admin Middleware
file_put_contents("$baseDir/app/Http/Middleware/AdminMiddleware.php", <<<'PHP'
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request);
        }
        return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
    }
}
PHP
);

// We need to register this middleware in bootstrap/app.php
$appPhp = file_get_contents("$baseDir/bootstrap/app.php");
if (strpos($appPhp, 'admin\' => \App\Http\Middleware\AdminMiddleware::class') === false) {
    $appPhp = str_replace(
        "'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,",
        "'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,\n            'admin' => \App\Http\Middleware\AdminMiddleware::class,",
        $appPhp
    );
    file_put_contents("$baseDir/bootstrap/app.php", $appPhp);
}

echo "Base files created.\n";
