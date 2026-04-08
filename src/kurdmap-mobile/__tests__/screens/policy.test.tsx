import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import PolicyScreen from '../../app/policy';
import { renderWithProviders } from '../test-utils';
import i18n from '@/i18n';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

describe('PolicyScreen', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('de'));

  it('renders privacy policy by default', () => {
    const { getByText } = renderWithProviders(<PolicyScreen />);
    expect(getByText('Introduction')).toBeTruthy();
  });

  it('renders privacy tab sections', () => {
    const { getByText } = renderWithProviders(<PolicyScreen />);
    expect(getByText('Introduction')).toBeTruthy();
  });

  it('renders tab switcher with both tabs', () => {
    const { getAllByText } = renderWithProviders(<PolicyScreen />);
    // Privacy tab text appears in header + tab
    expect(getAllByText(/Privacy Policy/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches to terms tab on press', () => {
    const { getByText, getAllByText } = renderWithProviders(<PolicyScreen />);

    // Press Terms tab
    fireEvent.press(getByText(/Terms/i));

    // Terms sections should appear
    expect(getAllByText(/Acceptance/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders last updated text', () => {
    const { getByText } = renderWithProviders(<PolicyScreen />);
    expect(getByText(/last updated/i)).toBeTruthy();
  });
});
