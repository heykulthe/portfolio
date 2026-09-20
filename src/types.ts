export type Site = {
  NAME: string;
  EMAIL: string;
  LOCATION: string;
  ROLE: string;
  COMPANY: string;
  NUM_WORKS_ON_HOMEPAGE: number;
  NUM_PROJECTS_ON_HOMEPAGE: number;
};

export type Metadata = {
  TITLE: string;
  DESCRIPTION: string;
};

export type Socials = {
  NAME: string;
  HREF: string;
}[];

export type Honour = {
  TITLE: string;
  DETAIL: string;
  HREF?: string;
};

export type SkillGroup = {
  LABEL: string;
  ITEMS: string[];
};

export type Education = {
  SCHOOL: string;
  DEGREE: string;
  DETAIL: string;
  LOCATION: string;
  YEARS: string;
};
