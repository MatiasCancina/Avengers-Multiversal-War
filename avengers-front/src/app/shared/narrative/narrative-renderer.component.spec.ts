import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NarrativeRendererComponent } from './narrative-renderer.component';

describe('NarrativeRendererComponent', () => {
  let fixture: ComponentFixture<NarrativeRendererComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NarrativeRendererComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NarrativeRendererComponent);
  });

  it('keeps narration and dialogue speaker semantics visible', () => {
    fixture.componentInstance.lines = [
      { type: 'NARRATION', speakerId: null, text: 'The arena opens.' },
      { type: 'DIALOGUE', speakerId: 'spider-man', text: 'We are ready.' },
    ];
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The arena opens.');
    expect(fixture.nativeElement.textContent).toContain('spider-man');
    expect(fixture.nativeElement.querySelectorAll('.narrative p').length).toBe(2);
  });
});
