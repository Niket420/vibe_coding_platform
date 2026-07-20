export interface Template {
  id: string;
  name: string;
  description: string;
  category: "Frontend" | "Backend";
  icon: string;
}

export const templates: Template[] = [
  {
    id: "react",
    name: "React",
    description: "Vite + React",
    category: "Frontend",
    icon: "⚛️",
  },
  {
    id: "next",
    name: "Next.js",
    description: "App Router",
    category: "Frontend",
    icon: "▲",
  },
  {
    id: "vue",
    name: "Vue",
    description: "Vue 3",
    category: "Frontend",
    icon: "🟢",
  },
  {
    id: "angular",
    name: "Angular",
    description: "Angular CLI",
    category: "Frontend",
    icon: "🅰️",
  },
  {
    id: "express",
    name: "Express",
    description: "Express Server",
    category: "Backend",
    icon: "🚀",
  },
  {
    id: "hono",
    name: "Hono",
    description: "Ultra Fast API",
    category: "Backend",
    icon: "🔥",
  },
];