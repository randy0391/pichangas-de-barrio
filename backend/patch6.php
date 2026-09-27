<?php
$content = file_get_contents("app/Http/Controllers/MemberController.php");
$content = str_replace("\$validated['is_approved'] = true;", "\$validated['is_approved'] = 'true';", $content);
file_put_contents("app/Http/Controllers/MemberController.php", $content);
echo "Patched.";
