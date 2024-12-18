export function capitalize(str: string): string {
  if (!str) return str;
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatPDFTitle(filename: string): string {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.pdf$/i, '');
  
  // Replace dashes and underscores with spaces
  const nameWithSpaces = nameWithoutExt.replace(/[-_]/g, ' ');
  
  // Capitalize each word
  return capitalize(nameWithSpaces);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
