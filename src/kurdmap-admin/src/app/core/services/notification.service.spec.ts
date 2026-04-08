import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(NotificationService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with no messages', () => {
    expect(service.messages()).toEqual([]);
  });

  it('should add success message', () => {
    service.success('Operation completed');
    const msgs = service.messages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0].text).toBe('Operation completed');
    expect(msgs[0].type).toBe('success');
  });

  it('should add error message', () => {
    service.error('Something failed');
    expect(service.messages()[0].type).toBe('error');
  });

  it('should add warning message', () => {
    service.warning('Be careful');
    expect(service.messages()[0].type).toBe('warning');
  });

  it('should add info message', () => {
    service.info('FYI');
    expect(service.messages()[0].type).toBe('info');
  });

  it('should assign unique IDs', () => {
    service.success('First');
    service.error('Second');
    const msgs = service.messages();
    expect(msgs[0].id).not.toBe(msgs[1].id);
  });

  it('should dismiss a message by ID', () => {
    service.success('First');
    service.error('Second');
    const firstId = service.messages()[0].id;

    service.dismiss(firstId);
    expect(service.messages()).toHaveLength(1);
    expect(service.messages()[0].text).toBe('Second');
  });

  it('should auto-dismiss after 5 seconds', () => {
    service.success('Will disappear');
    expect(service.messages()).toHaveLength(1);

    vi.advanceTimersByTime(5000);
    expect(service.messages()).toHaveLength(0);
  });

  it('should handle multiple messages', () => {
    service.success('One');
    service.error('Two');
    service.warning('Three');
    expect(service.messages()).toHaveLength(3);
  });
});
