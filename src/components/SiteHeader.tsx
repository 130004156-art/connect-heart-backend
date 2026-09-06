import { Link } from "@tanstack/react-router";
import { Hexagon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/student", label: "Student" },
  { to: "/recruiter", label: "Recruiter" },
  { to: "/college", label: "College" },
] as const;

export function SiteHeader() {
  const { session, profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Hexagon className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">SkillForge</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {profile?.full_name ?? session.user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
