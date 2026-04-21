<template>
  <div class="space-y-6">
    <section class="card p-6">
      <h1 class="text-2xl font-bold text-brand mb-2">
        {{ $t('about.title') }}
      </h1>
      <p class="text-sm text-slate-600">
        {{ $t('about.subtitle') }}
      </p>
    </section>

    <section class="card p-6">
      <h2 class="text-lg font-semibold text-brand mb-2">
        {{ $t('about.non_profit_title') }}
      </h2>
      <p class="text-sm text-slate-600">
        {{ $t('about.non_profit_body') }}
      </p>
    </section>

    <section class="card p-6">
      <h2 class="text-lg font-semibold text-brand mb-2">
        {{ $t('about.validate_title') }}
      </h2>
      <div class="space-y-2 text-sm text-slate-600">
        <p>{{ $t('toilets.trust_info.why_details') }}</p>
        <p>{{ $t('toilets.trust_info.freshness') }}</p>
        <p>{{ $t('toilets.trust_info.source_reliability') }}</p>
        <p>{{ $t('toilets.trust_info.reports_help') }}</p>
        <p>{{ $t('toilets.trust_info.institutional_note') }}</p>
      </div>
    </section>

    <section class="card p-6">
      <h2 class="text-lg font-semibold text-brand mb-2">
        {{ $t('about.status_title') }}
      </h2>
      <div class="space-y-2 text-sm text-slate-600">
        <p class="font-medium text-slate-700">
          {{ $t('toilets.status_changes_fast') }}
        </p>
        <p>{{ $t('toilets.status_changes_body') }}</p>
        <p>{{ $t('toilets.status_changes_institutional') }}</p>
      </div>
    </section>

    <section class="card p-6">
      <h2 class="text-lg font-semibold text-brand mb-2">
        {{ $t('about.engage_title') }}
      </h2>
      <p class="text-sm text-slate-600 mb-3">
        {{ $t('about.engage_body') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <a
          href="https://github.com/steffolino/sandra-loo"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-secondary text-sm"
        >
          {{ $t('about.github_repo') }}
        </a>
        <a
          href="https://github.com/steffolino/sandra-loo/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-primary text-sm"
        >
          {{ $t('about.github_issues') }}
        </a>
      </div>
    </section>
  </div>
</template>
