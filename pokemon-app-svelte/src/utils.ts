export function toTitleCase(string:string, splitChar:string):string {
  return string
    .toLowerCase()
    .split(splitChar)
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ')
}
