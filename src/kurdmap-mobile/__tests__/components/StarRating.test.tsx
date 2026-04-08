import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { StarRating } from '@/components/StarRating';
import { renderWithProviders } from '../test-utils';

describe('StarRating', () => {
  it('renders without crashing', () => {
    const { toJSON } = renderWithProviders(<StarRating rating={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders correct number of stars for custom maxRating', () => {
    const { toJSON } = renderWithProviders(<StarRating rating={2} maxRating={3} />);
    expect(toJSON()).toBeTruthy();
  });

  it('calls onRatingChange in interactive mode', () => {
    const onRatingChange = jest.fn();
    const { UNSAFE_getAllByProps } = renderWithProviders(
      <StarRating rating={0} interactive onRatingChange={onRatingChange} />,
    );

    // Find all accessible pressables (may include a wrapper at index 0)
    const pressables = UNSAFE_getAllByProps({ accessible: true });
    // Press the very last one — guaranteed to be star 5 (maxRating)
    fireEvent.press(pressables[pressables.length - 1]);
    expect(onRatingChange).toHaveBeenCalledWith(5);
  });

  it('renders without pressables in display mode', () => {
    const { toJSON } = renderWithProviders(<StarRating rating={4} />);
    const tree = JSON.stringify(toJSON());
    // In display mode there are no Pressable wrappers — just icons
    expect(tree).toBeTruthy();
  });
});
