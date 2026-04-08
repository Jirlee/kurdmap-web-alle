import React from 'react';
import AboutScreen from '../../app/about';
import { renderWithProviders } from '../test-utils';
import i18n from '@/i18n';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: { Screen: () => null },
}));

describe('AboutScreen', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('de'));

  it('renders about title', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText('About KurdMap')).toBeTruthy();
  });

  it('renders mission section', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText('Our Mission')).toBeTruthy();
  });

  it('renders all feature cards', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText('Multilingual')).toBeTruthy();
    expect(getByText('Interactive Map')).toBeTruthy();
    expect(getByText('Mobile First')).toBeTruthy();
    expect(getByText('Verified Businesses')).toBeTruthy();
  });

  it('renders open source section', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText('Open Source')).toBeTruthy();
  });

  it('renders version info', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);
    expect(getByText(/Version 1\.0\.0/)).toBeTruthy();
  });

  it('navigates back on back button press', () => {
    const { getByLabelText } = renderWithProviders(<AboutScreen />);
    const backBtn = getByLabelText('Back');
    expect(backBtn).toBeTruthy();
  });
});
