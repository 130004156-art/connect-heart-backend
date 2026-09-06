import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { TagInput } from "@/components/TagInput";
import { MatchBadge } from "@/components/MatchBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, Opportunity, Profile } from "@/lib/skill-match";
import { DEMO_OPPORTUNITIES, DEMO_STUDENTS } from "@/lib/demo-data";
import { calculateSkillMatch } from "@/lib/skill-match";

const STATUSES: ApplicationStatus[] = ["applied", "reviewing", "shortlisted", "rejected"];

export const Route = createFileRoute("/recruiter")({
  head: () => ({
    meta: [
      { title: "Recruiter Dashboard — SkillForge" },
      {
        name: "description",
        content:
          "Post roles with the exact skills you need and review applicants ranked by a transparent skill match score.",
      },
      { property: "og:title", content: "Recruiter Dashboard — SkillForge" },
      {
        property: "og:description",
        content: "Post skill-based roles and manage a ranked applicant pipeline on SkillForge.",
      },
    ],
  }),
  component: RecruiterDashboard,
});

interface ApplicantRow {
  id: string;
  job_id: string;
  status: ApplicationStatus;
  match_score: number | null;
  profiles: Pick<Profile, "full_name" | "college_name" | "skills"> | null;
}

function RecruiterDashboard() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [stipend, setStipend] = useState("");
  const [location, setLocation] = useState("");

  const { data: jobs = [] } = useQuery({
    queryKey: ["recruiter-jobs", session?.user.id],
    queryFn: async () => {
      const query = supabase.from("opportunities").select("*").order("created_at", { ascending: false });
      const { data, error } = session
        ? await query.eq("recruiter_id", session.user.id)
        : await query.limit(0);
      if (error) throw error;
      return data as Opportunity[];
    },
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ["recruiter-applicants", session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, job_id, status, match_score, profiles:student_id (full_name, college_name, skills)")
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ApplicantRow[];
    },
  });

  const shownJobs = jobs.length ? jobs : DEMO_OPPORTUNITIES;
  const isDemoBoard = applicants.length === 0;

  const postJob = async () => {
    if (!session) {
      toast.info("Sign in as a recruiter to post a role");
      return;
    }
    if (!title || !companyName || requiredSkills.length === 0) {
      toast.error("Title, company and at least one skill are required");
      return;
    }
    const { error } = await supabase.from("opportunities").insert({
      recruiter_id: session.user.id,
      title,
      company_name: companyName,
      description,
      required_skills: requiredSkills,
      stipend,
      location,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setDescription("");
    setRequiredSkills([]);
    setStipend("");
    setLocation("");
    await queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
    await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    toast.success("Role posted");
  };

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["recruiter-applicants"] });
    toast.success(`Marked as ${status}`);
  };

  const demoRows = DEMO_STUDENTS.map((student, index) => {
    const job = shownJobs[index % shownJobs.length]!;
    return {
      student,
      job,
      match: calculateSkillMatch(student.skills, job.required_skills).matchPercentage,
    };
  }).sort((a, b) => b.match - a.match);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <header>
          <h1 className="text-3xl font-bold">Recruiter dashboard</h1>
          <p className="text-muted-foreground">Post skill requirements and rank applicants instantly.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <Card className="shadow-panel">
            <CardHeader>
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>Post an opportunity</CardTitle>
              <CardDescription>Skills you list become the matching benchmark</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Required skills</Label>
                <TagInput value={requiredSkills} onChange={setRequiredSkills} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Stipend</Label>
                  <Input value={stipend} onChange={(e) => setStipend(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <Button className="w-full" onClick={() => void postJob()}>
                Post role
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-panel">
              <CardHeader>
                <CardTitle>Your postings</CardTitle>
                <CardDescription>
                  {jobs.length ? `${jobs.length} live` : "Sample roles shown until you post one"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {shownJobs.map((job) => (
                  <div key={job.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{job.title}</span>
                      <span className="text-sm text-muted-foreground">{job.company_name}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.required_skills.map((s) => (
                        <Badge key={s} variant="secondary">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-panel">
              <CardHeader>
                <CardTitle>Applicant board</CardTitle>
                <CardDescription>
                  {isDemoBoard ? "Sample candidates until real applications arrive" : "Live applications"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDemoBoard
                  ? demoRows.map((row) => (
                      <div
                        key={`${row.student.full_name}-${row.job.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{row.student.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {row.job.title} · {row.student.college_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <MatchBadge value={row.match} />
                          <Badge variant="secondary">applied</Badge>
                        </div>
                      </div>
                    ))
                  : applicants.map((row) => (
                      <div
                        key={row.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{row.profiles?.full_name ?? "Candidate"}</p>
                          <p className="text-sm text-muted-foreground">
                            {shownJobs.find((j) => j.id === row.job_id)?.title ?? "Role"} ·{" "}
                            {row.profiles?.college_name ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <MatchBadge value={Number(row.match_score ?? 0)} />
                          <Select
                            value={row.status}
                            onValueChange={(v) => void updateStatus(row.id, v as ApplicationStatus)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
