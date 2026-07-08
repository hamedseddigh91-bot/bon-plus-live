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

function Replace-Exact {
    param(
        [string]$Content,
        [string]$Old,
        [string]$New,
        [string]$Label
    )
    if (-not $Content.Contains($Old)) {
        throw "Patch point not found: $Label. Your local file may differ from the expected main branch version."
    }
    return $Content.Replace($Old, $New)
}

function Backup-File {
    param([string]$Path, [string]$BackupRoot, [string]$ProjectRoot)
    $relative = $Path.Substring($ProjectRoot.Length).TrimStart([char[]]'\/')
    $dest = Join-Path $BackupRoot $relative
    $destDir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    Copy-Item $Path $dest -Force
}

$packageDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Resolve-ProjectRoot $packageDir
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $root ".bon-plus-backup-qa-feedback-$stamp"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

Write-Host "Project root: $root" -ForegroundColor Cyan
Write-Host "Backup: $backupRoot" -ForegroundColor DarkGray

$feedbackUiPath = Join-Path $root "src/features/admin/feedback/feedback-inbox.tsx"
$feedbackActionsPath = Join-Path $root "src/app/admin/feedback/actions.ts"
$loyaltyUiPath = Join-Path $root "src/features/admin/crm/loyalty-counter.tsx"
$questionActionsPath = Join-Path $root "src/app/admin/questions/actions.ts"
$questionUiPath = Join-Path $root "src/features/admin/questions/questions-manager.tsx"
$publicFeedbackPagePath = Join-Path $root "src/app/feedback/[slug]/page.tsx"
$submitFeedbackActionsPath = Join-Path $root "src/app/feedback/actions.ts"

$requiredFiles = @(
    $feedbackUiPath,
    $feedbackActionsPath,
    $loyaltyUiPath,
    $questionActionsPath,
    $questionUiPath,
    $publicFeedbackPagePath,
    $submitFeedbackActionsPath
)
foreach ($path in $requiredFiles) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Required file not found: $path" }
    Backup-File -Path $path -BackupRoot $backupRoot -ProjectRoot $root
}

# -----------------------------------------------------------------------------
# CRM Feedback workflow UI: tabs + compact selector
# -----------------------------------------------------------------------------
$feedback = Get-Content -LiteralPath $feedbackUiPath -Raw -Encoding UTF8

$oldTabState = '  const [movingFeedbackId, setMovingFeedbackId] = useState<string | null>(null);'
$newTabState = @'
  const [movingFeedbackId, setMovingFeedbackId] = useState<string | null>(null);
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<"new" | "follow_up" | "resolved">("new");
'@
$feedback = Replace-Exact $feedback $oldTabState $newTabState "feedback workflow tab state"


$feedback = Replace-Exact $feedback '  <div className="grid min-w-[1180px] grid-cols-[minmax(220px,1.5fr)_76px_104px_112px_84px_92px_minmax(240px,1fr)_28px] gap-2 border-b border-[color:var(--admin-border)] bg-black/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[color:var(--admin-muted)]">' '  <div className="grid min-w-[900px] grid-cols-[minmax(220px,1.6fr)_72px_100px_118px_82px_96px_minmax(160px,0.9fr)_28px] gap-2 border-b border-[color:var(--admin-border)] bg-black/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.12em] text-[color:var(--admin-muted)]">' "feedback table header width"
$feedback = Replace-Exact $feedback '  <span>{t.phone}</span><span>{t.score}</span><span>{t.level}</span><span>{t.recovery}</span><span>{t.date}</span><span>{t.whatsapp}</span><span>{t.recovery}</span><span />' '  <span>{t.phone}</span><span>{t.score}</span><span>{t.level}</span><span>{t.recovery}</span><span>{t.date}</span><span>{t.whatsapp}</span><span>{language === "fa" ? "مرحله" : language === "ar" ? "المرحلة" : "Stage"}</span><span />' "feedback table stage header"
$feedback = Replace-Exact $feedback '  className={`grid min-h-[58px] min-w-[1180px] w-full cursor-pointer grid-cols-[minmax(220px,1.5fr)_76px_104px_112px_84px_92px_minmax(240px,1fr)_28px] items-center gap-2 px-4 py-2 text-start transition hover:bg-amber-300/[0.08] ${selectedId === item.id ? "bg-amber-300/[0.10]" : ""}`}' '  className={`grid min-h-[58px] min-w-[900px] w-full cursor-pointer grid-cols-[minmax(220px,1.6fr)_72px_100px_118px_82px_96px_minmax(160px,0.9fr)_28px] items-center gap-2 px-4 py-2 text-start transition hover:bg-amber-300/[0.08] ${selectedId === item.id ? "bg-amber-300/[0.10]" : ""}`}' "feedback row width"

