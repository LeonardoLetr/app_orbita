import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Category } from '../../core/models/category';
import { AnswerResult } from '../../core/services/scoring-service';
import { DEAL_MS, QuestionCard, cardBack } from './question-card';

describe('cardBack', () => {
  it('shows the level, the points and the distance', () => {
    const back = cardBack(
      { input: 'Orca', outcome: 'scored', points: 50, match: { text: 'Orca', rarity: 'comet' } },
      '1,1 milhão de km',
    );

    expect(back).toEqual({
      title: 'Cometa',
      points: 50,
      tone: 'bg-comet',
      stars: 8,
      km: '1,1 milhão de km',
      note: undefined,
    });
  });

  it('says why nothing was scored', () => {
    expect(cardBack({ input: '', outcome: 'blank', points: 0 }).title).toBe('Pulou');
    expect(cardBack({ input: 'x', outcome: 'timeout', points: 0 }).title).toBe('Tempo esgotado');
    expect(cardBack({ input: 'x', outcome: 'unknown', points: 0 }).title).toBe('Fora da lista');
  });

  it('says the time ran out when the round ended with nothing scored', () => {
    const typed = cardBack({ input: 'x', outcome: 'unknown', points: 0 }, undefined, true);

    expect(typed.title).toBe('Tempo esgotado');
    expect(typed.points).toBe(0);
  });

  it('still shows the level of an answer that scored as the round ended', () => {
    const back = cardBack(
      { input: 'Orca', outcome: 'scored', points: 50, match: { text: 'Orca', rarity: 'comet' } },
      '1,1 milhão de km',
      true,
    );

    expect(back.title).toBe('Cometa');
    expect(back.points).toBe(50);
  });
});

describe('QuestionCard', () => {
  let fixture: ComponentFixture<QuestionCard>;
  const sea: Category = { id: 'sea', title: 'Animal que vive no mar', answers: [] };
  const fruit: Category = { id: 'fruit', title: 'Fruta', answers: [] };
  const orca: AnswerResult = {
    input: 'Orka',
    outcome: 'scored',
    points: 50,
    corrected: true,
    match: { text: 'Orca', rarity: 'comet' },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(QuestionCard);
    show(sea, 1);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  function show(category: Category, number: number, result?: AnswerResult) {
    fixture.componentRef.setInput('category', category);
    fixture.componentRef.setInput('number', number);
    fixture.componentRef.setInput('next', { name: 'Lua', missing: 40 });
    fixture.componentRef.setInput('result', result);
    fixture.componentRef.setInput('km', result ? '1,1 milhão de km' : undefined);
    fixture.detectChanges();
  }

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the category and the next goal', () => {
    expect(element().querySelector('h1#category-title')?.textContent).toContain(
      'Animal que vive no mar',
    );
    expect(element().textContent).toContain('Categoria 1');
    expect(element().querySelector('.front-hint')?.textContent).toMatch(
      /Próximo:\s*Lua\s*· faltam 40 pts/,
    );
    expect(element().querySelector('.card')?.getAttribute('data-showing')).toBe('question');
  });

  it('turns over to show how the answer scored', () => {
    show(sea, 1, orca);

    const card = element().querySelector('.card')!;
    expect(card.classList).toContain('is-flipped');
    expect(card.getAttribute('data-showing')).toBe('result');
    const back = card.querySelector('.back-face')!;
    expect(back.classList).toContain('bg-comet');
    expect(back.textContent).toContain('Cometa');
    expect(back.textContent).toMatch(/\+50\s*pts/);
    expect(back.textContent).toContain('+1,1 milhão de km');
    expect(back.textContent).toContain('Valeu como “Orca”');
  });

  it('deals the next category while the previous card flies away', () => {
    show(sea, 1, orca);
    const first = element().querySelector('.card');

    show(fruit, 2);

    const card = element().querySelector('.card')!;
    expect(card).not.toBe(first);
    expect(card.getAttribute('data-showing')).toBe('question');
    expect(element().querySelector('h1')?.textContent).toContain('Fruta');
    expect(element().querySelectorAll('h1')).toHaveLength(1);
    expect(element().querySelector('.leaving')?.textContent).toContain('Cometa');

    vi.advanceTimersByTime(DEAL_MS);
    fixture.detectChanges();
    expect(element().querySelector('.leaving')).toBeNull();
  });

  it('shows the end of the route when there is no next destination', () => {
    fixture.componentRef.setInput('next', undefined);
    fixture.detectChanges();

    expect(element().querySelector('.front-hint')?.textContent).toContain('fim da rota');
  });
});
