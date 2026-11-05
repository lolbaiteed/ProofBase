<script setup lang="ts">
type DashboardColor =
  "primary" | "success" | "warning" | "error" | "info" | "neutral";

type Metric = {
  label: string;
  value: string;
  detail: string;
  icon: string;
  color: DashboardColor;
};

type HealthItem = {
  label: string;
  value: number;
  color: DashboardColor;
  detail: string;
};

type PriorityItem = {
  title: string;
  status: string;
  owner: string;
  due: string;
  color: DashboardColor;
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
  icon: string;
};

const props = defineProps<{
  role: string;
  title: string;
  subtitle: string;
  metrics: Metric[];
  health: HealthItem[];
  priorities: PriorityItem[];
  activity: ActivityItem[];
}>();

function metricTone(color: DashboardColor): string {
  switch (color) {
    case "success":
      return "text-success";
    case "warning":
      return "text-warning";
    case "error":
      return "text-error";
    case "info":
      return "text-info";
    case "neutral":
      return "text-muted";
    default:
      return "text-primary";
  }
}
</script>

<template>
  <UDashboardPanel :id="`${props.role.toLowerCase()}-dashboard`">
    <template #header>
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex w-full flex-col gap-6">
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold text-highlighted">
            {{ props.title }}
          </h1>
          <p class="text-sm text-muted">{{ props.subtitle }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <UCard
            v-for="metric in props.metrics"
            :key="metric.label"
            variant="subtle"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted">{{ metric.label }}</p>
                <p class="mt-2 text-3xl font-semibold text-highlighted">
                  {{ metric.value }}
                </p>
                <p class="mt-1 text-xs text-muted">{{ metric.detail }}</p>
              </div>
              <UIcon
                :name="metric.icon"
                :class="metricTone(metric.color)"
                class="size-5"
              />
            </div>
          </UCard>
        </div>

        <div class="grid gap-4 xl:grid-cols-2">
          <UCard
            title="Operational health"
            description="Current focus areas this cycle."
            variant="subtle"
          >
            <div class="space-y-4">
              <div
                v-for="item in props.health"
                :key="item.label"
                class="space-y-2"
              >
                <div class="flex items-center justify-between gap-3 text-sm">
                  <UBadge :color="item.color" variant="subtle">{{
                    item.label
                  }}</UBadge>
                  <span class="font-medium text-highlighted"
                    >{{ item.value }}%</span
                  >
                </div>
                <UProgress
                  :model-value="item.value"
                  :max="100"
                  :color="item.color"
                  size="sm"
                />
                <p class="text-xs text-muted">{{ item.detail }}</p>
              </div>
            </div>
          </UCard>

          <UCard
            title="Priority queue"
            description="Most important actions for this role."
            variant="subtle"
          >
            <div class="space-y-3">
              <div
                v-for="item in props.priorities"
                :key="item.title"
                class="rounded-lg border border-default/80 bg-default/30 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-highlighted">
                      {{ item.title }}
                    </p>
                    <p class="mt-1 text-xs text-muted">
                      {{ item.owner }} · {{ item.due }}
                    </p>
                  </div>
                  <UBadge
                    :color="item.color"
                    variant="subtle"
                    class="shrink-0"
                    >{{ item.status }}</UBadge
                  >
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <UCard
          title="Recent activity"
          description="Latest updates from the environment."
          variant="subtle"
        >
          <div class="space-y-4">
            <div
              v-for="activityItem in props.activity"
              :key="activityItem.title"
              class="flex items-start gap-3"
            >
              <div
                class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <UIcon :name="activityItem.icon" class="size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-highlighted">
                  {{ activityItem.title }}
                </p>
                <p class="mt-1 text-xs text-muted">{{ activityItem.detail }}</p>
              </div>
              <span class="shrink-0 text-xs text-muted">{{
                activityItem.time
              }}</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
