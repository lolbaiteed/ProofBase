<script setup lang="ts">
const metrics = [
  { label: 'Open reviews', value: '23', detail: 'Awaiting sign-off', icon: 'i-lucide-search-check', color: 'warning' },
  { label: 'Evidence checks', value: '52', detail: 'Validated this cycle', icon: 'i-lucide-file-check-2', color: 'success' },
  { label: 'Findings raised', value: '14', detail: 'Across active audits', icon: 'i-lucide-triangle-alert', color: 'error' },
  { label: 'Audit coverage', value: '91%', detail: 'Requirements reviewed', icon: 'i-lucide-clipboard-list', color: 'primary' }
]

const health = [
  { label: 'Review cadence', value: 88, color: 'success', detail: 'Review dates are staying within target.' },
  { label: 'Evidence quality', value: 82, color: 'primary', detail: 'Most documents meet retention and traceability checks.' },
  { label: 'Defect closure', value: 68, color: 'warning', detail: 'Three issues need follow-up before closeout.' }
]

const priorities = [
  { title: 'Access control sample', status: 'In review', owner: 'Audit team', due: 'Today', color: 'warning' },
  { title: 'Third-party assessment', status: 'Due soon', owner: 'Vendor risk', due: 'Tomorrow', color: 'primary' },
  { title: 'Evidence archival check', status: 'On track', owner: 'Compliance', due: 'Friday', color: 'success' }
]

const activity = [
  { title: 'Evidence packet reviewed', detail: 'Access management proof was approved with no issues.', time: '1h ago', icon: 'i-lucide-check-circle-2' },
  { title: 'Finding escalated', detail: 'Segregation review moved to corrective action backlog.', time: '4h ago', icon: 'i-lucide-alert-circle' },
  { title: 'Sample plan updated', detail: 'Testing scope expanded for the retention control set.', time: 'Today', icon: 'i-lucide-file-up' }
]
</script>

<template>
  <RoleDashboard
    role="Auditor"
    title="Auditor dashboard"
    subtitle="Review queues, evidence quality, and control testing progress for active audits."
    :metrics="metrics"
    :health="health"
    :priorities="priorities"
    :activity="activity"
  />
</template>
