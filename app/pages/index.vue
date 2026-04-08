<template>
  <div>
    <!-- Hero -->
    <section class="text-center py-16 px-4">
      <h1 class="text-4xl font-bold text-brand mb-3">
        Sandra Loo 🚻
      </h1>
      <p class="text-lg text-gray-600 max-w-xl mx-auto mb-8">
        Find verified public toilets in Germany — and test your survival skills
        in our awareness game.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink to="/toilets/" class="btn-primary text-base px-6 py-3">
          Find a Toilet
        </NuxtLink>
        <NuxtLink to="/game" class="btn-secondary text-base px-6 py-3">
          Play the Game
        </NuxtLink>
      </div>
    </section>

    <!-- Feature cards -->
    <section class="grid sm:grid-cols-3 gap-6 mt-4">
      <div class="card p-6">
        <div class="text-3xl mb-3">📍</div>
        <h2 class="font-semibold text-brand mb-1">
          Real Data Only
        </h2>
        <p class="text-sm text-gray-500">
          All toilet locations are imported from OpenStreetMap and official city
          open-data portals. No invented data.
        </p>
      </div>
      <div class="card p-6">
        <div class="text-3xl mb-3">⭐</div>
        <h2 class="font-semibold text-brand mb-1">
          Community Reviews
        </h2>
        <p class="text-sm text-gray-500">
          Rate cleanliness, lighting and paper supply. Report issues. Confirm
          toilet status for other visitors.
        </p>
      </div>
      <div class="card p-6">
        <div class="text-3xl mb-3">🎮</div>
        <h2 class="font-semibold text-brand mb-1">
          Awareness Game
        </h2>
        <p class="text-sm text-gray-500">
          A stylized run-based survival game from a female perspective. Manage
          your bladder meter and avoid the igitt zone.
        </p>
      </div>
    </section>

    <!-- Cities -->
    <section class="mt-12">
      <h2 class="text-xl font-bold text-brand mb-4">
        Available Cities
      </h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <NuxtLink
          to="/toilets/?city=Leipzig"
          class="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <span class="text-2xl">🏙️</span>
          <div>
            <div class="font-semibold text-brand">
              Leipzig
            </div>
            <div class="text-sm text-gray-500">
              Saxony, Germany
            </div>
          </div>
        </NuxtLink>
        <NuxtLink
          to="/toilets/?city=Frankfurt+am+Main"
          class="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <span class="text-2xl">🏙️</span>
          <div>
            <div class="font-semibold text-brand">
              Frankfurt am Main
            </div>
            <div class="text-sm text-gray-500">
              Hesse, Germany
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
