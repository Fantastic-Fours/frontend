import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-placeholder',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './profile-placeholder.page.html',
  styleUrl: './profile-placeholder.page.scss',
})
export class ProfilePlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly titleKey = this.route.snapshot.data['titleKey'] as string;
}
