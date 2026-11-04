<script setup lang="ts">
import {
	AssessmentStatus,
	FindingSeverity,
	FindingStatus,
	ImplementationStatus
} from '@ProofBase/shared/enums'

type Assessment = { id: string, status: AssessmentStatus }
type Audit = { id: string, name: string }
type Finding = {
	id: string
	title: string
	severity: FindingSeverity
	status: FindingStatus
	identifiedAt: string
}
type SoAEntry = { id: string, isApplicable: boolean, implementationStatus: ImplementationStatus }
type Evidence = { id: string, title: string, expiresAt?: string | null }
type DashboardData = {
	audits: Audit[]
	assessments: Assessment[]
	findings: Finding[]
	soa: SoAEntry[]
	evidence: Evidence[]
}
type TrpcResponse<T> = { result?: { data?: T | { json?: T } } }
type UiColor = 'error' | 'info' | 'neutral' | 'primary' | 'success' | 'warning'

const config = useRuntimeConfig()
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

async function query<T>(procedure: string): Promise<T> {
	const response = await $fetch<TrpcResponse<T>>(`/trpc/${procedure}`, {
		baseURL: config.public.apiBase,
		credentials: 'include',
		headers: requestHeaders?.cookie ? { cookie: requestHeaders.cookie } : undefined
	})
	const result = response.result?.data

	if (result === undefined) {
		throw new Error(`Missing data from ${procedure}`)
	}

	return (typeof result === 'object' && result !== null && 'json' in result
		? result.json
		: result) as T
}

const emptyDashboard: DashboardData = {
	audits: [],
	assessments: [],
	findings: [],
	soa: [],
	evidence: []
}

const { data: dashboard, status, error, refresh } = await useAsyncData('admin-dashboard', async () => {
	const [audits, assessments, findings, soa, evidence] = await Promise.all([
		query<Audit[]>('listAudits'),
		query<Assessment[]>('listAssesments'),
		query<Finding[]>('listFindings'),
		query<SoAEntry[]>('listSoA'),
		query<Evidence[]>('listEvidence')
	])

	return { audits, assessments, findings, soa, evidence }
}, { default: () => emptyDashboard })

const assessmentBreakdown = computed(() => [
	{ label: 'Compliant', value: AssessmentStatus.Compliant, color: 'success' as const },
	{ label: 'Partially compliant', value: AssessmentStatus.PartiallyCompliant, color: 'warning' as const },
	{ label: 'Non-compliant', value: AssessmentStatus.NonCompliant, color: 'error' as const },
	{ label: 'Not assessed', value: AssessmentStatus.NotAssessted, color: 'neutral' as const },
	{ label: 'Not applicable', value: AssessmentStatus.NotApplicable, color: 'info' as const }
].map(item => ({
	...item,
	count: dashboard.value.assessments.filter(assessment => assessment.status === item.value).length
})))

const implementationBreakdown = computed(() => [
	{ label: 'Implemented', value: ImplementationStatus.Implemented, color: 'success' as const },
	{ label: 'Partially implemented', value: ImplementationStatus.PartiallyImplemented, color: 'warning' as const },
	{ label: 'Planned', value: ImplementationStatus.Planned, color: 'info' as const },
	{ label: 'Not implemented', value: ImplementationStatus.NotImplemented, color: 'error' as const }
].map(item => ({
	...item,
	count: dashboard.value.soa.filter(entry => entry.isApplicable && entry.implementationStatus === item.value).length
})))

