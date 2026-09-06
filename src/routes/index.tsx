import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Building2, School, Sparkles, Target, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillForge — Academia-Industry Skill Mapping" },
      {
        name: "description",
        content:
          "SkillForge connects students, colleges and recruiters: companies post required skills, students prove them, and placement gaps close faster.",
      },
      { property: "og:title", content: "SkillForge — Academia-Industry Skill Mapping" },
      {
        property: "og:description",
        content:
          "A three-sided platform matching student skill profiles to live industry demand, with analytics for colleges.",
      },
    ],
  }),
  component: Landing,
});

const roles = [
  {
    icon: GraduationCap,
    title: "Student",
    copy: "See your skill radar, matched opportunities and the exact gaps to close.",
    to: "/student",
  },
  {
    icon: Building2,
    title: "Recruiter",
    copy: "Post required skills and get ranked applicants with match scores.",
    to: "/recruiter",
  },
  {
    icon: School,
    title: "College",
    copy: "Track placement readiness, top skill gaps and in-demand technologies.",
    to: "/college",
  },
] as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="bg-hero">
          <div className="mx-auto max-w-6xl px-4 py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Smart India Hackathon MVP
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Close the gap between <span className="text-brand-gradient">what campuses teach</span>{" "}
              and what industry hires for
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Companies post the skills they need. Students prove them through assessments. Skill
              profiles update automatically, matches surface instantly, and colleges finally see the
              real picture.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" search={{ role: "student" }}>
                  Get started
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/student">Explore the demo</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-panel">
              <CardHeader>
                <Target className="h-6 w-6 text-accent" />
                <CardTitle>The problem</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                Curricula move slower than hiring requirements. Students discover missing skills
                only after rejection, recruiters sift through unranked resumes, and placement cells
                work off guesswork.
              </CardContent>
            </Card>
            <Card className="shadow-panel">
              <CardHeader>
                <LineChart className="h-6 w-6 text-primary" />
                <CardTitle>The SkillForge solution</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                One live skill graph shared by all three sides. Every posted job becomes a measured
                target, every profile becomes a match score, and every gap becomes a learning path.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <h2 className="text-center text-2xl font-semibold">Choose your dashboard</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.title} className="flex flex-col shadow-panel">
                <CardHeader>
                  <role.icon className="h-7 w-7 text-primary" />
                  <CardTitle>{role.title}</CardTitle>
                  <CardDescription>{role.copy}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto flex gap-2">
                  <Button variant="secondary" className="flex-1" asChild>
                    <Link to={role.to}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        SkillForge — academia-industry skill mapping platform
      </footer>
    </div>
  );
}
