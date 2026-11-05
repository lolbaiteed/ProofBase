<script setup lang="ts">
const metrics = [
  { label: 'Portfolio health', value: '94%', detail: 'Across all programs', icon: 'i-lucide-shield-check', color: 'success' },
  { label: 'Critical risks', value: '2', detail: 'Need leadership review', icon: 'i-lucide-triangle-alert', color: 'error' },
  { label: 'Stakeholder updates', value: '4', detail: 'This month', icon: 'i-lucide-bell-ring', color: 'primary' },
  { label: 'Budget confidence', value: '86%', detail: 'Forecast coverage', icon: 'i-lucide-wallet', color: 'info' }
]

const health = [
  { label: 'Compliance posture', value: 94, color: 'success', detail: 'Controls and evidence remain aligned.' },
  { label: 'Risk governance', value: 81, color: 'primary', detail: 'Escalations are tracked to closure.' },
  { label: 'Program readiness', value: 77, color: 'warning', detail: 'Two initiatives need executive attention.' }
]

const priorities = [
  { title: 'Board reporting pack', status: 'Due soon', owner: 'Leadership', due: 'This week', color: 'warning' },
  { title: 'Vendor assurance review', status: 'On track', owner: 'Risk team', due: 'Next 3 days', color: 'success' },
  { title: 'Resource allocation', status: 'Review', owner: 'Ops', due: 'Next week', color: 'primary' }
]

const activity = [
  { title: 'Quarterly review scheduled', detail: 'Operations team published the executive summary.', time: '2h ago', icon: 'i-lucide-calendar-check' },
  { title: 'Risk register updated', detail: 'New mitigation plan approved for the payroll workflow.', time: '5h ago', icon: 'i-lucide-shield' },
  { title: 'Evidence backlog trimmed', detail: 'Six records were validated and closed.', time: 'Today', icon: 'i-lucide-files' }
]
</script>

<template>
  <RoleDashboard
    role="Owner"
    title="Owner dashboard"
    subtitle="Business readiness, risk posture, and strategic exceptions for the organization."
    :metrics="metrics"
    :health="health"
    :priorities="priorities"
    :activity="activity"
  />
</template>
