import { editDistance } from './edit-distance';

describe('editDistance', () => {
  it('is zero for equal texts', () => {
    expect(editDistance('banana', 'banana')).toBe(0);
  });

  it('counts one wrong, missing, extra or swapped letter as one', () => {
    expect(editDistance('banana', 'banena')).toBe(1);
    expect(editDistance('bahia', 'baia')).toBe(1);
    expect(editDistance('yokitos', 'yokito')).toBe(1);
    expect(editDistance('cabelo', 'cableo')).toBe(1);
  });

  it('stops counting past the limit', () => {
    expect(editDistance('pera', 'uva')).toBe(2);
    expect(editDistance('elefante', 'girafa', 1)).toBe(2);
    expect(editDistance('abcd', 'dcba', 3)).toBe(3);
  });
});
