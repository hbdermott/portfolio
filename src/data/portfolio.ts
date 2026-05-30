export interface Project {
  name: string;
  description: string;
  technologies: string[];
  detail: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  dates: string;
  bullets: string[];
}

export const aboutContent = [
  'Name: Hunter Dermott',
  'Current Role: .NET Software Engineer',
  'Location: Irvine CA',
  '',
  'I like building things! Tinkerer at heart.',
  'Always enjoy collaborating and working with others.',
  '',
  'Hobbies: guitar, board games, retro video games,',
  'and building cool things.',
];

export const projects: Project[] = [
  {
    name: 'CRT Terminal Portfolio',
    description: 'Interactive portfolio site inside a simulated CRT monitor',
    technologies: ['TypeScript', 'Three.js', 'WebGL', 'Vite', 'Fun :)'],
    detail: 'A functional terminal portfolio taking place on a retro CRT monitor. Cool shaders, effects, and ideas!',
  },
  {
    name: 'Tale.ink',
    description: 'A new way for authors to publish their work in a social environment',
    technologies: ['JavaScript', 'React', 'Next.js', 'Firebase', 'Chakra'],
    detail: 'A modern publishing platform enabling authors to share works, gather feedback, and iterate more quickly.',
  }
];

export const experience: ExperienceEntry[] = [
  {
    company: 'Convergence .NET',
    role: 'Software Engineer',
    dates: '2022 - Present',
    bullets: [
      'Worked in a fast-paced, collaborative team building and maintaining enterprise solutions for ',
      'ticketing sales, and operations across attractions, zoos, aquariums, and corporate experiences.',
      'Developed scalable web apps, APIs, and backends using the Microsoft tech stack, delivering',
      'reliable high-performance systems for many large clients.',
    ],
  },
  {
    company: 'GDM Electronic & Medical, LLC',
    role: 'Radio/GPS Technician',
    dates: 'Summer 2019',
    bullets: [
      'Programmed, setup, and assembled Radio & GPS devices used by the National Guard.',
      'Utilized scripting and fixed bugs to streamline processes'
    ],
  },
  {
    company: 'UCLA',
    role: 'B.S. in Computer Science',
    dates: '2017 - 2021',
    bullets: [
    ],
  },
];

export const skills = {
  Languages: ['C#', 'C++', 'C', 'TS', 'JS', 'Python'],
  Frontend: ['Blazor', 'Razor', 'React', 'Next.js', 'HTML', 'CSS'],
  Backend: ['ASP.NET Core', '.NET Framework', 'Node', 'REST APIs'],
  Databases: ['SQL Server', 'PostgreSQL'],
  'Cloud & DevOps': ['Azure', 'GCP', 'Github', 'Linux'],
};

export const contactInfo = {
  email: 'hbdermott@gmail.com',
  github: 'https://github.com/hbdermott',
  linkedin: 'https://www.linkedin.com/in/hunter-dermott-67a134184',
};
