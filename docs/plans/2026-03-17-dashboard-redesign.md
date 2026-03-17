# Dashboard Redesign — "Page de journal" Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform both dashboards (translator + admin) from flat stat grids into an editorial "newspaper front page" layout with strong typographic hierarchy, contextual messaging, and a two-column article/sidebar structure.

**Architecture:** Server Components only (no new client components needed). Inline helper components per page — no shared component library for this since each dashboard has different data shapes. Reuse existing server actions, types, and utils. No new data fetching.

**Tech Stack:** Next.js 14 App Router, TailwindCSS, existing Playfair Display (serif) + Inter (sans-serif) fonts, existing StatusBadge component, existing formatRelative/formatDate/formatDateShort utils.

---

### Task 1: Rewrite Translator Dashboard — Hero Section

**Files:**
- Modify: `src/app/translator/dashboard/page.tsx`

**Step 1: Compute hero contextual data**

Replace the existing stats computation (lines 32-37) and add hero message logic. After the existing `Promise.all` block, add:

```tsx
const allAssignments = assignments ?? [];
const allPlans = plans ?? [];

const totalAssignments = allAssignments.length;
const inProgressCount = stats?.inProgressCount ?? 0;
const translatedCount = stats?.translatedCount ?? 0;
const pendingCount = totalAssignments - translatedCount - inProgressCount;

// Hero contextual message
const nextPlan = allPlans.length > 0 ? allPlans[0] : null;
const today = new Date();
const nextServiceDate = nextPlan
  ? new Date(nextPlan.service.service_date)
  : null;
const daysUntilService = nextServiceDate
  ? Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  : null;

let heroMessage: string;
if (pendingCount > 0) {
  heroMessage = `${pendingCount} temoignage${pendingCount > 1 ? "s" : ""} vous attend${pendingCount > 1 ? "ent" : ""}.`;
} else if (inProgressCount > 0) {
  heroMessage = `${inProgressCount} traduction${inProgressCount > 1 ? "s" : ""} en cours.`;
} else {
  heroMessage = "Tout est a jour.";
}

let heroSubline: string | null = null;
let heroSublineHref: string | null = null;
if (nextPlan && daysUntilService !== null && daysUntilService <= 7) {
  heroSubline = `Prochain planning : ${formatDate(nextPlan.service.service_date)}`;
  heroSublineHref = `/translator/plans/${nextPlan.id}`;
}
```

**Step 2: Replace the return JSX with editorial hero**

Replace the entire return statement. The hero section:

```tsx
return (
  <div className="space-y-8">
    {/* Hero editorial */}
    <header className="pb-6 border-b border-border">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Bonjour, {profile.full_name.split(" ")[0]}.
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {heroMessage}
      </p>
      {heroSubline && (
        <p className="mt-1 text-sm">
          {heroSublineHref ? (
            <Link href={heroSublineHref} className="text-primary hover:underline">
              {heroSubline}
            </Link>
          ) : (
            <span className="text-muted-foreground">{heroSubline}</span>
          )}
        </p>
      )}
    </header>

    {/* Two-column layout placeholder — filled in Task 2 */}
  </div>
);
```

**Step 3: Remove unused imports**

Remove `Card`, `CardContent`, `CardHeader`, `CardTitle` imports and the `DashboardCard` component at the bottom of the file. Remove unused icon imports (`FileText`, `Languages`, `CheckCircle`, `CalendarDays`). Keep `ArrowRight`, `User`.

**Step 4: Verify build**

Run: `cd "/Users/neaskol/Downloads/AGENTIC WORKFLOW/Testimony" && npm run build 2>&1 | tail -20`
Expected: Build succeeds with no type errors.

**Step 5: Commit**

```bash
git add src/app/translator/dashboard/page.tsx
git commit -m "refactor: translator dashboard hero section — editorial style"
```

---

### Task 2: Translator Dashboard — Two-Column Layout with Articles + Sidebar

**Files:**
- Modify: `src/app/translator/dashboard/page.tsx`

**Step 1: Add the two-column layout after the hero**

After the `</header>` closing tag, add the two-column structure:

