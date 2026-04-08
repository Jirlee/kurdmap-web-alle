import React from 'react';
import { EmptyState } from '@/components/EmptyState';
import { renderWithProviders } from '../test-utils';

describe('EmptyState', () => {
  it('renders title text', () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No results found" />,
    );
    expect(getByText('No results found')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = renderWithProviders(
      <EmptyState title="No results" subtitle="Try a different search" />,
    );
    expect(getByText('Try a different search')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = renderWithProviders(
      <EmptyState title="No results" />,
    );
    // Only title should be present, no subtitle
    expect(queryByText('Try a different search')).toBeNull();
  });

  it('renders with custom icon', () => {
    const { toJSON } = renderWithProviders(
      <EmptyState title="No favorites" icon="heart-outline" />,
    );
    expect(toJSON()).toBeTruthy();
  });
});
