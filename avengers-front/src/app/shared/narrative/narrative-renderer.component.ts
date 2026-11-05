import { Component, Input } from '@angular/core';

export type NarrativeLineType = 'NARRATION' | 'DIALOGUE';

export interface NarrativeLine {
  type: NarrativeLineType;
  speakerId: string | null;
  text: string;
}

@Component({
  selector: 'app-narrative-renderer',
  templateUrl: './narrative-renderer.component.html',
  styleUrls: ['./narrative-renderer.component.css'],
  standalone: false,
})
export class NarrativeRendererComponent {
  @Input() lines: NarrativeLine[] | null = [];

  @Input() ariaLabel = 'Narrative';
}