```tsx
{/* Two-column editorial layout */}
<div className="lg:grid lg:grid-cols-3 lg:gap-12">
  {/* Main column — Articles */}
  <main className="lg:col-span-2">
    {/* Mobile-only stats row */}
    <div className="flex gap-6 pb-6 border-b border-border lg:hidden">
      <div>
        <p className="text-2xl font-bold tabular-nums">{totalAssignments}</p>
        <p className="text-xs text-muted-foreground">assignations</p>
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{inProgressCount}</p>
        <p className="text-xs text-muted-foreground">en cours</p>
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{translatedCount}</p>
        <p className="text-xs text-muted-foreground">terminees</p>
      </div>
    </div>

    {/* Section title */}
    <h2 className="mt-6 font-serif text-lg font-semibold lg:mt-0">
      A traduire
    </h2>
    <div className="mt-3 border-t border-border" />

    {/* Article list */}
    {allAssignments.length === 0 ? (
      <p className="py-12 text-sm text-muted-foreground text-center">
        Aucune assignation pour le moment.
      </p>
    ) : (
      <div className="divide-y divide-border">
        {allAssignments.slice(0, 7).map((assignment) => {
          const testimony = assignment.testimony;
          const witnessName = testimony.witness?.full_name ?? "Temoin anonyme";
          const extract = testimony.content
            ? testimony.content.split(/[.!?]/)[0]?.trim() || testimony.content.slice(0, 100)
            : null;

          return (
            <Link
              key={assignment.id}
              href={`/translator/testimonies/${testimony.id}`}
              className="flex items-start gap-4 py-4 group transition-colors hover:bg-muted/20 -mx-2 px-2 rounded"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{witnessName}</p>
                {extract && (
                  <p className="mt-1 text-sm italic text-muted-foreground line-clamp-2">
                    &laquo;&nbsp;{extract}&nbsp;&raquo;
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={testimony.status} />
                  <span>&middot;</span>
                  <span>{formatRelative(assignment.assigned_at)}</span>
                </div>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </Link>
          );
        })}
      </div>
    )}

    {allAssignments.length > 7 && (
      <div className="mt-4 pt-4 border-t border-border">
        <Link
          href="/translator/testimonies"
          className="text-sm text-primary hover:underline"
        >
          Tout voir &rarr;
        </Link>
      </div>
    )}

    {/* Plannings section — mobile only */}
    <div className="mt-8 lg:hidden">
      <h2 className="font-serif text-lg font-semibold">Plannings</h2>
      <div className="mt-3 border-t border-border" />
      {allPlans.length === 0 ? (
        <p className="py-8 text-sm text-muted-foreground text-center">
          Aucun planning assigne.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {allPlans.slice(0, 5).map((plan) => (
            <Link
              key={plan.id}
              href={`/translator/plans/${plan.id}`}
              className="flex items-center justify-between py-3 group"
            >
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {plan.service.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(plan.service.service_date)} &middot; {plan.testimony_ids.length} tem.
                </p>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground/50" />
            </Link>
          ))}
        </div>
      )}
    </div>
  </main>

  {/* Sidebar — desktop only */}
  <aside className="hidden lg:block">
    {/* Stats sidebar with gold left border */}
    <div className="border-l-2 border-primary pl-6">
      <div className="space-y-0 divide-y divide-border">
        <div className="pb-4">
          <p className="text-2xl font-bold tabular-nums">{totalAssignments}</p>
          <p className="text-xs text-muted-foreground">assignations</p>
        </div>
        <div className="py-4">
          <p className="text-2xl font-bold tabular-nums">{inProgressCount}</p>
          <p className="text-xs text-muted-foreground">en cours</p>
        </div>
        <div className="pt-4">
          <p className="text-2xl font-bold tabular-nums">{translatedCount}</p>
          <p className="text-xs text-muted-foreground">terminees</p>
        </div>
      </div>

      {/* Plannings mini-list */}
      {allPlans.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Plannings
          </h3>
          <div className="mt-3 divide-y divide-border">
            {allPlans.slice(0, 4).map((plan) => (
              <Link
                key={plan.id}
                href={`/translator/plans/${plan.id}`}
                className="block py-2.5 group"
              >
                <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                  {plan.service.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(plan.service.service_date)} &middot; {plan.testimony_ids.length} tem.
                </p>
              </Link>
            ))}
          </div>
          {allPlans.length > 4 && (
            <Link
              href="/translator/plans"
              className="mt-3 block text-xs text-primary hover:underline"
            >
              Tout voir &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  </aside>
</div>
```

**Step 2: Add missing imports**

Add `formatDateShort` to the utils import and `formatRelative` if not already imported.

**Step 3: Verify build**

Run: `cd "/Users/neaskol/Downloads/AGENTIC WORKFLOW/Testimony" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/translator/dashboard/page.tsx
git commit -m "feat: translator dashboard two-column editorial layout"
```

---

### Task 3: Rewrite Admin Dashboard — Same Editorial Pattern

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

**Step 1: Add needed imports**

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/actions/auth";
import { getTestimonies } from "@/actions/testimonies";
import { getServices } from "@/actions/services";
import { getPlans } from "@/actions/plans";
import { formatDate, formatDateShort, formatRelative } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
```

**Step 2: Compute hero data after the existing Promise.all**

```tsx
const totalTestimonies = testimonies.length;
const inTranslation = testimonies.filter(
  (t) => t.status === "in_translation"
).length;
const planned = testimonies.filter((t) => t.status === "planned").length;
const translated = testimonies.filter((t) => t.status === "translated").length;

const today = new Date().toISOString().split("T")[0];
const upcomingServices = services
  .filter((s) => s.service_date >= today)
  .sort((a, b) => a.service_date.localeCompare(b.service_date));
const nextService = upcomingServices[0] ?? null;

// Find the plan linked to the next service (if any)
const nextPlan = nextService
  ? plans.find((p) => p.service_id === nextService.id) ?? null
  : null;