$oldActions = @'
  <div className="flex flex-nowrap items-center gap-2" onClick={(event) => event.stopPropagation()}>
  {stage !== "new" && (
  <button type="button" disabled={movingFeedbackId === item.id} onClick={() => moveFeedback(item.id, "new")} className="whitespace-nowrap rounded-xl border border-[color:var(--admin-border)] bg-black/10 px-3 py-2 text-xs font-bold text-[color:var(--admin-text)] disabled:opacity-50">{movingFeedbackId === item.id ? t.moving : t.moveToNew}</button>
  )}
  {stage !== "follow_up" && (
  <button type="button" disabled={movingFeedbackId === item.id} onClick={() => moveFeedback(item.id, "follow_up")} className="whitespace-nowrap rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:opacity-50">{movingFeedbackId === item.id ? t.moving : t.moveToFollowUp}</button>
  )}
  {stage !== "resolved" && (
  <button type="button" disabled={movingFeedbackId === item.id} onClick={() => moveFeedback(item.id, "resolved")} className="whitespace-nowrap rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:opacity-50">{movingFeedbackId === item.id ? t.moving : t.moveToResolved}</button>
  )}
  </div>
'@
$newActions = @'
  <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
  <select
  value={item.workflowStage ?? "new"}
  disabled={movingFeedbackId === item.id}
  onChange={(event) => moveFeedback(item.id, event.target.value as "new" | "follow_up" | "resolved")}
  className="w-full rounded-xl border border-[color:var(--admin-border)] bg-black/10 px-2 py-2 text-xs font-bold text-[color:var(--admin-text)] outline-none disabled:opacity-50"
  >
  <option value="new">{t.newFeedbacks}</option>
  <option value="follow_up">{t.inFollowUp}</option>
  <option value="resolved">{t.resolvedFeedbacks}</option>
  </select>
  </div>
'@
$feedback = Replace-Exact $feedback $oldActions $newActions "feedback row stage selector"

$oldSections = @'
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
$newSections = @'
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
$feedback = Replace-Exact $feedback $oldSections $newSections "feedback workflow tabs"

$oldDetailBadges = '  <div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant={segmentVariant(selectedDetail.segment)}>{selectedDetail.segment}</Badge><Badge variant="secondary">{t.language}: {selectedDetail.language}</Badge></div>'
$newDetailBadges = @'
  <div className="mb-3 flex flex-wrap items-center gap-2">
  <Badge variant={segmentVariant(selectedDetail.segment)}>{selectedDetail.segment}</Badge>
  <Badge variant="secondary">{t.language}: {selectedDetail.language}</Badge>
  <select
  value={state.feedback.find((item) => item.id === selectedDetail.id)?.workflowStage ?? "new"}
  disabled={movingFeedbackId === selectedDetail.id}
  onChange={(event) => moveFeedback(selectedDetail.id, event.target.value as "new" | "follow_up" | "resolved")}
  className="rounded-xl border border-[color:var(--admin-border)] bg-black/10 px-3 py-2 text-xs font-bold text-[color:var(--admin-text)] outline-none disabled:opacity-50"
  >
  <option value="new">{t.newFeedbacks}</option>
  <option value="follow_up">{t.inFollowUp}</option>
  <option value="resolved">{t.resolvedFeedbacks}</option>
  </select>
  </div>
'@
$feedback = Replace-Exact $feedback $oldDetailBadges $newDetailBadges "feedback detail stage selector"

