/**
 * Analytics event tracking abstraction.
 * Currently logs to console in dev. Replace with a real provider
 * (Firebase Analytics, Mixpanel, Amplitude, etc.) when ready.
 */

type EventParams = Record<string, string | number | boolean>;

function track(event: string, params?: EventParams): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[Analytics] ${event}`, params ?? '');
  }
  // TODO: Wire to real analytics provider
  // e.g. analytics().logEvent(event, params);
}

export const Analytics = {
  /** User searched for businesses */
  search(query: string, resultsCount: number): void {
    track('search', { query, resultsCount });
  },

  /** User viewed a business detail page */
  viewBusiness(slug: string, name: string): void {
    track('view_business', { slug, name });
  },

  /** User toggled a favorite */
  toggleFavorite(businessId: string, isFavorite: boolean): void {
    track('toggle_favorite', { businessId, isFavorite });
  },

  /** User submitted a review */
  submitReview(businessId: string, rating: number): void {
    track('submit_review', { businessId, rating });
  },

  /** User changed language */
  changeLanguage(language: string): void {
    track('change_language', { language });
  },

  /** User changed theme */
  changeTheme(theme: string): void {
    track('change_theme', { theme });
  },

  /** Screen view */
  screenView(screenName: string): void {
    track('screen_view', { screenName });
  },
};
