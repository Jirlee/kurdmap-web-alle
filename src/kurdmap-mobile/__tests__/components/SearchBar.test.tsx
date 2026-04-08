import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { SearchBar } from '@/components/SearchBar';
import { renderWithProviders } from '../test-utils';
import i18n from '@/i18n';

describe('SearchBar', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('de'));

  it('renders with placeholder text', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} />,
    );
    // Uses t('searchPlaceholder') — check for any placeholder  
    const input = getByPlaceholderText(/.+/);
    expect(input).toBeTruthy();
  });

  it('renders with custom placeholder', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} placeholder="Find businesses..." />,
    );
    expect(getByPlaceholderText('Find businesses...')).toBeTruthy();
  });

  it('calls onChangeText when text is entered', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <SearchBar value="" onChangeText={onChangeText} placeholder="Search" />,
    );

    fireEvent.changeText(getByPlaceholderText('Search'), 'restaurant');
    expect(onChangeText).toHaveBeenCalledWith('restaurant');
  });

  it('calls onSubmit when return key is pressed', () => {
    const onSubmit = jest.fn();
    const { getByPlaceholderText } = renderWithProviders(
      <SearchBar value="test" onChangeText={jest.fn()} onSubmit={onSubmit} placeholder="Search" />,
    );

    fireEvent(getByPlaceholderText('Search'), 'submitEditing');
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows clear button when value is not empty', () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="some text" onChangeText={onChangeText} />,
    );

    // Clear button has t('cancel') as accessibility label
    const clearBtn = getByLabelText(/cancel/i);
    fireEvent.press(clearBtn);
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('does not show clear button when value is empty', () => {
    const { queryByLabelText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} />,
    );
    expect(queryByLabelText(/cancel/i)).toBeNull();
  });

  it('shows filter button when onFilterPress is provided', () => {
    const onFilterPress = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <SearchBar value="" onChangeText={jest.fn()} onFilterPress={onFilterPress} />,
    );

    const filterBtn = getByLabelText(/filter/i);
    fireEvent.press(filterBtn);
    expect(onFilterPress).toHaveBeenCalled();
  });
});
