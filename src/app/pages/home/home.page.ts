import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  readonly features = [
    {
      title: 'Умная подборка',
      description:
        'AI и правила подбора подберут программы под ваши критерии и покажут прозрачное сравнение.',
      variant: 'primary' as const,
      icon: 'sparkles' as const,
    },
    {
      title: 'Только актуальные банки',
      description:
        'Актуальные ставки и условия от ведущих банков Казахстана — данные обновляются регулярно.',
      variant: 'secondary' as const,
      icon: 'shield' as const,
    },
    {
      title: 'Бесплатная помощь',
      description:
        'Консультации и подсказки по шагам без навязанных продуктов — с заботой о вашем решении.',
      variant: 'accent' as const,
      icon: 'heart' as const,
    },
  ] as const;

  readonly steps = [
    {
      num: '01',
      title: 'Укажите параметры',
      description: 'Цена жилья, взнос, доход',
    },
    {
      num: '02',
      title: 'Получите подборку',
      description: 'AI подберёт Top-3 программы',
    },
    {
      num: '03',
      title: 'Выберите банк',
      description: 'Сравните условия и ставки',
    },
    {
      num: '04',
      title: 'Оформите заявку',
      description: 'Онлайн-заявка в выбранный банк',
    },
  ] as const;

  readonly stats = [
    { value: '25+', label: 'Банков-партнёров' },
    { value: '150+', label: 'Ипотечных программ' },
    { value: '10K+', label: 'Счастливых клиентов' },
    { value: '24/7', label: 'Поддержка' },
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
