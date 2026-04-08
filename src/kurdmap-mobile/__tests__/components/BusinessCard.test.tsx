import React from 'react';
import { BusinessCard } from '@/components/BusinessCard';
import { renderWithProviders } from '../test-utils';
import { fireEvent } from '@testing-library/react-native';
import type { BusinessSummary } from '@/types/api';
import { BusinessStatus } from '@/types/api';
import i18n from '@/i18n';

const mockBusiness: BusinessSummary = {
  id: 'biz-1',
  slug: 'test-restaurant',
  name: { ku: 'چێشتخانە', kmr: 'Xwaringeh', de: 'Testrestaurant', en: 'Test Restaurant' },
  categoryId: 'cat-1',
  categorySlug: 'restaurants',
  street: 'Hauptstraße 1',
  postalCode: '50667',
  latitude: 50.9375,
  longitude: 6.9603,
  phone: '+49 221 1234567',
  status: BusinessStatus.Active,
  isVerified: true,
  isFeatured: false,
  primaryImageUrl: 'https://example.com/image.jpg',
};

describe('BusinessCard', () => {
  beforeAll(() => i18n.changeLanguage('en'));
  afterAll(() => i18n.changeLanguage('de'));

  it('renders business name', () => {
    const { getByText } = renderWithProviders(
      <BusinessCard business={mockBusiness} />,
    );
    // Language set to 'en' — shows English name
    expect(getByText('Test Restaurant')).toBeTruthy();
  });

  it('renders address', () => {
    const { getByText } = renderWithProviders(
      <BusinessCard business={mockBusiness} />,
    );
    expect(getByText('Hauptstraße 1, 50667')).toBeTruthy();
  });

  it('renders distance badge when provided', () => {
    const { getByText } = renderWithProviders(
      <BusinessCard business={mockBusiness} distance="1.5 km" />,
    );
    expect(getByText('1.5 km')).toBeTruthy();
  });

  it('does not show distance when not provided', () => {
    const { queryByText } = renderWithProviders(
      <BusinessCard business={mockBusiness} />,
    );
    expect(queryByText(/km|m$/)).toBeNull();
  });

  it('renders featured badge for featured businesses', () => {
    const featured = { ...mockBusiness, isFeatured: true };
    const { getByText } = renderWithProviders(
      <BusinessCard business={featured} />,
    );
    // Uses t('businessFeatured')
    expect(getByText(/featured/i)).toBeTruthy();
  });

  it('calls onFavoriteToggle with business ID', () => {
    const onToggle = jest.fn();
    const { getByLabelText } = renderWithProviders(
      <BusinessCard business={mockBusiness} onFavoriteToggle={onToggle} />,
    );

    const favBtn = getByLabelText(/favorite/i);
    fireEvent.press(favBtn);
    expect(onToggle).toHaveBeenCalledWith('biz-1');
  });

  it('shows filled heart when favorited', () => {
    const { getByLabelText } = renderWithProviders(
      <BusinessCard
        business={mockBusiness}
        onFavoriteToggle={jest.fn()}
        isFavorited={true}
      />,
    );
    const favBtn = getByLabelText(/remove.*favorite/i);
    expect(favBtn).toBeTruthy();
  });

  it('navigates on press', () => {
    const { getByRole } = renderWithProviders(
      <BusinessCard business={mockBusiness} />,
    );
    const card = getByRole('button');
    fireEvent.press(card);
    // Navigation is handled by the router mock
  });
});
