
export function generateShoppingList(instructions: string): string[] {
  // Basic ingredient extraction - this can be enhanced with more sophisticated parsing
  const lines = instructions.split('\n');
  const ingredients: Set<string> = new Set();
  
  lines.forEach(line => {
    // Look for common measurement patterns
    const measurements = /(\d+(?:\.\d+)?)\s*(cup|tablespoon|teaspoon|oz|pound|g|ml|tbsp|tsp|lb|gram|ml|piece|slice)s?\b/i;
    if (measurements.test(line)) {
      ingredients.add(line.trim());
    }
  });

  return Array.from(ingredients);
}

export function downloadShoppingList(items: string[], filename: string = 'shopping-list.txt') {
  const content = items.join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
