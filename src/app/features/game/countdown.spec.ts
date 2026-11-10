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

  it('keeps the time left while paused', () => {
    const countdown = new Countdown();
    const onExpire = vi.fn();

    countdown.start(10, onExpire);
    vi.advanceTimersByTime(4000);
    countdown.pause();
    vi.advanceTimersByTime(30_000);

    expect(countdown.seconds()).toBe(6);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('counts the time up to the moment it is paused', () => {
    const countdown = new Countdown();

    countdown.start(10, () => {});
    // Half a tick after the last update of the display.
    vi.advanceTimersByTime(1050);
    countdown.pause();

    expect(countdown.progress()).toBeCloseTo(0.895);
  });

  it('goes on from where it was paused', () => {
    const countdown = new Countdown();
    const onExpire = vi.fn();

    countdown.start(10, onExpire);
    vi.advanceTimersByTime(4000);
    countdown.pause();
    vi.advanceTimersByTime(30_000);
    countdown.resume();
    vi.advanceTimersByTime(5000);

    expect(countdown.seconds()).toBe(1);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(onExpire).toHaveBeenCalledOnce();
  });

  it('does not resume after being stopped', () => {
    const countdown = new Countdown();
    const onExpire = vi.fn();

    countdown.start(1, onExpire);
    countdown.pause();
    countdown.stop();
    countdown.resume();
    vi.advanceTimersByTime(5000);

    expect(onExpire).not.toHaveBeenCalled();
  });

  it('is expired only once it ran all the way down', () => {
    const countdown = new Countdown();
    expect(countdown.expired()).toBe(false);

    countdown.start(2, () => {});
    vi.advanceTimersByTime(1000);
    expect(countdown.expired()).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(countdown.expired()).toBe(true);

    countdown.start(2, () => {});
    expect(countdown.expired()).toBe(false);
    countdown.stop();
  });

  it('is expired when paused at the very end, without calling back', () => {
    const countdown = new Countdown();
    const onExpire = vi.fn();

    countdown.start(1, onExpire);
    vi.advanceTimersByTime(950);
    // The clock runs out between two ticks, right when it is paused.
    vi.setSystemTime(Date.now() + 80);
    countdown.pause();
    countdown.resume();
    vi.advanceTimersByTime(5000);

    expect(countdown.expired()).toBe(true);
    expect(onExpire).not.toHaveBeenCalled();
  });
});
