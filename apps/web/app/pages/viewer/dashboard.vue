<script setup lang="ts">
const metrics = [
  { label: 'Reports viewed', value: '8', detail: 'This week', icon: 'i-lucide-file-text', color: 'primary' },
  { label: 'Policies reviewed', value: '14', detail: 'Current cycle', icon: 'i-lucide-book-open', color: 'info' },
  { label: 'Open notifications', value: '3', detail: 'Awaiting action', icon: 'i-lucide-bell', color: 'warning' },
  { label: 'Coverage snapshot', value: '92%', detail: 'Updated this week', icon: 'i-lucide-chart-pie', color: 'success' }
]

const health = [
  { label: 'Readiness visibility', value: 91, color: 'success', detail: 'The latest status snapshot is clear and current.' },
  { label: 'Follow-up actions', value: 72, color: 'primary', detail: 'Most tasks are not blocked and are easy to track.' },
  { label: 'Escalation visibility', value: 68, color: 'warning', detail: 'A few items may need a quick owner brief.' }
]

const priorities = [
  { title: 'Review policy updates', status: 'Scheduled', owner: 'Governance', due: 'Today', color: 'primary' },
  { title: 'Check action summary', status: 'Unread', owner: 'Operations', due: 'Tomorrow', color: 'warning' },
  { title: 'Confirm audit brief', status: 'Ready', owner: 'Compliance', due: 'This week', color: 'success' }
]

const activity = [
  { title: 'New summary published', detail: 'The latest control status brief was shared with the organization.', time: '2h ago', icon: 'i-lucide-newspaper' },
  { title: 'Policy reminder queued', detail: 'A follow-up review reminder was sent to the stakeholder list.', time: '5h ago', icon: 'i-lucide-bell-ring' },
  { title: 'Progress snapshot updated', detail: 'The read-only status card now reflects the latest program numbers.', time: 'Today', icon: 'i-lucide-gauge' }
]
</script>

<template>
  <RoleDashboard
    role="Viewer"
    title="Viewer dashboard"
    subtitle="Read-only monitoring of posture, program health, and recent governance updates."
    :metrics="metrics"
    :health="health"
    :priorities="priorities"
    :activity="activity"
  />
</template>
