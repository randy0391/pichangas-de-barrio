<?php
$baseDir = __DIR__;

$controllers = [
    'AuthController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);
        return response()->json(['user' => new UserResource($user), 'token' => $user->createToken('auth')->plainTextToken]);
    }

    public function login(LoginRequest $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }
        $user = Auth::user();
        return response()->json(['user' => new UserResource($user), 'token' => $user->createToken('auth')->plainTextToken]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function user(Request $request)
    {
        return new UserResource($request->user());
    }
}
PHP,
    'PostController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index()
    {
        return PostResource::collection(Post::with('author')->where('status', 'publicado')->paginate(10));
    }

    public function show($slug)
    {
        return new PostResource(Post::with('author')->where('slug', $slug)->firstOrFail());
    }

    public function store(StorePostRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['slug'] = Str::slug($data['title']) . '-' . time();
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('posts', 'public');
        }
        if ($data['status'] === 'publicado') {
            $data['published_at'] = now();
        }
        $post = Post::create($data);
        return new PostResource($post);
    }

    public function update(UpdatePostRequest $request, $id)
    {
        $post = Post::findOrFail($id);
        $data = $request->validated();
        if (isset($data['title']) && $data['title'] !== $post->title) {
            $data['slug'] = Str::slug($data['title']) . '-' . time();
        }
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('posts', 'public');
        }
        if (isset($data['status']) && $data['status'] === 'publicado' && !$post->published_at) {
            $data['published_at'] = now();
        }
        $post->update($data);
        return new PostResource($post);
    }

    public function destroy($id)
    {
        Post::findOrFail($id)->delete();
        return response()->noContent();
    }
}
PHP,
    'EventController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index()
    {
        return EventResource::collection(Event::with('creator')->withCount('registrations')->get());
    }

    public function show($id)
    {
        return new EventResource(Event::with(['creator', 'registrations.user'])->findOrFail($id));
    }

    public function store(StoreEventRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('events', 'public');
        }
        return new EventResource(Event::create($data));
    }

    public function update(UpdateEventRequest $request, $id)
    {
        $event = Event::findOrFail($id);
        $data = $request->validated();
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('events', 'public');
        }
        $event->update($data);
        return new EventResource($event);
    }

    public function destroy($id)
    {
        Event::findOrFail($id)->delete();
        return response()->noContent();
    }

    public function register(Request $request, $id)
    {
        EventRegistration::updateOrCreate(
            ['event_id' => $id, 'user_id' => $request->user()->id],
            ['status' => 'registrado']
        );
        return response()->json(['message' => 'Registered successfully']);
    }

    public function unregister(Request $request, $id)
    {
        EventRegistration::where('event_id', $id)->where('user_id', $request->user()->id)->update(['status' => 'cancelado']);
        return response()->json(['message' => 'Unregistered successfully']);
    }
}
PHP,
    'ConvocatoriaController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreConvocatoriaRequest;
use App\Http\Requests\UpdateConvocatoriaRequest;
use App\Http\Resources\ConvocatoriaResource;
use App\Models\Confirmacion;
use App\Models\Convocatoria;
use Illuminate\Http\Request;

class ConvocatoriaController extends Controller
{
    public function index()
    {
        return ConvocatoriaResource::collection(Convocatoria::with('creator')->get());
    }

    public function show($id)
    {
        return new ConvocatoriaResource(Convocatoria::with(['creator', 'confirmaciones.user'])->findOrFail($id));
    }

    public function store(StoreConvocatoriaRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        return new ConvocatoriaResource(Convocatoria::create($data));
    }

    public function update(UpdateConvocatoriaRequest $request, $id)
    {
        $convocatoria = Convocatoria::findOrFail($id);
        $convocatoria->update($request->validated());
        return new ConvocatoriaResource($convocatoria);
    }

    public function destroy($id)
    {
        Convocatoria::findOrFail($id)->delete();
        return response()->noContent();
    }

    public function confirmar(Request $request, $id)
    {
        Confirmacion::updateOrCreate(
            ['convocatoria_id' => $id, 'user_id' => $request->user()->id],
            ['status' => 'confirmado', 'confirmed_at' => now(), 'notes' => $request->notes]
        );
        return response()->json(['message' => 'Attendance confirmed']);
    }

    public function rechazar(Request $request, $id)
    {
        Confirmacion::updateOrCreate(
            ['convocatoria_id' => $id, 'user_id' => $request->user()->id],
            ['status' => 'rechazado', 'notes' => $request->notes]
        );
        return response()->json(['message' => 'Attendance rejected']);
    }

    public function misConvocatorias(Request $request)
    {
        $userId = $request->user()->id;
        $convocatorias = Convocatoria::whereHas('confirmaciones', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->with(['confirmaciones' => function($q) use ($userId) {
            $q->where('user_id', $userId);
        }])->get();
        return ConvocatoriaResource::collection($convocatorias);
    }
}
PHP,
    'GalleryController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreGalleryRequest;
use App\Http\Resources\GalleryResource;
use App\Models\Gallery;

class GalleryController extends Controller
{
    public function index()
    {
        return GalleryResource::collection(Gallery::withCount('media')->get());
    }

