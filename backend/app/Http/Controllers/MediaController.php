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
        
        $path = $file->store('media', env('FILESYSTEM_DISK', 'public'));

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