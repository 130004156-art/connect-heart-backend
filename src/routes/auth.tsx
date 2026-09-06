import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Hexagon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { UserRole } from "@/lib/skill-match";

const roleHome: Record<UserRole, "/student" | "/recruiter" | "/college"> = {
  student: "/student",
  recruiter: "/recruiter",
  college_admin: "/college",
};

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: (typeof search["role"] === "string" ? (search["role"] as UserRole) : undefined) as
      | UserRole
      | undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in to SkillForge" },
      {
        name: "description",
        content:
          "Sign in or create a SkillForge account as a student, college admin or recruiter to start skill mapping.",
      },
      { property: "og:title", content: "Sign in to SkillForge" },
      {
        property: "og:description",
        content: "Role-based access for students, colleges and recruiters on SkillForge.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [role, setRole] = useState<UserRole>(search.role ?? "student");
  const [busy, setBusy] = useState(false);

  const afterAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    const target = roleHome[(profile?.role as UserRole) ?? "student"];
    void navigate({ to: target });
  };

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    await afterAuth();
  };

  const signUp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, role, college_name: collegeName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created");
    await afterAuth();
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    await afterAuth();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero px-4 py-12">
      <Card className="w-full max-w-md shadow-panel">
        <CardHeader className="space-y-2 text-center">
          <Hexagon className="mx-auto h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">SkillForge</CardTitle>
          <CardDescription>Bridging campus skills and industry demand</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6 space-y-4">
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" disabled={busy} onClick={() => void signIn()}>
                Sign in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="mt-6 space-y-4">
              <Field label="Full name" value={fullName} onChange={setFullName} />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />
              <div className="space-y-2">
                <Label>I am a</Label>
                <RadioGroup
                  value={role}
                  onValueChange={(v) => setRole(v as UserRole)}
                  className="grid gap-2"
                >
                  {(
                    [
                      ["student", "Student"],
                      ["college_admin", "College admin"],
                      ["recruiter", "Recruiter"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <RadioGroupItem value={value} />
                      {label}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              {role !== "recruiter" && (
                <Field label="College name" value={collegeName} onChange={setCollegeName} />
              )}
              <Button className="w-full" disabled={busy} onClick={() => void signUp()}>
                Create account
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={() => void google()}>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
