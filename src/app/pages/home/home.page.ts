import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  readonly features = [
    {
      titleKey: 'home.feat1Title',
      descriptionKey: 'home.feat1Desc',
      variant: 'primary' as const,
      icon: 'sparkles' as const,
    },
    {
      titleKey: 'home.feat2Title',
      descriptionKey: 'home.feat2Desc',
      variant: 'secondary' as const,
      icon: 'shield' as const,
    },
    {
      titleKey: 'home.feat3Title',
      descriptionKey: 'home.feat3Desc',
      variant: 'accent' as const,
      icon: 'heart' as const,
    },
  ] as const;

  readonly steps = [
    {
      num: '01',
      titleKey: 'home.step1Title',
      descriptionKey: 'home.step1Desc',
    },
    {
      num: '02',
      titleKey: 'home.step2Title',
      descriptionKey: 'home.step2Desc',
    },
    {
      num: '03',
      titleKey: 'home.step3Title',
      descriptionKey: 'home.step3Desc',
    },
    {
      num: '04',
      titleKey: 'home.step4Title',
      descriptionKey: 'home.step4Desc',
    },
  ] as const;

  readonly stats = [
    { value: '10+', labelKey: 'home.stat1Label' },
    { value: '32+', labelKey: 'home.stat2Label' },
    { value: '10K+', labelKey: 'home.stat3Label' },
    { value: '24/7', labelKey: 'home.stat4Label' },
  ] as const;

  ngAfterViewInit(): void {
    const root = this.host.nativeElement;
    const nodes = root.querySelectorAll('.js-reveal');
    if (!nodes.length) return;

    if (typeof IntersectionObserver === 'undefined') {
      for (const el of Array.from(nodes) as Element[]) {
        el.classList.add('js-reveal--in');
      }
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('js-reveal--in');
            this.observer?.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    );
    for (const el of Array.from(nodes) as Element[]) {
      this.observer.observe(el);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}
