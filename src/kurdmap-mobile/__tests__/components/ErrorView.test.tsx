import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { ErrorView } from '@/components/ErrorView';
import { renderWithProviders } from '../test-utils';
import i18n from '@/i18n';

describe('ErrorView', () => {
  beforeAll(() => {
    i18n.changeLanguage('en');
  });

  it('renders error title', () => {
    const { getByText } = renderWithProviders(<ErrorView />);
    expect(getByText('An error occurred')).toBeTruthy();
  });

  it('renders custom error message', () => {
    const { getByText } = renderWithProviders(
      <ErrorView message="Something went wrong" />,
    );
    expect(getByText('Something went wrong')).toBeTruthy();
  });

  it('renders retry button when callback provided', () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithProviders(<ErrorView onRetry={onRetry} />);

    const retryButton = getByText('Retry');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button without callback', () => {
    const { queryByText } = renderWithProviders(<ErrorView />);
    expect(queryByText('Retry')).toBeNull();
  });
});
