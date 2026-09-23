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

    public function update(\App\Http\Requests\UpdateGalleryRequest $request, $id)
    {
        $gallery = Gallery::findOrFail($id);
        $data = $request->validated();
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('galleries', 'public');
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