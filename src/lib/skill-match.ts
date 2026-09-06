export type UserRole = "student" | "college_admin" | "recruiter";
export type ApplicationStatus = "applied" | "reviewing" | "shortlisted" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  college_name: string | null;
  skills: string[];
  target_role: string | null;
  created_at: string;
}

export interface Opportunity {
  id: string;
  recruiter_id: string | null;
  title: string;
  company_name: string;
  description: string | null;
  required_skills: string[];
  stipend: string | null;
  location: string | null;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  student_id: string;
  match_score: number | null;
  status: ApplicationStatus;
  applied_at: string;
}

export interface SkillMatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

const normalize = (value: string) => value.trim().toLowerCase();

export function calculateSkillMatch(
  studentSkills: string[],
  requiredSkills: string[],
): SkillMatchResult {
  const owned = new Set(studentSkills.map(normalize).filter(Boolean));

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const seen = new Set<string>();

  for (const required of requiredSkills) {
    const key = normalize(required);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (owned.has(key)) matchedSkills.push(required.trim());
    else missingSkills.push(required.trim());
  }

  const total = matchedSkills.length + missingSkills.length;
  const matchPercentage =
    total === 0 ? 0 : Math.round((matchedSkills.length / total) * 100 * 100) / 100;

  return { matchPercentage, matchedSkills, missingSkills };
}