const assessmentCount = computed(() => dashboard.value.assessments.length)
const assessedCount = computed(() => dashboard.value.assessments.filter(assessment =>
	assessment.status !== AssessmentStatus.NotAssessted && assessment.status !== AssessmentStatus.NotApplicable
).length)
const compliantCount = computed(() => dashboard.value.assessments.filter(assessment =>
	assessment.status === AssessmentStatus.Compliant
).length)
const complianceRate = computed(() => percentage(compliantCount.value, assessedCount.value))
const applicableSoaCount = computed(() => dashboard.value.soa.filter(entry => entry.isApplicable).length)
const implementedCount = computed(() => dashboard.value.soa.filter(entry =>
	entry.isApplicable && entry.implementationStatus === ImplementationStatus.Implemented
).length)
const implementationRate = computed(() => percentage(implementedCount.value, applicableSoaCount.value))
const openFindingCount = computed(() => dashboard.value.findings.filter(finding =>
	finding.status === FindingStatus.Open || finding.status === FindingStatus.InProgress
).length)
const expiringEvidence = computed(() => {
	const now = Date.now()
	const limit = now + 30 * 24 * 60 * 60 * 1000

	return dashboard.value.evidence.filter(evidence => {
		if (!evidence.expiresAt) return false
		const expiresAt = new Date(evidence.expiresAt).getTime()
		return expiresAt >= now && expiresAt <= limit
	}).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
})
const latestFindings = computed(() => [...dashboard.value.findings]
	.sort((a, b) => new Date(b.identifiedAt).getTime() - new Date(a.identifiedAt).getTime())
	.slice(0, 5))
const auditNames = computed(() => [...dashboard.value.audits].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 5))

function percentage(value: number, total: number): number {
	return total ? Math.round((value / total) * 100) : 0
}

