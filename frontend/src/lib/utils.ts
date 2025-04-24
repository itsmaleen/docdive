import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to generate IDs for headings
export const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};

export function stringToHTMLCollection(text: string): HTMLCollection {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");
  return doc.body.children;
}
