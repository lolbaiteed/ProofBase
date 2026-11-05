<script setup lang="ts">
const metrics = [
  { label: 'Assessments', value: '248', detail: 'Across all audits', icon: 'i-lucide-clipboard-check', color: 'primary' },
  { label: 'Compliance rate', value: '86%', detail: 'Requirements in good standing', icon: 'i-lucide-shield-check', color: 'success' },
  { label: 'Open findings', value: '9', detail: 'Open or in progress', icon: 'i-lucide-triangle-alert', color: 'warning' },
  { label: 'Controls implemented', value: '74%', detail: 'Applicable controls covered', icon: 'i-lucide-list-checks', color: 'info' }
]

const health = [
  { label: 'Assessment coverage', value: 86, color: 'success', detail: 'Most controls and requirements have a current assessment.' },
  { label: 'Control implementation', value: 74, color: 'primary', detail: 'Several areas still need remediation or validation.' },
  { label: 'Evidence hygiene', value: 69, color: 'warning', detail: 'A few review items need follow-up before closeout.' }
]

const priorities = [
  { title: 'Quarterly control review', status: 'Due soon', owner: 'Risk team', due: 'This week', color: 'warning' },
  { title: 'Access recertification', status: 'In progress', owner: 'Security', due: 'Tomorrow', color: 'primary' },
  { title: 'High-risk remediation', status: 'Review', owner: 'Operations', due: 'Next 3 days', color: 'error' }
]

const activity = [
  { title: 'Audit portfolio refreshed', detail: 'The latest control snapshot was published to stakeholders.', time: '1h ago', icon: 'i-lucide-clipboard-list' },
  { title: 'Evidence uploaded', detail: 'A new set of approvals was attached to the access control record.', time: '4h ago', icon: 'i-lucide-upload' },
  { title: 'Finding closed', detail: 'One medium finding was marked resolved and archived.', time: 'Today', icon: 'i-lucide-check-circle-2' }
]
</script>

<template>
  <RoleDashboard
    role="Admin"
    title="Admin dashboard"
    subtitle="Operational health, audit quality, and remediation priorities across the organization."
    :metrics="metrics"
    :health="health"
    :priorities="priorities"
    :activity="activity"
  />
</template>
