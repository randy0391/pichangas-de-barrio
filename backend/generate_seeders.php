<?php
$baseDir = __DIR__;

$seeders = [
    'AdminSeeder' => <<<'PHP'
<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Pichangas',
            'email' => 'admin@pichangas.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);
    }
}
PHP,
    'DatabaseSeeder' => <<<'PHP'
<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Post;
use App\Models\Event;
use App\Models\Convocatoria;
use App\Models\Gallery;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(AdminSeeder::class);

        $admin = User::where('email', 'admin@pichangas.com')->first();

        // Create 10 sample members
        for ($i=1; $i<=10; $i++) {
            User::create([
                'name' => "Jugador $i",
                'email' => "jugador$i@pichangas.com",
                'password' => Hash::make('password123'),
                'role' => 'member',
            ]);
        }

        // Create 5 posts
        for ($i=1; $i<=5; $i++) {
            Post::create([
                'user_id' => $admin->id,
                'title' => "Noticia $i",
                'slug' => "noticia-$i",
                'content' => "Contenido de la noticia $i",
                'category' => 'noticia',
                'status' => 'publicado',
                'published_at' => now(),
            ]);
        }

        // Create 3 events
        for ($i=1; $i<=3; $i++) {
            Event::create([
                'user_id' => $admin->id,
                'title' => "Evento $i",
                'description' => "Descripción del evento $i",
                'location' => "Cancha $i",
                'event_date' => now()->addDays($i),
                'event_time' => '18:00:00',
                'status' => 'proximo',
            ]);
        }

        // Create 2 convocatorias
        for ($i=1; $i<=2; $i++) {
            $c = Convocatoria::create([
                'user_id' => $admin->id,
                'title' => "Pichanga $i",
                'description' => "Pichanga de los sábados $i",
                'location' => "Cancha sintética",
                'match_date' => now()->addDays($i+3),
                'match_time' => '20:00:00',
                'max_players' => 14,
                'status' => 'abierta',
            ]);

            $c->confirmaciones()->create([
                'user_id' => 2,
                'status' => 'confirmado',
                'confirmed_at' => now(),
            ]);
        }

        // Create 2 galleries
        for ($i=1; $i<=2; $i++) {
            $g = Gallery::create([
                'user_id' => $admin->id,
                'title' => "Galería $i",
                'description' => "Fotos del partido $i",
            ]);

            $g->media()->create([
                'user_id' => $admin->id,
                'type' => 'foto',
                'file_path' => "media/sample$i.jpg",
            ]);
        }
    }
}
PHP
];

foreach ($seeders as $name => $content) {
    file_put_contents("$baseDir/database/seeders/$name.php", $content);
}

echo "Seeders created.\n";
