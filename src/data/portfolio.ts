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
  'Role: Software Engineer',
  'Location: [Your Location]',
  '',
  'I build things with code. Passionate about creating interactive',
  'experiences and solving complex problems with elegant solutions.',
  '',
  'Interests: systems programming, graphics, retro computing,',
  'open source, and building cool things on the web.',
];

export const projects: Project[] = [
  {
    name: 'CRT Terminal Portfolio',
    description: 'Interactive portfolio site inside a simulated CRT monitor',
    technologies: ['TypeScript', 'Three.js', 'WebGL', 'Vite'],
    detail: 'A fully functional terminal portfolio with CRT shader effects, ASCII art background rendered with Three.js, and a lightweight Linux command emulator. Features real-time scanlines, barrel distortion, chromatic aberration, and phosphor glow.',
  },
  {
    name: 'Project Alpha',
    description: 'A cool project that solves real problems',
    technologies: ['TypeScript', 'Node.js', 'PostgreSQL'],
    detail: 'Detailed description of Project Alpha including challenges faced and solutions implemented. This project demonstrates backend architecture and database design skills.',
  },
  {
    name: 'Project Beta',
    description: 'Another awesome project with great features',
    technologies: ['React', 'Python', 'Docker'],
    detail: 'Detailed description of Project Beta. Showcases full-stack development capabilities and DevOps practices.',
  },
];

export const experience: ExperienceEntry[] = [
  {
    company: 'Company Name',
    role: 'Software Engineer',
    dates: '2023 - Present',
    bullets: [
      'Led development of core platform features serving 100k+ users',
      'Architected scalable backend systems with 99.9% uptime',
      'Mentored junior developers and established engineering best practices',
    ],
  },
  {
    company: 'Previous Company',
    role: 'Junior Developer',
    dates: '2021 - 2023',
    bullets: [
      'Built responsive frontend interfaces used by thousands of customers',
      'Optimized database queries reducing load times by 40%',
      'Contributed to open-source projects and internal tooling',
    ],
  },
];

export const skills = {
  Languages: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust'],
  'Frameworks & Tools': ['Node.js', 'Three.js', 'Docker', 'Git', 'Linux'],
  Other: ['PostgreSQL', 'Redis', 'AWS', 'WebGL', 'GraphQL'],
};

export const contactInfo = {
  email: 'hunter@example.com',
  github: 'github.com/hunterdermott',
  linkedin: 'linkedin.com/in/hunterdermott',
};
