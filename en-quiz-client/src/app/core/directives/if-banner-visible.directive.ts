// shared/directives/if-banner-visible.directive.ts
import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { BannerService } from '../../core/services/banner.service';

@Directive({
  selector: '[appIfBannerVisible]'
})
export class IfBannerVisibleDirective implements OnInit {

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private bannerService: BannerService
  ) {}

  ngOnInit(): void {
    this.bannerService.visible$.subscribe(visible => {
      this.viewContainer.clear();
      if (visible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