Set-Content -LiteralPath $feedbackUiPath $feedback -Encoding UTF8
Write-Host "Updated CRM feedback workflow UI." -ForegroundColor Green

# Keep workflow stage and recovery case aligned when returning to New.
$feedbackActions = Get-Content -LiteralPath $feedbackActionsPath -Raw -Encoding UTF8
$feedbackActions = Replace-Exact $feedbackActions @'
  if (targetStage === "follow_up") {
'@ @'
  if (targetStage === "new") {
  const { error: recoveryError } = await supabase
  .from("feedback_recovery_cases")
  .update({ status: "open", resolved_at: null })
  .eq("feedback_submission_id", feedbackId);
  if (recoveryError) {
  return { success: false, message: recoveryError.message };
  }
  }

  if (targetStage === "follow_up") {
'@ "feedback New-stage recovery reset"
Set-Content -LiteralPath $feedbackActionsPath $feedbackActions -Encoding UTF8
Write-Host "Updated CRM feedback workflow transition logic." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Loyalty: Coffee / Food labels and defaults
# -----------------------------------------------------------------------------
$loyalty = Get-Content -LiteralPath $loyaltyUiPath -Raw -Encoding UTF8
$loyalty = Replace-Exact $loyalty @'
function rewardText(row: Pick<LoyaltyCounterRow, "rewardLabel" | "rewardType" | "rewardValue">) {
  return row.rewardLabel || `${row.rewardValue} ${row.rewardType}`;
}
'@ @'
function rewardText(row: Pick<LoyaltyCounterRow, "rewardLabel" | "rewardType" | "rewardValue">) {
  return row.rewardLabel || `${row.rewardValue} ${row.rewardType}`;
}

function ruleDisplayName(rule: { categoryKey: string; name: string }, language: "fa" | "ar" | "en") {
  if (rule.categoryKey === "coffee") return language === "fa" ? "قهوه" : language === "ar" ? "قهوة" : "Coffee";
  if (rule.categoryKey === "food") return language === "fa" ? "غذا" : language === "ar" ? "طعام" : "Food";
  return rule.name;
}
'@ "loyalty localized rule labels"
$loyalty = Replace-Exact $loyalty '{initialState.rules.map(r=><option key={r.id} value={r.id}>{r.name} · {r.thresholdCount}</option>)}' '{initialState.rules.map(r=><option key={r.id} value={r.id}>{ruleDisplayName(r, language)} · {r.thresholdCount}</option>)}' "loyalty rule options"
Set-Content -LiteralPath $loyaltyUiPath $loyalty -Encoding UTF8
Write-Host "Updated Loyalty counter options UI." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Feedback question safe versioning + delete/archive action
# -----------------------------------------------------------------------------
$qActions = Get-Content -LiteralPath $questionActionsPath -Raw -Encoding UTF8
$qActions = Replace-Exact $qActions @'
  const { data, error } = await supabase.rpc("admin_save_feedback_question_fast", {
    p_business_id: input.businessId,
    p_question_id: input.questionId ?? null,
'@ @'
  let questionIdForSave = input.questionId ?? null;
  if (input.questionId) {
    const { count, error: answerCountError } = await supabase
      .from("feedback_answers")
      .select("id", { count: "exact", head: true })
      .eq("question_id", input.questionId);
    if (answerCountError) {
      return { success: false, message: answerCountError.message };
    }
    if ((count ?? 0) > 0) {
      const { error: archiveError } = await supabase
        .from("feedback_questions")
        .update({ is_active: false })
        .eq("id", input.questionId)
        .eq("business_id", input.businessId);
      if (archiveError) {
        return { success: false, message: archiveError.message };
      }
      questionIdForSave = null;
    }
  }

  const { data, error } = await supabase.rpc("admin_save_feedback_question_fast", {
    p_business_id: input.businessId,
    p_question_id: questionIdForSave,
'@ "question versioning before save"
$qActions = Replace-Exact $qActions '  let savedQuestionId = input.questionId ?? result.question?.id ?? null;' '  let savedQuestionId = questionIdForSave ?? result.question?.id ?? null;' "versioned saved question id"

$qActions = Replace-Exact $qActions @'
export async function reorderAdminQuestions(
'@ @'
export async function deleteAdminQuestion(
  businessId: string,
  questionId: string,
) {
  await requireModulePermission("settings_feedback", "edit");
  const supabase = createSupabaseAdminClient();

  const { count, error: countError } = await supabase
    .from("feedback_answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);
  if (countError) {
    return { success: false, message: countError.message };
  }

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("feedback_questions")
      .update({ is_active: false })
      .eq("id", questionId)
      .eq("business_id", businessId);
    if (error) return { success: false, message: error.message };
    revalidatePath("/admin/questions");
    revalidatePath("/admin/settings/feedback-center/questions");
    revalidatePath("/feedback");
    return { success: true, message: "Question archived because it has historical answers.", archived: true };
  }

  const { error } = await supabase
    .from("feedback_questions")
    .delete()
    .eq("id", questionId)
    .eq("business_id", businessId);
  if (error) return { success: false, message: error.message };

  revalidatePath("/admin/questions");
  revalidatePath("/admin/settings/feedback-center/questions");
  revalidatePath("/feedback");
  return { success: true, message: "Question deleted.", archived: false };
}

export async function reorderAdminQuestions(
'@ "question delete/archive action"
Set-Content -LiteralPath $questionActionsPath $qActions -Encoding UTF8
Write-Host "Updated question versioning and delete/archive actions." -ForegroundColor Green

# Question manager UI delete button.
$qUi = Get-Content -LiteralPath $questionUiPath -Raw -Encoding UTF8
$qUi = Replace-Exact $qUi @'
  getAdminQuestions,
'@ @'
  deleteAdminQuestion,
  getAdminQuestions,
'@ "question delete action import"

$qUi = Replace-Exact $qUi @'
  const move = (question: AdminQuestion, direction: "up" | "down") => {
'@ @'
  const removeQuestion = (question: AdminQuestion) => {
    if (!business || isPending) return;
    const accepted = window.confirm("Delete this question? Questions with historical answers will be archived instead of permanently deleted.");
    if (!accepted) return;
    startTransition(async () => {
      const result = await deleteAdminQuestion(business.id, question.id);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      const nextState = await getAdminQuestions();
      setState(nextState);
      setMessage(result.message);
      if (form.id === question.id) resetForm();
    });
  };

  const move = (question: AdminQuestion, direction: "up" | "down") => {
'@ "question delete handler"

$qUi = Replace-Exact $qUi @'
          <Button
            variant="secondary"
            onClick={() => toggle(question)}
            disabled={isPending}
          >
            {question.active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {question.active ? "Hide" : "Show"}
          </Button>
'@ @'
          <Button
            variant="secondary"
            onClick={() => toggle(question)}
            disabled={isPending}
          >
            {question.active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {question.active ? "Hide" : "Show"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => removeQuestion(question)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
'@ "question delete button"
Set-Content -LiteralPath $questionUiPath $qUi -Encoding UTF8
Write-Host "Updated Feedback Questions UI with delete/archive control." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Multiple Choice: hydrate options/type on the public feedback page
# -----------------------------------------------------------------------------
$publicPage = Get-Content -LiteralPath $publicFeedbackPagePath -Raw -Encoding UTF8
$publicPage = Replace-Exact $publicPage @'
  return {
    business: result.business,
    questions: result.questions && result.questions.length > 0 ? result.questions : fallbackQuestions,
  };
'@ @'
  const rpcQuestions = result.questions && result.questions.length > 0
    ? result.questions
    : fallbackQuestions;

  const questionIds = rpcQuestions
    .map((question) => question.id)
    .filter((id) => !id.startsWith("fallback-"));

  if (questionIds.length === 0) {
    return { business: result.business, questions: rpcQuestions };
  }

  const { data: optionRows, error: optionError } = await supabase
    .from("feedback_questions")
    .select("id, options_json")
    .eq("business_id", result.business.id)
    .in("id", questionIds);

  if (optionError) {
    return { business: result.business, questions: rpcQuestions };
  }

  const optionsById = new Map(
    (optionRows ?? []).map((row) => [
      row.id as string,
      Array.isArray(row.options_json) ? row.options_json : [],
    ]),
  );

  const hydratedQuestions = rpcQuestions.map((question) => {
    const options = optionsById.get(question.id) ?? [];
    if (options.length === 0) return question;
    return {
      ...question,
      type: "multiple_choice" as const,
      options: options as FeedbackQuestion["options"],
    };
  });

  return { business: result.business, questions: hydratedQuestions };
'@ "public feedback multiple choice hydration"
Set-Content -LiteralPath $publicFeedbackPagePath $publicPage -Encoding UTF8
Write-Host "Fixed Multiple Choice public feedback hydration." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Feedback reward rule enforcement for Thank You Only + cleanup
# -----------------------------------------------------------------------------
$submitActions = Get-Content -LiteralPath $submitFeedbackActionsPath -Raw -Encoding UTF8
$submitActions = Replace-Exact $submitActions @'
  return data as SubmitFeedbackResult;
'@ @'
  const result = data as SubmitFeedbackResult;
  const score = typeof result.averageScore === "number" ? result.averageScore : 0;
  const bandKey = score >= 4 ? "high" : score > 2 ? "mid" : "low";

  const { data: responseRule } = await supabase
    .from("feedback_response_rules")
    .select("response_method, is_active")
    .eq("business_id", payload.businessId)
    .eq("band_key", bandKey)
    .eq("is_active", true)
    .maybeSingle();

  if (responseRule?.response_method === "thanks" && result.reward?.code) {
    const { data: deletedCodes } = await supabase
      .from("discount_codes")
      .delete()
      .eq("business_id", payload.businessId)
      .eq("code", result.reward.code)
      .select("feedback_submission_id");

    const submissionIds = (deletedCodes ?? [])
      .map((row) => row.feedback_submission_id)
      .filter((id): id is string => Boolean(id));

    if (submissionIds.length > 0) {
      await supabase
        .from("feedback_submissions")
        .update({ reward_generated: false })
        .in("id", submissionIds);
    }

    return { ...result, reward: null };
  }

  return result;
'@ "Thank You Only reward enforcement"
Set-Content -LiteralPath $submitFeedbackActionsPath $submitActions -Encoding UTF8
Write-Host "Enforced Thank You Only reward suppression." -ForegroundColor Green

# -----------------------------------------------------------------------------
# Copy public feedback layout/loading and Supabase migration
# -----------------------------------------------------------------------------
$feedbackDir = Join-Path $root "src/app/feedback"
New-Item -ItemType Directory -Force -Path $feedbackDir | Out-Null
$layoutSource = Join-Path $packageDir "payload/src/app/feedback/layout.tsx"
$loadingSource = Join-Path $packageDir "payload/src/app/feedback/loading.tsx"
Copy-Item $layoutSource (Join-Path $feedbackDir "layout.tsx") -Force
Copy-Item $loadingSource (Join-Path $feedbackDir "loading.tsx") -Force
Write-Host "Added isolated public Feedback layout and loading screen." -ForegroundColor Green

$migrationSource = Join-Path $packageDir "payload/supabase/migrations/20260708233000_loyalty_coffee_food_rules.sql"
$migrationDestDir = Join-Path $root "supabase/migrations"
$migrationDest = Join-Path $migrationDestDir "20260708233000_loyalty_coffee_food_rules.sql"
New-Item -ItemType Directory -Force -Path $migrationDestDir | Out-Null
Copy-Item $migrationSource $migrationDest -Force
Write-Host "Added Supabase migration: supabase/migrations/20260708233000_loyalty_coffee_food_rules.sql" -ForegroundColor Yellow

Write-Host ""
Write-Host "QA Feedback/CRM Batch 1 applied successfully." -ForegroundColor Green
Write-Host "Next:" -ForegroundColor Cyan
Write-Host "1) Run the new Supabase migration."
Write-Host "2) Run: npm run build"
Write-Host "3) Test Feedback QR, Multiple Choice, reward rules, question edit/delete, workflow stages, and Loyalty counters."
Write-Host "4) Only after tests pass: git add . ; git commit -m 'QA feedback CRM batch 1' ; git push origin main"
