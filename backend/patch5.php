<?php
$content = file_get_contents("app/Http/Controllers/MemberController.php");
$find = "\$user = User::create(\$validated);\n        return new UserResource(\$user);";
$replace = "try {\n            \$user = User::create(\$validated);\n            return new UserResource(\$user);\n        } catch (\Exception \$e) {\n            return response()->json(['message' => \$e->getMessage(), 'trace' => \$e->getTraceAsString()], 500);\n        }";
$content = str_replace($find, $replace, $content);
file_put_contents("app/Http/Controllers/MemberController.php", $content);
echo "Patched.";
