import type { Opportunity, Profile } from "./skill-match";

/** Fallback content so every dashboard renders a full demo even when signed out. */

export const DEMO_STUDENT_SKILLS = [
  "React",
  "TypeScript",
  "SQL",
  "Python",
  "REST APIs",
  "Git",
  "Tailwind CSS",
];

export const DEMO_TARGET_ROLE = "Full-Stack Developer";

export const TARGET_ROLE_SKILLS: Record<string, string[]> = {
  "Full-Stack Developer": [
    "React",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "REST APIs",
    "Docker",
  ],
  "Data Analyst": ["SQL", "Python", "Pandas", "Data Visualization", "Statistics", "Excel"],
  "ML Engineer": ["Python", "Machine Learning", "PyTorch", "Statistics", "SQL", "Docker"],
  "Cloud Engineer": ["AWS", "Docker", "Kubernetes", "Linux", "Terraform", "Networking"],
};

export const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    id: "demo-1",
    recruiter_id: null,
    title: "Frontend Engineering Intern",
    company_name: "Nimbus Labs",
    description: "Build accessible dashboards for our analytics suite.",
    required_skills: ["React", "TypeScript", "Tailwind CSS", "REST APIs"],
    stipend: "\u20b935,000/month",
    location: "Bengaluru (Hybrid)",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    recruiter_id: null,
    title: "Data Analyst Intern",
    company_name: "Vayu Analytics",
    description: "Turn messy operational data into decision-ready dashboards.",
    required_skills: ["SQL", "Python", "Pandas", "Data Visualization"],
    stipend: "\u20b928,000/month",
    location: "Remote",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    recruiter_id: null,
    title: "Backend Developer Trainee",
    company_name: "Corewave Systems",
    description: "Ship APIs for a high-volume logistics platform.",
    required_skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs"],
    stipend: "\u20b940,000/month",
    location: "Pune",
    created_at: new Date().toISOString(),
  },
];

export const DEMO_STUDENTS: Pick<Profile, "full_name" | "skills" | "college_name">[] = [
  {
    full_name: "Aarav Menon",
    college_name: "Anna University",
    skills: ["React", "TypeScript", "SQL", "Git"],
  },
  {
    full_name: "Divya Rao",
    college_name: "Anna University",
    skills: ["Python", "Pandas", "SQL", "Machine Learning", "Statistics"],
  },
  {
    full_name: "Karthik Iyer",
    college_name: "Anna University",
    skills: ["Node.js", "PostgreSQL", "Docker", "REST APIs", "AWS"],
  },
  {
    full_name: "Sneha Pillai",
    college_name: "Anna University",
    skills: ["Figma", "UI Design", "User Research"],
  },
  {
    full_name: "Rohit Verma",
    college_name: "Anna University",
    skills: ["Java", "SQL", "Git", "Data Structures"],
  },
];

export const LEARNING_RESOURCES: Record<string, string> = {
  "Node.js": "Node.js Backend Bootcamp",
  PostgreSQL: "Relational Databases & SQL Mastery",
  Docker: "Containers from Zero to Deploy",
  Kubernetes: "Kubernetes for Developers",
  AWS: "AWS Cloud Practitioner Track",
  "Machine Learning": "Applied Machine Learning Path",
  PyTorch: "Deep Learning with PyTorch",
  Statistics: "Statistics for Data Roles",
  Pandas: "Data Wrangling with Pandas",
  Figma: "Product Design Foundations",
};

export const courseFor = (skill: string) => LEARNING_RESOURCES[skill] ?? `${skill} Fundamentals`;
