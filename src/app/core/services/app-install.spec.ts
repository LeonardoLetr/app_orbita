import { TestBed } from '@angular/core/testing';
import { AppInstall } from './app-install';

describe('AppInstall', () => {
  function offer() {
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn().mockResolvedValue(undefined),
    });
    window.dispatchEvent(event);
    return event;
  }

  it('has nothing to offer until the browser says the game can be installed', () => {
    const install = TestBed.inject(AppInstall);

    expect(install.canPrompt()).toBe(false);
    expect(install.installed()).toBe(false);
  });

  it('keeps the offer of the browser for its own button', () => {
    const install = TestBed.inject(AppInstall);

    const event = offer();

    expect(event.defaultPrevented).toBe(true);
    expect(install.canPrompt()).toBe(true);
  });

  it('opens the prompt once', async () => {
    const install = TestBed.inject(AppInstall);
    const event = offer();

    await install.install();
    await install.install();

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(install.canPrompt()).toBe(false);
  });

  it('stops offering once the app is installed', () => {
    const install = TestBed.inject(AppInstall);
    offer();

    window.dispatchEvent(new Event('appinstalled'));

    expect(install.installed()).toBe(true);
    expect(install.canPrompt()).toBe(false);
    expect(install.needsManualSteps()).toBe(false);
  });

  it('shows the steps by hand on an iPhone, which has no prompt', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
    );

    expect(TestBed.inject(AppInstall).needsManualSteps()).toBe(true);
    vi.restoreAllMocks();
  });

  it('does not show them on other devices', () => {
    expect(TestBed.inject(AppInstall).needsManualSteps()).toBe(false);
  });
});
