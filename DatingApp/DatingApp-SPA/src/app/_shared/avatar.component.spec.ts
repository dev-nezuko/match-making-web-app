import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  function render(url: string | null, name: string) {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('url', url);
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the photo with the member’s name as alt text', () => {
    const img = (render('/avatars/lola.svg', 'Lola').nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('src')).toBe('/avatars/lola.svg');
    expect(img?.getAttribute('alt')).toBe('Lola');
  });

  it('falls back to initials without a photo', () => {
    const el: HTMLElement = render(null, 'Mary Jane').nativeElement;
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent?.trim()).toBe('MJ');
    expect(el.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('Mary Jane');
  });

  it('falls back to initials when the photo fails to load', async () => {
    const fixture = render('/missing.jpg', 'Roy');
    (fixture.nativeElement as HTMLElement).querySelector('img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('R');
  });
});
