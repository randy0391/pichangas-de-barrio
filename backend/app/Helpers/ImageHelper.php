<?php

namespace App\Helpers;

class ImageHelper
{
    public static function getUrl($path)
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http')) return $path;

        if (env('FILESYSTEM_DISK') === 'cloudinary' && env('CLOUDINARY_URL')) {
            $parts = explode('@', env('CLOUDINARY_URL'));
            $cloudName = end($parts);
            return "https://res.cloudinary.com/{$cloudName}/image/upload/{$path}";
        }

        return request()->getSchemeAndHttpHost() . '/storage/' . $path;
    }
}