    public function show($id)
    {
        return new GalleryResource(Gallery::with('media')->findOrFail($id));
    }

    public function store(StoreGalleryRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('galleries', 'public');
        }
        return new GalleryResource(Gallery::create($data));
    }

    public function destroy($id)
    {
        Gallery::findOrFail($id)->delete();
        return response()->noContent();
    }
}
PHP,
    'MediaController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Requests\UploadMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function upload(UploadMediaRequest $request)
    {
        $file = $request->file('file');
        $mime = $file->getMimeType();
        $type = Str::startsWith($mime, 'video/') ? 'video' : 'foto';
        
        $path = $file->store('media', 'public');

        $media = Media::create([
            'gallery_id' => $request->gallery_id,
            'post_id' => $request->post_id,
            'user_id' => $request->user()->id,
            'type' => $type,
            'file_path' => $path,
            'title' => $request->title,
            'caption' => $request->caption,
            'sort_order' => $request->sort_order ?? 0,
        ]);

        return new MediaResource($media);
    }

    public function destroy($id)
    {
        Media::findOrFail($id)->delete();
        return response()->noContent();
    }
}
PHP,
    'MemberController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function index()
    {
        return UserResource::collection(User::where('status', 'active')->get());
    }

    public function show($id)
    {
        return new UserResource(User::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update($request->only(['role', 'status']));
        return new UserResource($user);
    }
}
PHP,
    'DashboardController' => <<<'PHP'
<?php
namespace App\Http\Controllers;

use App\Models\Convocatoria;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function userDashboard(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'upcoming_convocatorias' => Convocatoria::where('status', 'abierta')->count(),
            'upcoming_events' => Event::where('status', 'proximo')->count(),
            'participations' => $user->confirmaciones()->where('status', 'confirmado')->count()
        ]);
    }

    public function adminDashboard()
    {
        return response()->json([
            'total_members' => User::count(),
            'active_convocatorias' => Convocatoria::where('status', 'abierta')->count(),
            'recent_activity' => []
        ]);
    }
}
PHP
];

foreach ($controllers as $name => $content) {
    file_put_contents("$baseDir/app/Http/Controllers/$name.php", $content);
}

// Routes
$apiRoutes = <<<'PHP'
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ConvocatoriaController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\DashboardController;

// Public routes
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{id}', [EventController::class, 'show']);
Route::get('/galleries', [GalleryController::class, 'index']);
Route::get('/galleries/{id}', [GalleryController::class, 'show']);

// Auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Events
    Route::post('/events/{id}/register', [EventController::class, 'register']);
    Route::post('/events/{id}/unregister', [EventController::class, 'unregister']);

    // Convocatorias
    Route::get('/convocatorias', [ConvocatoriaController::class, 'index']);
    Route::get('/convocatorias/mis-convocatorias', [ConvocatoriaController::class, 'misConvocatorias']);
    Route::get('/convocatorias/{id}', [ConvocatoriaController::class, 'show']);
    Route::post('/convocatorias/{id}/confirmar', [ConvocatoriaController::class, 'confirmar']);
    Route::post('/convocatorias/{id}/rechazar', [ConvocatoriaController::class, 'rechazar']);

    // Members
    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{id}', [MemberController::class, 'show']);

    // Dashboard
    Route::get('/dashboard/user', [DashboardController::class, 'userDashboard']);

    // Admin routes
    Route::middleware('admin')->group(function () {
        Route::post('/posts', [PostController::class, 'store']);
        Route::put('/posts/{id}', [PostController::class, 'update']);
        Route::delete('/posts/{id}', [PostController::class, 'destroy']);

        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{id}', [EventController::class, 'update']);
        Route::delete('/events/{id}', [EventController::class, 'destroy']);

        Route::post('/convocatorias', [ConvocatoriaController::class, 'store']);
        Route::put('/convocatorias/{id}', [ConvocatoriaController::class, 'update']);
        Route::delete('/convocatorias/{id}', [ConvocatoriaController::class, 'destroy']);

        Route::post('/galleries', [GalleryController::class, 'store']);
        Route::delete('/galleries/{id}', [GalleryController::class, 'destroy']);

        Route::post('/media/upload', [MediaController::class, 'upload']);
        Route::delete('/media/{id}', [MediaController::class, 'destroy']);

        Route::put('/members/{id}', [MemberController::class, 'update']);

        Route::get('/dashboard/admin', [DashboardController::class, 'adminDashboard']);
    });
});
PHP;

file_put_contents("$baseDir/routes/api.php", $apiRoutes);

echo "Controllers and Routes created.\n";
