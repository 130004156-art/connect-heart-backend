import { useMemo, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { BookOpen, MapPin, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { TagInput } from "@/components/TagInput";
import { MatchBadge } from "@/components/MatchBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateSkillMatch, type Opportunity } from "@/lib/skill-match";
import {
  DEMO_OPPORTUNITIES,
  DEMO_STUDENT_SKILLS,
  DEMO_TARGET_ROLE,
  TARGET_ROLE_SKILLS,
  courseFor,
} from "@/lib/demo-data";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — SkillForge" },
      {
        name: "description",
        content:
          "Track your skill radar against a target role, see matched internships and follow learning paths that close your gaps.",
      },
      { property: "og:title", content: "Student Dashboard — SkillForge" },
      {
        property: "og:description",
        content: "Your live skill profile, opportunity matches and personalised learning paths.",
      },
    ],
  }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const { session, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [skills, setSkills] = useState<string[]>(DEMO_STUDENT_SKILLS);
  const [targetRole, setTargetRole] = useState<string>(DEMO_TARGET_ROLE);

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills?.length ? profile.skills : DEMO_STUDENT_SKILLS);
      setTargetRole(profile.target_role ?? DEMO_TARGET_ROLE);
    }
  }, [profile]);

  const { data: opportunities = DEMO_OPPORTUNITIES } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Opportunity[]).length ? (data as Opportunity[]) : DEMO_OPPORTUNITIES;
    },
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["my-applications", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("job_id, status");
      if (error) throw error;
      return data as { job_id: string; status: string }[];
    },
  });

  const targetSkills = TARGET_ROLE_SKILLS[targetRole] ?? [];
  const radarData = useMemo(() => {
    const owned = new Set(skills.map((s) => s.trim().toLowerCase()));
    return targetSkills.map((skill) => ({
      skill,
      you: owned.has(skill.toLowerCase()) ? 90 : 30,
      target: 100,
    }));
  }, [skills, targetSkills]);

  const ranked = useMemo(
    () =>
      opportunities
        .map((job) => ({ job, match: calculateSkillMatch(skills, job.required_skills) }))
        .sort((a, b) => b.match.matchPercentage - a.match.matchPercentage),
    [opportunities, skills],
  );

  const missingSkills = useMemo(() => {
    const counts = new Map<string, number>();
    ranked.forEach(({ match }) =>
      match.missingSkills.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1)),
    );
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [ranked]);

  const saveProfile = async () => {
    if (!session) {
      toast.info("Sign in to save your skill profile");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ skills, target_role: targetRole })
      .eq("id", session.user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Skill profile updated");
  };

  const apply = async (job: Opportunity, matchPercentage: number) => {
    if (!session) {
      toast.info("Sign in to apply");
      return;
    }
    const { error } = await supabase.from("applications").insert({
      job_id: job.id,
      student_id: session.user.id,
      match_score: matchPercentage,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Already applied" : error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["my-applications"] });
    toast.success(`Applied to ${job.title}`);
  };

  const appliedIds = new Set(applications.map((a) => a.job_id));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header>
          <h1 className="text-3xl font-bold">Student dashboard</h1>
          <p className="text-muted-foreground">
            {profile?.full_name ? `${profile.full_name} — ` : ""}your skills, matches and gaps in
            one place.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-panel">
            <CardHeader>
              <CardTitle>Skill radar</CardTitle>
              <CardDescription>Your profile vs the target role benchmark</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="var(--color-chart-2)"
                    fill="var(--color-chart-2)"
                    fillOpacity={0.12}
                  />
                  <Radar
                    name="You"
                    dataKey="you"
                    stroke="var(--color-chart-1)"
                    fill="var(--color-chart-1)"
                    fillOpacity={0.35}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-panel">
            <CardHeader>
              <CardTitle>Your skill profile</CardTitle>
              <CardDescription>Edit skills and pick the role you are aiming for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TARGET_ROLE_SKILLS).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TagInput value={skills} onChange={setSkills} />
              <Button onClick={() => void saveProfile()}>Save profile</Button>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Matched opportunities</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ranked.map(({ job, match }) => (
              <Card key={job.id} className="shadow-panel">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>{job.company_name}</CardDescription>
                  </div>
                  <MatchBadge value={match.matchPercentage} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                    )}
                    {job.stipend && (
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" /> {job.stipend}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {match.matchedSkills.map((s) => (
                      <Badge key={s} className="bg-success/15 text-success" variant="outline">
                        {s}
                      </Badge>
                    ))}
                    {match.missingSkills.map((s) => (
                      <Badge key={s} variant="outline" className="text-muted-foreground">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant={appliedIds.has(job.id) ? "secondary" : "default"}
                    disabled={appliedIds.has(job.id)}
                    onClick={() => void apply(job, match.matchPercentage)}
                  >
                    {appliedIds.has(job.id) ? "Applied" : "Apply"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Learning paths</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {missingSkills.map(([skill, count]) => (
              <Card key={skill} className="shadow-panel">
                <CardHeader>
                  <BookOpen className="h-5 w-5 text-accent" />
                  <CardTitle className="text-base">{skill}</CardTitle>
                  <CardDescription>
                    Required by {count} open {count === 1 ? "role" : "roles"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{courseFor(skill)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toast.info("Course module coming soon")}>
                      Start course
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSkills((prev) => [...prev, skill]);
                        toast.success(`${skill} added — save to confirm`);
                      }}
                    >
                      Take quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
