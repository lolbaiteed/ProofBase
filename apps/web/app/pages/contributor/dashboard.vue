<script setup lang="ts">
const metrics = [
  { label: 'Open tasks', value: '12', detail: 'Across active workstreams', icon: 'i-lucide-list-todo', color: 'primary' },
  { label: 'Approved evidence', value: '41', detail: 'This month', icon: 'i-lucide-file-check', color: 'success' },
  { label: 'Action items', value: '8', detail: 'Need follow-up', icon: 'i-lucide-circle-alert', color: 'warning' },
  { label: 'On-time delivery', value: '76%', detail: 'Current completion rate', icon: 'i-lucide-clock-3', color: 'info' }
]

const health = [
  { label: 'Task completion', value: 79, color: 'success', detail: 'Most milestones are tracking on schedule.' },
  { label: 'Evidence readiness', value: 72, color: 'primary', detail: 'A few items still need validation from owners.' },
  { label: 'Collaboration load', value: 64, color: 'warning', detail: 'Review handoffs remain slightly above target.' }
]

const priorities = [
  { title: 'SOC control evidence pack', status: 'In progress', owner: 'Security team', due: 'Today', color: 'primary' },
  { title: 'Patch validation summary', status: 'Needs review', owner: 'IT ops', due: 'Tomorrow', color: 'warning' },
  { title: 'Policy exception closure', status: 'On track', owner: 'Operations', due: 'Friday', color: 'success' }
]

const activity = [
  { title: 'Required evidence uploaded', detail: 'New screenshots and notes were attached to the control record.', time: '35m ago', icon: 'i-lucide-upload' },
  { title: 'Checklist updated', detail: 'The access review checklist moved from draft to ready for approval.', time: '3h ago', icon: 'i-lucide-check-square' },
  { title: 'Pending task assigned', detail: 'A follow-up item was re-assigned to the onboarding owner.', time: 'Today', icon: 'i-lucide-user-plus' }
]
</script>

<template>
  <RoleDashboard
    role="Contributor"
    title="Contributor dashboard"
    subtitle="Delivery progress, evidence readiness, and day-to-day work items for operational teams."
    :metrics="metrics"
    :health="health"
    :priorities="priorities"
    :activity="activity"
  />
</template>
