<?php
/**
 * Master fix script - applies all critical patches
 */

$fixes = [];

// ============================================================
// FIX 1: MemberController::update() - is_approved boolean issue
// ============================================================
$file = 'app/Http/Controllers/MemberController.php';
$content = file_get_contents($file);

// Add is_approved conversion before $user->update($validated)
$search = '$user->update($validated);';
$replace = <<<'PHP'
if (isset($validated['is_approved'])) {
            $validated['is_approved'] = $validated['is_approved'] ? 'true' : 'false';
        }
        if (isset($validated['position']) && empty($validated['position'])) $validated['position'] = null;
        if (isset($validated['jersey_number']) && empty($validated['jersey_number'])) $validated['jersey_number'] = null;
        $user->update($validated);
PHP;

if (strpos($content, "validated['is_approved'] ? 'true'") === false) {
    $content = str_replace($search, $replace, $content);
    file_put_contents($file, $content);
    $fixes[] = "FIX 1: MemberController::update() - is_approved + position/jersey_number conversion added";
} else {
    $fixes[] = "FIX 1: MemberController::update() - already patched";
}

// ============================================================
// FIX 2: PublicHomeController - where('is_approved', true) -> 'true'
// ============================================================
$file = 'app/Http/Controllers/PublicHomeController.php';
$content = file_get_contents($file);
$content = str_replace("->where('is_approved', true)", "->where('is_approved', 'true')", $content);
file_put_contents($file, $content);
$fixes[] = "FIX 2: PublicHomeController - is_approved boolean -> string";

// ============================================================
// FIX 3: AuthController::register - use config() instead of env()
// ============================================================
$file = 'app/Http/Controllers/AuthController.php';
$content = file_get_contents($file);
$content = str_replace(
    "env('FILESYSTEM_DISK', 'public')",
    "config('filesystems.default', 'public')",
    $content
);
file_put_contents($file, $content);
$fixes[] = "FIX 3: AuthController - env() -> config() for filesystem disk";

// ============================================================
// FIX 4: MultaController - use config() instead of env()
// ============================================================
$file = 'app/Http/Controllers/MultaController.php';
$content = file_get_contents($file);
$content = str_replace(
    "env('FILESYSTEM_DISK', 'public')",
    "config('filesystems.default', 'public')",
    $content
);
file_put_contents($file, $content);
$fixes[] = "FIX 4: MultaController - env() -> config() for filesystem disk";

// ============================================================
// FIX 5: ImageHelper - use config() instead of env()
// ============================================================
$file = 'app/Helpers/ImageHelper.php';
$content = file_get_contents($file);

$oldHelper = <<<'PHP'
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
PHP;

$newHelper = <<<'PHP'
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
PHP;

$content = str_replace($oldHelper, $newHelper, $content);
file_put_contents($file, $content);
$fixes[] = "FIX 5: ImageHelper - env() -> config(), added PDF/raw support";

// ============================================================
// FIX 6: AdminSeeder - is_approved boolean
// ============================================================
$file = 'database/seeders/AdminSeeder.php';
if (file_exists($file)) {
    $content = file_get_contents($file);
    $content = str_replace("'is_approved' => true", "'is_approved' => 'true'", $content);
    file_put_contents($file, $content);
    $fixes[] = "FIX 6: AdminSeeder - is_approved boolean -> string";
} else {
    $fixes[] = "FIX 6: AdminSeeder - file not found, skipped";
}

// ============================================================
// FIX 7: Check ALL other controllers for env('FILESYSTEM_DISK')
// ============================================================
$controllers = glob('app/Http/Controllers/*.php');
foreach ($controllers as $file) {
    $content = file_get_contents($file);
    if (strpos($content, "env('FILESYSTEM_DISK'") !== false) {
        $content = str_replace(
            "env('FILESYSTEM_DISK', 'public')",
            "config('filesystems.default', 'public')",
            $content
        );
        $content = str_replace(
            "env('FILESYSTEM_DISK')",
            "config('filesystems.default')",
            $content
        );
        file_put_contents($file, $content);
        $fixes[] = "FIX 7: " . basename($file) . " - env() -> config()";
    }
}

// ============================================================
// FIX 8: Check ALL controllers for where('is_approved', true/false) queries
// ============================================================
foreach ($controllers as $file) {
    $content = file_get_contents($file);
    $changed = false;
    if (strpos($content, "where('is_approved', true)") !== false) {
        $content = str_replace("where('is_approved', true)", "where('is_approved', 'true')", $content);
        $changed = true;
    }
    if (strpos($content, "where('is_approved', false)") !== false) {
        $content = str_replace("where('is_approved', false)", "where('is_approved', 'false')", $content);
        $changed = true;
    }
    if ($changed) {
        file_put_contents($file, $content);
        $fixes[] = "FIX 8: " . basename($file) . " - is_approved query boolean -> string";
    }
}

// ============================================================
// REPORT
// ============================================================
echo "=== ALL FIXES APPLIED ===\n";
foreach ($fixes as $i => $fix) {
    echo ($i + 1) . ". " . $fix . "\n";
}
echo "\nTotal fixes: " . count($fixes) . "\n";
