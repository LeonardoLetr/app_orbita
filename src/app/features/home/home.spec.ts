import { TestBed } from '@angular/core/testing';
import { CategoryRepository } from '../../core/data/category-repository';
import { Category } from '../../core/models/category';
import { Home } from './home';

describe('Home', () => {
  function render(getAll: () => Promise<Category[]>) {
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [{ provide: CategoryRepository, useValue: { getAll } }],
    });
    return TestBed.createComponent(Home);
  }

  it('shows the game title', () => {
    const fixture = render(() => Promise.resolve([]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Órbita');
  });

  it('shows how many categories were loaded', async () => {
    const categories: Category[] = [
      { id: 'fruit', title: 'Fruta', answers: [] },
      { id: 'color', title: 'Cor', answers: [] },
    ];
    const fixture = render(() => Promise.resolve(categories));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('2 categorias prontas');
  });

  it('shows an error when categories fail to load', async () => {
    const fixture = render(() => Promise.reject(new Error('offline')));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar');
  });
});
