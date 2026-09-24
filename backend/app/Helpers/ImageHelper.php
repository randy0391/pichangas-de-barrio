<?php

namespace App\Helpers;

class ImageHelper
{
    public static function getUrl($path)
    {
        if (!$path) return null;
        if (str_starts_with($path, 'http')) return $path;

        $disk = config('filesystems.default', 'public');
        $cloudinaryUrl = config('filesystems.disks.cloudinary.url');

        if ($disk === 'cloudinary' && $cloudinaryUrl) {
            $parts = explode('@', $cloudinaryUrl);
            $cloudName = end($parts);
            // Support both image and raw (PDF) uploads
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $resourceType = in_array($ext, ['pdf', 'doc', 'docx', 'zip']) ? 'raw' : 'image';
            return "https://res.cloudinary.com/{$cloudName}/{$resourceType}/upload/{$path}";
        }

        return request()->getSchemeAndHttpHost() . '/storage/' . $path;
    }
}
