$ErrorActionPreference = "Stop"

function Resolve-ProjectRoot {
    param([string]$Start)
    $current = (Resolve-Path $Start).Path
    for ($i = 0; $i -lt 6; $i++) {
        if ((Test-Path (Join-Path $current "package.json")) -and (Test-Path (Join-Path $current "src"))) {
            return $current
        }
        $parent = Split-Path $current -Parent
        if ($parent -eq $current) { break }
        $current = $parent
    }
    throw "Project root was not detected. Extract this update folder inside cafe-retention-app and run the script there."
}

function Backup-File {
    param([string]$Path, [string]$BackupRoot, [string]$ProjectRoot)
    $relative = $Path.Substring($ProjectRoot.Length).TrimStart([char[]]'\/')
    $dest = Join-Path $BackupRoot $relative
    $destDir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    Copy-Item -LiteralPath $Path -Destination $dest -Force
}

function Replace-Flexible {
    param(
        [string]$Content,
        [string]$Old,
        [string]$New,
        [string]$Label
    )

    if ($Content.Contains($Old)) {
        return $Content.Replace($Old, $New)
    }

    $tokens = [regex]::Split($Old.Trim(), '\s+') | Where-Object { $_.Length -gt 0 }
    if ($tokens.Count -eq 0) { throw "Patch point is empty: $Label" }
    $pattern = ($tokens | ForEach-Object { [regex]::Escape($_) }) -join '\s+'
    $regex = [regex]::new($pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    $match = $regex.Match($Content)
    if (-not $match.Success) {
        throw "Patch point not found: $Label. The local file may differ from Batch 1 v4 state."
    }

    return $Content.Substring(0, $match.Index) + $New + $Content.Substring($match.Index + $match.Length)
}

$packageDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-ProjectRoot $packageDir
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root ".bon-plus-backup-qa-feedback-v5-$stamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

Write-Host "Project root: $root" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot" -ForegroundColor DarkGray

$feedbackUiPath = Join-Path $root "src/features/admin/feedback/feedback-inbox.tsx"
$feedbackActionsPath = Join-Path $root "src/app/admin/feedback/actions.ts"
$questionActionsPath = Join-Path $root "src/app/admin/questions/actions.ts"

$requiredFiles = @($feedbackUiPath, $feedbackActionsPath, $questionActionsPath)
foreach ($path in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Required file not found: $path" }
    Backup-File -Path $path -BackupRoot $backupRoot -ProjectRoot $root
}

# -----------------------------------------------------------------------------
# CRM workflow: show all three workflow lists clearly and keep movement controls.
# -----------------------------------------------------------------------------
$feedback = Get-Content -LiteralPath $feedbackUiPath -Raw -Encoding UTF8

if (-not $feedback.Contains('moveFeedbackWorkflow')) {
    throw "Batch 1 workflow code was not detected in feedback-inbox.tsx."
}

# Remove the temporary tab-only state from v4; we now show three explicit tables.
$feedback = [regex]::Replace(
    $feedback,
    '\r?\n\s*const \[activeWorkflowStage,\s*setActiveWorkflowStage\] = useState<"new" \| "follow_up" \| "resolved">\("new"\);',
    '',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$oldTabs = @'
  <div className="space-y-4">
  <Card className="p-2">
  <div className="grid gap-2 md:grid-cols-3">
  {[
  { key: "new" as const, label: t.newFeedbacks, count: workflowCounts.new },
  { key: "follow_up" as const, label: t.inFollowUp, count: workflowCounts.follow_up },
  { key: "resolved" as const, label: t.resolvedFeedbacks, count: workflowCounts.resolved },
  ].map((tab) => (
  <button
  key={tab.key}
  type="button"
  onClick={() => setActiveWorkflowStage(tab.key)}
  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-start transition ${activeWorkflowStage === tab.key ? "border-amber-300/30 bg-amber-300/[0.12] text-amber-100" : "border-transparent bg-black/5 text-[color:var(--admin-text)] hover:bg-black/10"}`}
  >
  <span className="text-sm font-black">{tab.label}</span>
  <span className="rounded-xl bg-black/10 px-3 py-1 text-lg font-black">{tab.count}</span>
  </button>
  ))}
  </div>
  </Card>
  {renderFeedbackTable(feedbackBuckets[activeWorkflowStage], activeWorkflowStage)}
'@

$newSections = @'
  <div className="space-y-8">
  {[
  { key: "new" as const, label: t.newFeedbacks, count: workflowCounts.new, items: feedbackBuckets.new },
  { key: "follow_up" as const, label: t.inFollowUp, count: workflowCounts.follow_up, items: feedbackBuckets.follow_up },
  { key: "resolved" as const, label: t.resolvedFeedbacks, count: workflowCounts.resolved, items: feedbackBuckets.resolved },
  ].map((section) => (
  <section key={section.key} className="space-y-3">
  <Card className="p-5">
  <div className="flex items-center justify-between gap-4">
  <h2 className="text-lg font-black text-[color:var(--admin-text)]">{section.label}</h2>
  <span className="text-3xl font-black text-[color:var(--admin-text)]">{section.count}</span>
  </div>
  </Card>
  {renderFeedbackTable(section.items, section.key)}
  </section>
  ))}
'@

$feedback = Replace-Flexible -Content $feedback -Old $oldTabs -New $newSections -Label "CRM three workflow lists"
$feedback = $feedback.Replace('limit: 25,', 'limit: 200,')
Set-Content -LiteralPath $feedbackUiPath -Value $feedback -Encoding UTF8
Write-Host "CRM workflow now shows New, Follow-up, and Resolved as three explicit lists." -ForegroundColor Green

# Increase the inbox window so older Follow-up / Resolved items are not hidden by
# the first 25 newest rows before the workflow grouping happens.
$feedbackActions = Get-Content -LiteralPath $feedbackActionsPath -Raw -Encoding UTF8
$feedbackActions = $feedbackActions.Replace('const emptyPagination: FeedbackInboxPagination = { limit: 25,', 'const emptyPagination: FeedbackInboxPagination = { limit: 200,')
$feedbackActions = $feedbackActions.Replace('p_limit: input.limit ?? 25,', 'p_limit: input.limit ?? 200,')
Set-Content -LiteralPath $feedbackActionsPath -Value $feedbackActions -Encoding UTF8
Write-Host "CRM inbox fetch window increased for workflow grouping." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Feedback questions: answered questions archive and disappear from the live list.
# Unanswered questions still hard-delete.
# -----------------------------------------------------------------------------
$qActions = Get-Content -LiteralPath $questionActionsPath -Raw -Encoding UTF8

if (-not $qActions.Contains('deleteAdminQuestion')) {
    throw "Batch 1 question delete/archive action was not detected."
}

$oldAttachQuery = @'
  const { data, error } = await supabase
    .from("feedback_questions")
    .select("id, options_json")
    .eq("business_id", state.business.id);
'@

$newAttachQuery = @'
  const feedbackQuestionsTable = supabase.from("feedback_questions") as any;
  const { data, error } = await feedbackQuestionsTable
    .select("id, options_json, archived_at")
    .eq("business_id", state.business.id);
'@

$qActions = Replace-Flexible -Content $qActions -Old $oldAttachQuery -New $newAttachQuery -Label "question archive metadata query"

$oldOptionsMap = @'
  const optionsById = new Map(
    (data ?? []).map((row) => [row.id, normalizeOptions(row.options_json)]),
  );
  return {
    ...state,
    questions: state.questions.map((question) => {
'@

$newOptionsMap = @'
  const optionRows = (data ?? []) as Array<{
    id: string;
    options_json: unknown;
    archived_at: string | null;
  }>;
  const optionsById = new Map(
    optionRows.map((row) => [row.id, normalizeOptions(row.options_json)]),
  );
  const archivedIds = new Set(
    optionRows.filter((row) => Boolean(row.archived_at)).map((row) => row.id),
  );
  return {
    ...state,
    questions: state.questions
      .filter((question) => !archivedIds.has(question.id))
      .map((question) => {
'@

$qActions = Replace-Flexible -Content $qActions -Old $oldOptionsMap -New $newOptionsMap -Label "filter archived questions from live list"

# Both versioning and answered-question delete branches already soft-disable the
# historical question. Add archived_at so it can be distinguished from a normal Hide.
$qActions = $qActions.Replace(
    '.update({ is_active: false })',
    '.update({ is_active: false, archived_at: new Date().toISOString() } as any)'
)

Set-Content -LiteralPath $questionActionsPath -Value $qActions -Encoding UTF8
Write-Host "Answered questions now archive cleanly and disappear from the live list." -ForegroundColor Green

# Copy migration.
$migrationSource = Join-Path $packageDir "payload/supabase/migrations/20260708234500_feedback_question_archive_visibility.sql"
$migrationDestDir = Join-Path $root "supabase/migrations"
$migrationDest = Join-Path $migrationDestDir "20260708234500_feedback_question_archive_visibility.sql"
New-Item -ItemType Directory -Force -Path $migrationDestDir | Out-Null
Copy-Item -LiteralPath $migrationSource -Destination $migrationDest -Force
Write-Host "Added migration: supabase/migrations/20260708234500_feedback_question_archive_visibility.sql" -ForegroundColor Yellow

Write-Host ""
Write-Host "QA Feedback Batch 1 v5 applied successfully." -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "1) npx supabase db push"
Write-Host "2) npm run build"
Write-Host "3) Test CRM New / Follow-up / Resolved lists and question delete/archive behavior"
Write-Host "4) Do not commit until both tests pass"
