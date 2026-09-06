import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Users, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateSkillMatch, type Opportunity, type Profile } from "@/lib/skill-match";
import { DEMO_OPPORTUNITIES, DEMO_STUDENTS } from "@/lib/demo-data";

export const Route = createFileRoute("/college")({
  head: () => ({
    meta: [
      { title: "College Dashboard — SkillForge" },
      {
        name: "description",
        content:
          "Placement readiness, top skill gaps and in-demand technologies aggregated across your students' skill profiles.",
      },
      { property: "og:title", content: "College Dashboard — SkillForge" },
      {
        property: "og:description",
        content: "Aggregate placement-readiness analytics for placement cells on SkillForge.",
      },
    ],
  }),
  component: CollegeDashboard,
});

function CollegeDashboard() {
  const { data: students = [] } = useQuery({
    queryKey: ["college-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, college_name, skills")
        .eq("role", "student");
      if (error) throw error;
      return data as Pick<Profile, "full_name" | "college_name" | "skills">[];
    },
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*");
      if (error) throw error;
      return data as Opportunity[];
    },
  });

  const cohort = students.length ? students : DEMO_STUDENTS;
  const jobs = opportunities.length ? opportunities : DEMO_OPPORTUNITIES;

  const readiness = useMemo(
    () =>
      cohort.map((student) => {
        const best = Math.max(
          0,
          ...jobs.map((job) => calculateSkillMatch(student.skills ?? [], job.required_skills).matchPercentage),
        );
        return { name: (student.full_name ?? "Student").split(" ")[0] ?? "Student", readiness: best };
      }),
    [cohort, jobs],
  );

  const avgReadiness = readiness.length
    ? Math.round(readiness.reduce((sum, r) => sum + r.readiness, 0) / readiness.length)
    : 0;
  const placementReady = readiness.filter((r) => r.readiness >= 75).length;

  const gaps = useMemo(() => {
    const counts = new Map<string, number>();
    cohort.forEach((student) =>
      jobs.forEach((job) =>
        calculateSkillMatch(student.skills ?? [], job.required_skills).missingSkills.forEach((s) =>
          counts.set(s, (counts.get(s) ?? 0) + 1),
        ),
      ),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [cohort, jobs]);

  const inDemand = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach((job) =>
      job.required_skills.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [jobs]);

  const maxGap = gaps[0]?.[1] ?? 1;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header>
          <h1 className="text-3xl font-bold">College dashboard</h1>
          <p className="text-muted-foreground">
            Aggregated from {cohort.length} student profiles against {jobs.length} live roles.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat icon={TrendingUp} label="Average readiness" value={`${avgReadiness}%`} />
          <Stat icon={Users} label="Placement ready" value={`${placementReady}/${cohort.length}`} />
          <Stat icon={AlertTriangle} label="Critical gap" value={gaps[0]?.[0] ?? "—"} />
        </div>

        <Card className="shadow-panel">
          <CardHeader>
            <CardTitle>Placement readiness by student</CardTitle>
            <CardDescription>Best available match across all posted roles</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readiness}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    color: "var(--color-foreground)",
                  }}
                />
                <Bar dataKey="readiness" radius={[6, 6, 0, 0]}>
                  {readiness.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.readiness >= 75
                          ? "var(--color-chart-4)"
                          : entry.readiness >= 45
                            ? "var(--color-chart-2)"
                            : "var(--color-chart-5)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-panel">
            <CardHeader>
              <CardTitle>Top skill gaps</CardTitle>
              <CardDescription>Where the cohort loses matches most often</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gaps.map(([skill, count]) => (
                <div key={skill} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{skill}</span>
                    <span className="text-muted-foreground">{count} misses</span>
                  </div>
                  <Progress value={(count / maxGap) * 100} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-panel">
            <CardHeader>
              <CardTitle>In-demand technologies</CardTitle>
              <CardDescription>Most requested skills across live postings</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {inDemand.map(([skill, count]) => (
                <Badge key={skill} variant="outline" className="border-primary/30 text-primary">
                  {skill} · {count}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
}) {
  return (
    <Card className="shadow-panel">
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
