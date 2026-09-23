<?php
namespace App\Http\Controllers;

use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\EventRegistration;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Event::with(['creator', 'registrations.user'])->withCount('registrations');
        if ($request->query('upcoming') === 'true') {
            $query->where('event_date', '>=', now()->toDateString());
        }
        $query->orderBy('event_date', 'asc');
        return EventResource::collection($query->paginate(12));
    }

    public function show($id)
    {
        return new EventResource(Event::with(['creator', 'registrations.user'])->findOrFail($id));
    }

    public function store(StoreEventRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('events', env('FILESYSTEM_DISK', 'public'));
        }
        return new EventResource(Event::create($data));
    }

    public function update(UpdateEventRequest $request, $id)
    {
        $event = Event::findOrFail($id);
        $data = $request->validated();
        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('events', env('FILESYSTEM_DISK', 'public'));
        }
        $event->update($data);
        return new EventResource($event);
    }

    public function destroy($id)
    {
        Event::findOrFail($id)->delete();
        return response()->noContent();
    }

    public function register(Request $request, $id)
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $id) {
            $event = Event::where('id', $id)->lockForUpdate()->firstOrFail();

            if ($event->max_participants) {
                $currentRegistrations = EventRegistration::where('event_id', $id)
                    ->where('user_id', '!=', $request->user()->id)
                    ->count();

                if ($currentRegistrations >= $event->max_participants) {
                    return response()->json([
                        'message' => 'El evento ya no tiene cupos disponibles.',
                        'cupo_lleno' => true,
                    ], 422);
                }
            }

            EventRegistration::updateOrCreate(
                ['event_id' => $id, 'user_id' => $request->user()->id],
                ['status' => 'registrado']
            );

            return response()->json(['message' => 'Registered successfully']);
        });
    }

    public function unregister(Request $request, $id)
    {
        EventRegistration::where('event_id', $id)->where('user_id', $request->user()->id)->update(['status' => 'cancelado']);
        return response()->json(['message' => 'Unregistered successfully']);
    }

    public function removeRegistration($id, $userId)
    {
        EventRegistration::where('event_id', $id)->where('user_id', $userId)->delete();
        return response()->json(['message' => 'Registration removed successfully']);
    }
}