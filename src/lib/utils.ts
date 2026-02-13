import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getEntryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    IDEA: "#8B5CF6",
    REMINDER: "#F59E0B",
    TRIP: "#10B981",
    TASK: "#3B82F6",
    NOTE: "#6B7280",
    BOOKMARK: "#EC4899",
    JOURNAL: "#F97316",
  };
  return colors[type] ?? "#6B7280";
}

export function getEntryTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    IDEA: "Lightbulb",
    REMINDER: "Bell",
    TRIP: "Plane",
    TASK: "CheckSquare",
    NOTE: "FileText",
    BOOKMARK: "Bookmark",
    JOURNAL: "BookOpen",
  };
  return icons[type] ?? "FileText";
}
