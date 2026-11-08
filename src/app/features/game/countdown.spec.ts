import { Countdown } from './countdown';

describe('Countdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('counts down and calls back when time runs out', () => {
    const countdown = new Countdown();
    const onExpire = vi.fn();

    countdown.start(3, onExpire);
    expect(countdown.seconds()).toBe(3);
    expect(countdown.progress()).toBe(1);

    vi.advanceTimersByTime(1500);
    expect(countdown.seconds()).toBe(2);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(countdown.seconds()).toBe(0);
    expect(countdown.progress()).toBe(0);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('does not call back after being stopped', () => {
    const countdown = new Countdown();
    const onExpire = vi.fn();

    countdown.start(1, onExpire);
    countdown.stop();
    vi.advanceTimersByTime(2000);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('restarts from the full time', () => {
    const countdown = new Countdown();

    countdown.start(5, () => {});
    vi.advanceTimersByTime(3000);
    countdown.start(5, () => {});

    expect(countdown.seconds()).toBe(5);
    countdown.stop();
  });
});
