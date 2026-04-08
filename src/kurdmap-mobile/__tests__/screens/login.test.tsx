import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../app/(auth)/login';
import { renderWithProviders } from '../test-utils';
import { useAuthStore } from '@/stores/auth-store';
import i18n from '@/i18n';

// Mock the auth store
jest.mock('@/stores/auth-store');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

describe('LoginScreen', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('de'));

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    } as any);
  });

  it('renders email and password fields', () => {
    const { getAllByText, getByPlaceholderText } = renderWithProviders(<LoginScreen />);
    // "Email" appears as both label and placeholder
    expect(getAllByText('Email').length).toBeGreaterThanOrEqual(1);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders login button', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Login')).toBeTruthy();
  });

  it('renders forgot password link', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Forgot Password?')).toBeTruthy();
  });

  it('renders register link', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Register')).toBeTruthy();
  });

  it('renders app name in header', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('KurdMap')).toBeTruthy();
  });

  it('calls login with email and password on submit', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    } as any);

    const { getByPlaceholderText, getByText } = renderWithProviders(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByText('Login'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('does not call login with empty fields', () => {
    const mockLogin = jest.fn();
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    } as any);

    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Login'));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows error message when error exists', () => {
    mockUseAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: false,
      error: 'Invalid credentials',
      clearError: jest.fn(),
    } as any);

    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('Invalid email or password')).toBeTruthy();
  });

  it('shows loading state when isLoading', () => {
    mockUseAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: true,
      error: null,
      clearError: jest.fn(),
    } as any);

    const { getByText } = renderWithProviders(<LoginScreen />);
    expect(getByText('...')).toBeTruthy();
  });

  it('navigates to register screen', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Register'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/register');
  });

  it('navigates to forgot password', () => {
    const { getByText } = renderWithProviders(<LoginScreen />);
    fireEvent.press(getByText('Forgot Password?'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(auth)/forgot-password');
  });
});
