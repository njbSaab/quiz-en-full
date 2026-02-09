// src/app/pipes/bg-url.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';

@Pipe({ name: 'bgUrl' })
export class BgUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeStyle {
    if (!url) return '';
    return this.sanitizer.bypassSecurityTrustStyle(`url(${url})`);
  }
}