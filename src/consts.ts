import type {
  Site,
  Metadata,
  Socials,
  Honour,
  SkillGroup,
  Education,
} from "@types";

export const SITE: Site = {
  NAME: "Siddhesh Kulthe",
  EMAIL: "heykulthe@gmail.com",
  LOCATION: "Bengaluru, India",
  ROLE: "Software Engineer",
  COMPANY: "Juspay",
  NUM_WORKS_ON_HOMEPAGE: 2,
  NUM_PROJECTS_ON_HOMEPAGE: 3,
};

export const HOME: Metadata = {
  TITLE: "Siddhesh Kulthe",
  DESCRIPTION:
    "Software engineer at Juspay working on payments infrastructure. Compilers, systems programming and low latency code.",
};

export const ABOUT: Metadata = {
  TITLE: "About",
  DESCRIPTION: "Who I am and what I like working on.",
};

export const WORK: Metadata = {
  TITLE: "Work",
  DESCRIPTION: "Where I have worked and what I built there.",
};

export const PROJECTS: Metadata = {
  TITLE: "Projects",
  DESCRIPTION:
    "Systems built to understand the layer below, and models built to see what they learn.",
};

export const SOCIALS: Socials = [
  {
    NAME: "github",
    HREF: "https://github.com/heykulthe",
  },
  {
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/siddheshkulthe",
  },
  {
    NAME: "codeforces",
    HREF: "https://codeforces.com/profile/kulthe",
  },
  {
    NAME: "huggingface",
    HREF: "https://huggingface.co/siddheshtv",
  },
];

export const EDUCATION: Education = {
  SCHOOL: "AISSMS Institute of Information Technology",
  DEGREE: "B.E., Artificial Intelligence and Data Science",
  DETAIL: "GPA 8.45",
  LOCATION: "Pune, MH",
  YEARS: "Aug 2021 to Jun 2025",
};

export const HONOURS: Honour[] = [
  {
    TITLE: "Codeforces",
    DETAIL: "Expert, max rating 1627",
    HREF: "https://codeforces.com/profile/kulthe",
  },
  {
    TITLE: "Meta Hacker Cup 2025",
    DETAIL: "Round 1, rank 890",
  },
  {
    TITLE: "National Cyber Olympiad",
    DETAIL: "All India Rank 198",
  },
  {
    TITLE: "HSBC Hackathon 2024",
    DETAIL: "Winner",
  },
  {
    TITLE: "Microsoft Azure x Bank of Baroda Hackathon",
    DETAIL: "Top 10",
  },
];

export const SKILLS: SkillGroup[] = [
  {
    LABEL: "Languages",
    ITEMS: ["C", "C++", "Rust", "Java", "Python", "Bash"],
  },
  {
    LABEL: "Technologies",
    ITEMS: [
      "Linux",
      "PostgreSQL",
      "Docker",
      "ArgoCD",
      "AWS",
      "CMake",
      "Jenkins",
      "Helm",
    ],
  },
];
