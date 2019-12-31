export function traduire(element, etiquette, language) {
   return element[etiquette + '_' + language] || element[etiquette];
}
