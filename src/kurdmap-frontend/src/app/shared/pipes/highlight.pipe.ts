import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  constructor(private readonly domSanitizer: DomSanitizer) {}

  transform(text: string | null | undefined, search: string | null | undefined): SafeHtml {
    if (!text || !search || search.trim().length === 0) {
      return text ?? '';
    }

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const highlighted = text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-700/50 text-inherit rounded-sm px-0.5">$1</mark>');

    return this.domSanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
