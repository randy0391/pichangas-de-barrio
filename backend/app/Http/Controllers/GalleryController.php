<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreGalleryRequest;
use App\Http\Requests\UpdateGalleryRequest;
use App\Http\Resources\GalleryResource;
use App\Models\Gallery;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $query = Gallery::with(['media' => function($q) {
            $q->orderBy('sort_order', 'asc')->orderBy('id', 'desc');
        }])->withCount('media')->orderBy('created_at', 'desc');

        $perPage = (int) $request->query('per_page', 24);
        return GalleryResource::collection($query->paginate($perPage));
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
            $data['cover_image'] = $request->file('cover_image')->store('galleries', config('filesystems.default', 'public'));
        }
        return new GalleryResource(Gallery::create($data));
    }

    public function update(UpdateGalleryRequest $request, $id)
    {
        $gallery = Gallery::findOrFail($id);
        $data = $request->validated();
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('galleries', config('filesystems.default', 'public'));
        }
        $gallery->update($data);
        return new GalleryResource($gallery);
    }

    public function destroy($id)
    {
        Gallery::findOrFail($id)->delete();
        return response()->noContent();
    }
}