let heroMessage: string;
if (totalTestimonies === 0) {
  heroMessage = "Aucun temoignage pour le moment.";
} else {
  const parts: string[] = [`${totalTestimonies} temoignage${totalTestimonies > 1 ? "s" : ""}`];
  if (inTranslation > 0) parts.push(`${inTranslation} en traduction`);
  if (translated > 0) parts.push(`${translated} traduit${translated > 1 ? "s" : ""}`);
  heroMessage = parts.join(" \u00b7 ");
}
```

**Step 3: Replace the return JSX with the editorial layout**

```tsx
return (
  <div className="space-y-8">
    {/* Hero editorial */}
    <header className="pb-6 border-b border-border">
      <h1 className="font-serif text-3xl font-bold tracking-tight">
        Bonjour, {profile.full_name.split(" ")[0]}.
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {heroMessage}
      </p>
      {nextService && (
        <p className="mt-1 text-sm">
          {nextPlan ? (
            <Link
              href={`/admin/plans/${nextPlan.id}`}
              className="text-primary hover:underline"
            >
              Prochaine reunion : {formatDate(nextService.service_date)}
            </Link>
          ) : (
            <span className="text-primary">
              Prochaine reunion : {formatDate(nextService.service_date)}
            </span>
          )}
        </p>
      )}
    </header>

    {/* Two-column editorial layout */}
    <div className="lg:grid lg:grid-cols-3 lg:gap-12">
      {/* Main column — Recent plans */}
      <main className="lg:col-span-2">
        {/* Mobile-only stats row */}
        <div className="flex gap-6 pb-6 border-b border-border lg:hidden">
          <div>
            <p className="text-2xl font-bold tabular-nums">{totalTestimonies}</p>
            <p className="text-xs text-muted-foreground">temoignages</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{inTranslation}</p>
            <p className="text-xs text-muted-foreground">en traduction</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{planned}</p>
            <p className="text-xs text-muted-foreground">planifies</p>
          </div>
        </div>

        <h2 className="mt-6 font-serif text-lg font-semibold lg:mt-0">
          Plannings recents
        </h2>
        <div className="mt-3 border-t border-border" />

        {plans.length === 0 ? (
          <p className="py-12 text-sm text-muted-foreground text-center">
            Aucun planning pour le moment.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {plans.slice(0, 7).map((plan) => (
              <Link
                key={plan.id}
                href={`/admin/plans/${plan.id}`}
                className="flex items-start gap-4 py-4 group transition-colors hover:bg-muted/20 -mx-2 px-2 rounded"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{plan.service.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(plan.service.service_date)} &middot;{" "}
                    {plan.testimony_ids.length} temoignage{plan.testimony_ids.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        )}

        {plans.length > 7 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link
              href="/admin/plans"
              className="text-sm text-primary hover:underline"
            >
              Tout voir &rarr;
            </Link>
          </div>
        )}
      </main>

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:block">
        <div className="border-l-2 border-primary pl-6">
          <div className="space-y-0 divide-y divide-border">
            <div className="pb-4">
              <p className="text-2xl font-bold tabular-nums">{totalTestimonies}</p>
              <p className="text-xs text-muted-foreground">temoignages</p>
            </div>
            <div className="py-4">
              <p className="text-2xl font-bold tabular-nums">{inTranslation}</p>
              <p className="text-xs text-muted-foreground">en traduction</p>
            </div>
            <div className="py-4">
              <p className="text-2xl font-bold tabular-nums">{planned}</p>
              <p className="text-xs text-muted-foreground">planifies</p>
            </div>
            <div className="pt-4">
              <p className="text-2xl font-bold tabular-nums">
                {nextService ? formatDateShort(nextService.service_date) : "\u2014"}
              </p>
              <p className="text-xs text-muted-foreground">prochaine reunion</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
);
```

**Step 4: Remove the old `DashboardCard` component** at the bottom of the file.

**Step 5: Verify build**

Run: `cd "/Users/neaskol/Downloads/AGENTIC WORKFLOW/Testimony" && npm run build 2>&1 | tail -20`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/app/admin/dashboard/page.tsx
git commit -m "feat: admin dashboard editorial redesign — newspaper style"
```

---

### Task 4: Visual Polish and Final Verification

**Files:**
- Modify: `src/app/translator/dashboard/page.tsx` (minor tweaks if needed)
- Modify: `src/app/admin/dashboard/page.tsx` (minor tweaks if needed)

**Step 1: Visual review in browser**

Open both dashboards in the browser and check:
- Hero text renders in Playfair Display (serif)
- Contextual message is correct
- Two-column layout works on desktop (lg+)
- Mobile falls back to single column with inline stats
- Gold left border on sidebar is visible (#B8860B / `border-primary`)
- Filets (dividers) are thin and consistent
- Article items have hover states
- Links work correctly
- Guillemets francais render properly on testimony extracts

**Step 2: Fix any visual issues found**

Adjust spacing, typography, or layout as needed based on review.

**Step 3: Final build check**

Run: `cd "/Users/neaskol/Downloads/AGENTIC WORKFLOW/Testimony" && npm run build 2>&1 | tail -20`
Expected: Clean build, no warnings.

**Step 4: Commit and push**

```bash
git add -A
git commit -m "fix: dashboard redesign polish and adjustments"
git push
```
