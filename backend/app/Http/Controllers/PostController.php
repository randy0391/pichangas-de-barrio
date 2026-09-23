<?php
namespace App\Http\Controllers;

use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Post::with('author');
        if (!($request->user() && $request->user()->role === 'admin')) {
            $query->where('status', 'publicado');
        }
        $query->orderBy('created_at', 'desc');
        return PostResource::collection($query->paginate(12));
    }

    public function show($slug)
    {
        return new PostResource(Post::with('author')->where('slug', $slug)->firstOrFail());
    }

    public function store(StorePostRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        
        if (!empty($data['link'])) {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(5)->get('https://api.microlink.io/?url=' . urlencode($data['link']));
                if ($response->successful()) {
                    $meta = $response->json();
                    if (isset($meta['data'])) {
                        $data['link_title'] = $meta['data']['title'] ?? null;
                        $data['link_description'] = $meta['data']['description'] ?? null;
                        $data['link_image'] = isset($meta['data']['image']['url']) ? $meta['data']['image']['url'] : (isset($meta['data']['logo']['url']) ? $meta['data']['logo']['url'] : null);
                        
                        // If user didn't write much content, replace it with link description
                        if (empty($data['content']) || strlen(trim($data['content'])) <= 5) {
                            $data['content'] = !empty($data['link_description']) ? $data['link_description'] : 'Contenido compartido';
                        }
                        // If user didn't write title, replace it with link title
                        if (empty($data['title'])) {
                            $data['title'] = !empty($data['link_title']) ? $data['link_title'] : 'Enlace Compartido';
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore errors
            }
        }
        
        // Fallback if still empty
        if (empty($data['title'])) $data['title'] = 'Noticia sin título ' . time();
        if (empty($data['content'])) $data['content'] = 'Sin descripción.';
        
        $data['slug'] = Str::slug($data['title']) . '-' . time();
        
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('posts', env('FILESYSTEM_DISK', 'public'));
        } elseif (!empty($data['link_image'])) {
            $data['featured_image'] = $data['link_image'];
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
        if (isset($data['link']) && $data['link'] !== $post->link) {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(5)->get('https://api.microlink.io/?url=' . urlencode($data['link']));
                if ($response->successful()) {
                    $meta = $response->json();
                    if (isset($meta['data'])) {
                        $data['link_title'] = $meta['data']['title'] ?? null;
                        $data['link_description'] = $meta['data']['description'] ?? null;
                        $data['link_image'] = isset($meta['data']['image']['url']) ? $meta['data']['image']['url'] : (isset($meta['data']['logo']['url']) ? $meta['data']['logo']['url'] : null);
                        
                        // If user didn't write much content, replace it with link description
                        if (empty($data['content']) || strlen(trim($data['content'])) <= 5) {
                            $data['content'] = !empty($data['link_description']) ? $data['link_description'] : 'Contenido compartido';
                        }
                        // If user didn't write title, replace it with link title
                        if (empty($data['title'])) {
                            $data['title'] = !empty($data['link_title']) ? $data['link_title'] : 'Enlace Compartido';
                        }
                    }
                }
            } catch (\Exception $e) {
                // Ignore errors
            }
        }
        
        // Ensure not completely empty if they erased it
        if (array_key_exists('title', $data) && empty($data['title'])) {
            $data['title'] = $data['link_title'] ?? ($post->link_title ?? 'Enlace Compartido');
        }
        if (array_key_exists('content', $data) && empty($data['content'])) {
            $data['content'] = $data['link_description'] ?? ($post->link_description ?? 'Contenido compartido');
        }

        if (isset($data['title']) && $data['title'] !== $post->title) {
            $data['slug'] = Str::slug($data['title']) . '-' . time();
        }
        
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('posts', env('FILESYSTEM_DISK', 'public'));
        } elseif (isset($data['link_image']) && !$post->featured_image) {
            $data['featured_image'] = $data['link_image'];
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