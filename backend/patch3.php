<?php
$dcPath = __DIR__ . '/app/Http/Controllers/DashboardController.php';
$dcContent = file_get_contents($dcPath);

// Patch recentConvocatorias in adminDashboard
$dcContent = preg_replace(
    '/(Convocatoria::with\(\'creator\'\))/',
    "$1\n            ->withCount(['confirmaciones as confirmed_count' => function(\$q) { \$q->where('status', 'confirmado'); }])",
    $dcContent,
    1,
    $count // but we want to patch ONLY the second one if the first one is already patched.
);

// Actually, since the first one is already patched, it will match the first one AGAIN and add another withCount if I use the regex.
// Let's just fix it properly.
$dcContent = str_replace(
    "\$recentConvocatorias = Convocatoria::with('creator')\n            ->orderBy",
    "\$recentConvocatorias = Convocatoria::with('creator')\n            ->withCount(['confirmaciones as confirmed_count' => function(\$q) { \$q->where('status', 'confirmado'); }])\n            ->orderBy",
    $dcContent
);
$dcContent = str_replace(
    "\$recentConvocatorias = Convocatoria::with('creator')\r\n            ->orderBy",
    "\$recentConvocatorias = Convocatoria::with('creator')\r\n            ->withCount(['confirmaciones as confirmed_count' => function(\$q) { \$q->where('status', 'confirmado'); }])\r\n            ->orderBy",
    $dcContent
);

file_put_contents($dcPath, $dcContent);
echo "Patched adminDashboard";
