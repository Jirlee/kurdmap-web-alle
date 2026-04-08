import { ChangeDetectionStrategy, Component, computed, input, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'admin-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="w-full">
      @if (label()) {
        <label [for]="inputId()" class="mb-1 block text-sm font-medium text-text">
          {{ label() }}
          @if (required()) {
            <span class="text-danger-500" aria-hidden="true">*</span>
          }
        </label>
      }
      <div class="relative">
        @if (icon()) {
          <span class="material-icons absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg" aria-hidden="true">
            {{ icon() }}
          </span>
        }
        @if (type() === 'textarea') {
          <textarea
            [id]="inputId()"
            [rows]="rows()"
            [placeholder]="placeholder()"
            [disabled]="isDisabled()"
            [value]="value()"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="error() ? true : null"
            [attr.aria-describedby]="error() ? inputId() + '-error' : null"
            (input)="onInput($event)"
            (blur)="onTouched()"
            class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-secondary/60 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:opacity-50 transition-all duration-200"
            [class.ps-10]="icon()"
          ></textarea>
        } @else {
          <input
            [id]="inputId()"
            [type]="resolvedType()"
            [placeholder]="placeholder()"
            [disabled]="isDisabled()"
            [value]="value()"
            [attr.aria-required]="required() || null"
            [attr.aria-invalid]="error() ? true : null"
            [attr.aria-describedby]="error() ? inputId() + '-error' : null"
            (input)="onInput($event)"
            (blur)="onTouched()"
            class="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-text placeholder:text-text-secondary/60 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:opacity-50 transition-all duration-200"
            [class.ps-10]="icon()"
            [class.pe-10]="type() === 'password'"
          />
          @if (type() === 'password') {
            <button
              type="button"
              (click)="togglePassword()"
              [attr.aria-label]="showPassword() ? 'شاردنەوەی وشەی نهێنی' : 'پیشاندانی وشەی نهێنی'"
              class="material-icons absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary text-lg cursor-pointer hover:text-text"
            >
              {{ showPassword() ? 'visibility_off' : 'visibility' }}
            </button>
          }
        }
      </div>
      @if (error()) {
        <p [id]="inputId() + '-error'" role="alert" class="mt-1 text-sm text-danger-500">{{ error() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<'text' | 'email' | 'password' | 'number' | 'url' | 'tel' | 'textarea'>('text');
  readonly icon = input('');
  readonly required = input(false);
  readonly error = input('');
  readonly inputId = input(`input-${crypto.randomUUID().slice(0, 8)}`);
  readonly rows = input(3);

  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly resolvedType = computed(() =>
    this.type() === 'password' && this.showPassword() ? 'text' : this.type(),
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onTouched: () => void = () => {};

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  protected onInput(event: Event): void {
    const val = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.value.set(val);
    this.onChange(val);
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
