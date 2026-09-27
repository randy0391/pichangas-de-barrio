<?php
// Patch app/Models/User.php
$userPath = 'app/Models/User.php';
$userContent = file_get_contents($userPath);
$userContent = str_replace("'name',", "'nombres', 'apellido_paterno', 'apellido_materno',", $userContent);
$accessor = "
    public function getFullNameAttribute()
    {
        \$parts = array_filter([\$this->nombres, \$this->apellido_paterno, \$this->apellido_materno]);
        return implode(' ', \$parts);
    }
";
if (strpos($userContent, 'getFullNameAttribute') === false) {
    $userContent = preg_replace('/}\s*$/', $accessor . "\n}", $userContent);
}
file_put_contents($userPath, $userContent);

// Patch app/Http/Requests/RegisterRequest.php
$regReq = 'app/Http/Requests/RegisterRequest.php';
$regReqContent = file_get_contents($regReq);
$regReqContent = str_replace("'name' => 'required|string|max:255',", "'nombres' => 'required|string|max:100', 'apellido_paterno' => 'required|string|max:100', 'apellido_materno' => 'required|string|max:100',", $regReqContent);
file_put_contents($regReq, $regReqContent);

// Patch app/Http/Controllers/AuthController.php
$authCtrl = 'app/Http/Controllers/AuthController.php';
$authContent = file_get_contents($authCtrl);
$authContent = str_replace("'name' => \$request->name,", "'nombres' => \$request->nombres, 'apellido_paterno' => \$request->apellido_paterno, 'apellido_materno' => \$request->apellido_materno,", $authContent);
$authContent = str_replace("'name' => 'sometimes|string|max:255',", "'nombres' => 'sometimes|string|max:100', 'apellido_paterno' => 'sometimes|string|max:100', 'apellido_materno' => 'sometimes|string|max:100',", $authContent);
$authContent = str_replace("'name', 'email',", "'nombres', 'apellido_paterno', 'apellido_materno', 'email',", $authContent);
file_put_contents($authCtrl, $authContent);

// Patch app/Http/Controllers/MemberController.php
$memberCtrl = 'app/Http/Controllers/MemberController.php';
$memContent = file_get_contents($memberCtrl);
$memContent = str_replace("\$q->where('name',", "\$q->where('nombres',", $memContent);
$memContent = str_replace("orWhere('nickname',", "orWhere('apellido_paterno', 'like', \"%{\$search}%\")->orWhere('apellido_materno', 'like', \"%{\$search}%\")->orWhere('nickname',", $memContent);
$memContent = str_replace("'name' => 'required|string|max:255',", "'nombres' => 'required|string|max:100', 'apellido_paterno' => 'required|string|max:100', 'apellido_materno' => 'required|string|max:100',", $memContent);
$memContent = str_replace("'name' => 'sometimes|string|max:255',", "'nombres' => 'sometimes|string|max:100', 'apellido_paterno' => 'sometimes|string|max:100', 'apellido_materno' => 'sometimes|string|max:100',", $memContent);
file_put_contents($memberCtrl, $memContent);

// Patch app/Http/Resources/UserResource.php
$resPath = 'app/Http/Resources/UserResource.php';
$resContent = file_get_contents($resPath);
$resContent = str_replace("'name' => \$this->name,", "'name' => \$this->full_name, 'nombres' => \$this->nombres, 'apellido_paterno' => \$this->apellido_paterno, 'apellido_materno' => \$this->apellido_materno, 'full_name' => \$this->full_name,", $resContent);
file_put_contents($resPath, $resContent);

// Patch database/seeders/AdminSeeder.php
$seedPath = 'database/seeders/AdminSeeder.php';
if (file_exists($seedPath)) {
    $seedContent = file_get_contents($seedPath);
    $seedContent = str_replace("'name' => 'Admin',", "'nombres' => 'Admin', 'apellido_paterno' => '', 'apellido_materno' => '',", $seedContent);
    file_put_contents($seedPath, $seedContent);
}

echo "Backend patched successfully!";