function formatStatus(value: string): string {
	if (value === AssessmentStatus.NotAssessted) return 'Not assessed'
	return value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function findingColor(value: FindingSeverity): UiColor {
	if (value === FindingSeverity.Critical || value === FindingSeverity.High) return 'error'
	if (value === FindingSeverity.Medium) return 'warning'
	return 'neutral'
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}
</script>

<template>
	<UDashboardPanel id="admin-dashboard">
		<template #header>
			<UDashboardNavbar title="Admin dashboard">
				<template #leading>
					<UDashboardSidebarCollapse />
				</template>
				<template #right>
					<UButton
						label="Refresh"
						icon="i-lucide-refresh-cw"
						color="neutral"
						variant="outline"
						:loading="status === 'pending'"
						@click="refresh()"
					/>
				</template>
			</UDashboardNavbar>
		</template>

		<template #body>
			<div class="flex w-full flex-col gap-6">
				<div>
					<h1 class="text-2xl font-semibold text-highlighted">Organization overview</h1>
					<p class="mt-1 text-sm text-muted">Compliance progress, audit coverage, and issues that need attention.</p>
				</div>

				<UAlert
					v-if="error"
					color="error"
					variant="subtle"
					title="Dashboard data could not be loaded"
					description="Check your organization access and API connection, then refresh."
					icon="i-lucide-circle-alert"
				/>

				<UProgress v-if="status === 'pending'" animation="carousel" />

				<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<UCard variant="subtle">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm text-muted">Assessments</p>
								<p class="mt-2 text-3xl font-semibold text-highlighted">{{ assessmentCount }}</p>
								<p class="mt-1 text-xs text-muted">{{ assessedCount }} assessed requirements</p>
							</div>
							<UIcon name="i-lucide-clipboard-check" class="size-5 text-primary" />
						</div>
					</UCard>

					<UCard variant="subtle">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm text-muted">Compliance rate</p>
								<p class="mt-2 text-3xl font-semibold text-highlighted">{{ complianceRate }}%</p>
								<p class="mt-1 text-xs text-muted">{{ compliantCount }} of {{ assessedCount }} assessed</p>
							</div>
							<UIcon name="i-lucide-shield-check" class="size-5 text-success" />
						</div>
					</UCard>

					<UCard variant="subtle">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm text-muted">Open findings</p>
								<p class="mt-2 text-3xl font-semibold text-highlighted">{{ openFindingCount }}</p>
								<p class="mt-1 text-xs text-muted">Open or in progress</p>
							</div>
							<UIcon name="i-lucide-triangle-alert" class="size-5 text-warning" />
						</div>
					</UCard>

					<UCard variant="subtle">
						<div class="flex items-start justify-between gap-3">
							<div>
								<p class="text-sm text-muted">Controls implemented</p>
								<p class="mt-2 text-3xl font-semibold text-highlighted">{{ implementationRate }}%</p>
								<p class="mt-1 text-xs text-muted">{{ implementedCount }} of {{ applicableSoaCount }} applicable</p>
							</div>
							<UIcon name="i-lucide-list-checks" class="size-5 text-info" />
						</div>
					</UCard>
				</div>

				<div class="grid gap-4 xl:grid-cols-2">
					<UCard title="Assessment coverage" description="Status across requirements in your audits." variant="subtle">
						<div class="space-y-4">
							<div v-for="item in assessmentBreakdown" :key="item.value" class="space-y-2">
								<div class="flex items-center justify-between gap-3 text-sm">
									<UBadge :color="item.color" variant="subtle">{{ item.label }}</UBadge>
									<span class="font-medium text-highlighted">{{ item.count }}</span>
								</div>
								<UProgress :model-value="percentage(item.count, assessmentCount)" :max="100" :color="item.color" size="sm" />
							</div>
						</div>
					</UCard>

					<UCard title="Statement of applicability" description="Implementation status for applicable controls." variant="subtle">
						<div class="space-y-4">
							<div v-for="item in implementationBreakdown" :key="item.value" class="space-y-2">
								<div class="flex items-center justify-between gap-3 text-sm">
									<UBadge :color="item.color" variant="subtle">{{ item.label }}</UBadge>
									<span class="font-medium text-highlighted">{{ item.count }}</span>
								</div>
								<UProgress :model-value="percentage(item.count, applicableSoaCount)" :max="100" :color="item.color" size="sm" />
							</div>
							<p v-if="!applicableSoaCount" class="text-sm text-muted">No applicable controls recorded yet.</p>
						</div>
					</UCard>
				</div>

				<div class="grid gap-4 xl:grid-cols-3">
					<UCard variant="subtle">
						<template #header>
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="font-semibold text-highlighted">Audit portfolio</h2>
									<p class="mt-1 text-sm text-muted">Audits in this organization.</p>
								</div>
								<UBadge color="neutral" variant="subtle">{{ dashboard.audits.length }}</UBadge>
							</div>
						</template>
						<div v-if="auditNames.length" class="divide-y divide-default">
							<div v-for="audit in auditNames" :key="audit.id" class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								<UIcon name="i-lucide-clipboard-list" class="size-4 shrink-0 text-muted" />
								<span class="truncate text-sm text-highlighted">{{ audit.name }}</span>
							</div>
						</div>
						<p v-else class="text-sm text-muted">No audits found.</p>
					</UCard>

					<UCard title="Latest findings" description="Most recently identified issues." variant="subtle">
						<div v-if="latestFindings.length" class="divide-y divide-default">
							<div v-for="finding in latestFindings" :key="finding.id" class="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium text-highlighted">{{ finding.title }}</p>
									<p class="mt-1 text-xs text-muted">{{ formatDate(finding.identifiedAt) }}</p>
								</div>
								<UBadge :color="findingColor(finding.severity)" variant="subtle" class="shrink-0">
									{{ formatStatus(finding.severity) }}
								</UBadge>
							</div>
						</div>
						<p v-else class="text-sm text-muted">No findings recorded.</p>
					</UCard>

					<UCard variant="subtle">
						<template #header>
							<div class="flex items-center justify-between gap-3">
								<div>
									<h2 class="font-semibold text-highlighted">Evidence expiring soon</h2>
									<p class="mt-1 text-sm text-muted">Expiry within 30 days.</p>
								</div>
								<UBadge :color="expiringEvidence.length ? 'warning' : 'success'" variant="subtle">{{ expiringEvidence.length }}</UBadge>
							</div>
						</template>
						<div v-if="expiringEvidence.length" class="divide-y divide-default">
							<div v-for="evidence in expiringEvidence.slice(0, 5)" :key="evidence.id" class="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
								<span class="truncate text-sm text-highlighted">{{ evidence.title }}</span>
								<span class="shrink-0 text-xs text-muted">{{ formatDate(evidence.expiresAt!) }}</span>
							</div>
						</div>
						<p v-else class="text-sm text-muted">No evidence expires in the next 30 days.</p>
					</UCard>
				</div>
			</div>
		</template>
	</UDashboardPanel>
</template>