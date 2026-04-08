import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { SearchBar } from '@/components/SearchBar';
import { BusinessCard } from '@/components/BusinessCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { BusinessCardSkeleton } from '@/components/Skeleton';
import { FadeInView } from '@/components/Animations';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocation } from '@/hooks/useLocation';
import { businessesApi } from '@/api/businesses';
import { categoriesApi } from '@/api/categories';
import { citiesApi } from '@/api/cities';
import { getCategoryName, getCityName, formatDistance, haversineDistance } from '@/utils/localization';
import { BusinessSortOption } from '@/types/api';
import type { BusinessSummary, Category, City } from '@/types/api';

const SORT_OPTIONS = [
  { value: BusinessSortOption.Relevance, key: 'sortRelevance' },
  { value: BusinessSortOption.Name, key: 'sortName' },
  { value: BusinessSortOption.Newest, key: 'sortNewest' },
  { value: BusinessSortOption.VerifiedFirst, key: 'sortVerified' },
  { value: BusinessSortOption.NearestFirst, key: 'sortNearest' },
  { value: BusinessSortOption.FeaturedFirst, key: 'sortFeatured' },
] as const;

const PAGE_SIZE = 12;
const RADIUS_OPTIONS = [1, 5, 10, 25, 50] as const;

export default function SearchScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const location = useLocation();
  const params = useLocalSearchParams<{ city?: string }>();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedCity, setSelectedCity] = useState<string | undefined>(params.city);
  const [sortOption, setSortOption] = useState(BusinessSortOption.Relevance);
  const [showFilters, setShowFilters] = useState(false);
  const [nearMeActive, setNearMeActive] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10);

  // Sync city param from deep link / home navigation
  useEffect(() => {
    if (params.city) setSelectedCity(params.city);
  }, [params.city]);

  const debouncedSearch = useDebounce(searchText, 400);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: citiesApi.getAll,
  });

  const searchQuery = useInfiniteQuery({
    queryKey: ['businesses', 'search', debouncedSearch, selectedCategory, selectedCity, sortOption, nearMeActive, radiusKm],
    queryFn: ({ pageParam = 1 }) =>
      businessesApi.search({
        search: debouncedSearch || undefined,
        category: selectedCategory,
        city: selectedCity,
        sort: sortOption,
        page: pageParam,
        pageSize: PAGE_SIZE,
        latitude: (nearMeActive || sortOption === BusinessSortOption.NearestFirst) ? (location.latitude ?? undefined) : undefined,
        longitude: (nearMeActive || sortOption === BusinessSortOption.NearestFirst) ? (location.longitude ?? undefined) : undefined,
        radiusKm: nearMeActive ? radiusKm : undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.pageNumber + 1 : undefined,
    initialPageParam: 1,
  });

  const businesses = useMemo(
    () => searchQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [searchQuery.data],
  );

  const totalCount = searchQuery.data?.pages[0]?.totalCount ?? 0;

  const renderItem = useCallback(
    ({ item }: { item: BusinessSummary }) => {
      const dist =
        location.latitude && location.longitude
          ? formatDistance(haversineDistance(location.latitude, location.longitude, item.latitude, item.longitude))
          : null;
      return <BusinessCard business={item} distance={dist} />;
    },
    [location],
  );

  const loadMore = useCallback(() => {
    if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      searchQuery.fetchNextPage();
    }
  }, [searchQuery]);

  const clearFilters = useCallback(() => {
    setSelectedCategory(undefined);
    setSelectedCity(undefined);
    setSortOption(BusinessSortOption.Relevance);
    setNearMeActive(false);
  }, []);

  const hasActiveFilters = selectedCategory || selectedCity || sortOption !== BusinessSortOption.Relevance || nearMeActive;

  const toggleNearMe = useCallback(() => {
    setNearMeActive((prev) => {
      if (!prev) setSortOption(BusinessSortOption.NearestFirst);
      return !prev;
    });
  }, []);

  // Get category/city names for chips
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory || !categoriesQuery.data) return null;
    const cat = categoriesQuery.data.find((c: Category) => c.id === selectedCategory);
    return cat ? getCategoryName(cat) : null;
  }, [selectedCategory, categoriesQuery.data]);

  const selectedCityName = useMemo(() => {
    if (!selectedCity || !citiesQuery.data) return null;
    const city = citiesQuery.data.find((c: City) => c.id === selectedCity);
    return city ? getCityName(city) : null;
  }, [selectedCity, citiesQuery.data]);

  const activeFilterCount = [selectedCategory, selectedCity, nearMeActive, sortOption !== BusinessSortOption.Relevance].filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          onFilterPress={() => setShowFilters(true)}
          autoFocus
        />
      </View>

      {/* Near Me + Filter Bar */}
      <View style={styles.filterBar}>
        <Pressable
          style={[
            styles.nearMeBtn,
            {
              backgroundColor: nearMeActive ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
          onPress={toggleNearMe}
        >
          <Ionicons
            name="locate"
            size={16}
            color={nearMeActive ? '#FFF' : theme.colors.text}
          />
          <Text style={{ color: nearMeActive ? '#FFF' : theme.colors.text, fontSize: 13, fontWeight: '500' }}>
            {t('nearMe')}
          </Text>
        </Pressable>

        {nearMeActive && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusRow}>
            {RADIUS_OPTIONS.map((r) => (
              <Pressable
                key={r}
                style={[
                  styles.radiusChip,
                  {
                    backgroundColor: radiusKm === r ? theme.colors.primary : theme.colors.surfaceVariant,
                  },
                ]}
                onPress={() => setRadiusKm(r)}
              >
                <Text style={{ color: radiusKm === r ? '#FFF' : theme.colors.text, fontSize: 12, fontWeight: '500' }}>
                  {t('radiusKm', { km: r })}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={styles.chipBarContent}>
          {selectedCategoryName && (
            <Pressable
              style={[styles.filterChip, { backgroundColor: `${theme.colors.primary}20` }]}
              onPress={() => setSelectedCategory(undefined)}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>{selectedCategoryName}</Text>
              <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
          {selectedCityName && (
            <Pressable
              style={[styles.filterChip, { backgroundColor: `${theme.colors.primary}20` }]}
              onPress={() => setSelectedCity(undefined)}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>{selectedCityName}</Text>
              <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
          {nearMeActive && (
            <Pressable
              style={[styles.filterChip, { backgroundColor: `${theme.colors.primary}20` }]}
              onPress={() => setNearMeActive(false)}
            >
              <Ionicons name="locate" size={14} color={theme.colors.primary} />
              <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>
                {t('radiusKm', { km: radiusKm })}
              </Text>
              <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
          {sortOption !== BusinessSortOption.Relevance && (
            <Pressable
              style={[styles.filterChip, { backgroundColor: `${theme.colors.primary}20` }]}
              onPress={() => setSortOption(BusinessSortOption.Relevance)}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.primary }]}>
                {t(SORT_OPTIONS.find((s) => s.value === sortOption)?.key ?? 'sortRelevance')}
              </Text>
              <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
            </Pressable>
          )}
          {activeFilterCount >= 2 && (
            <Pressable
              style={[styles.filterChip, { backgroundColor: `${theme.colors.error}15` }]}
              onPress={clearFilters}
            >
              <Text style={[styles.filterChipText, { color: theme.colors.error }]}>{t('clearAll')}</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Result Count */}
      <View style={styles.metaRow}>
        <Text style={[styles.resultCount, { color: theme.colors.textSecondary }]}>
          {t('searchResults', { count: totalCount })}
        </Text>
      </View>

      {/* Results */}
      {searchQuery.isLoading ? (
        <FadeInView style={styles.listContent}>
          <BusinessCardSkeleton />
          <BusinessCardSkeleton />
          <BusinessCardSkeleton />
        </FadeInView>
      ) : businesses.length === 0 ? (
        <EmptyState title={t('noResults')} icon="search-outline" />
      ) : (
        <FlashList
          data={businesses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={240}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            searchQuery.isFetchingNextPage ? <LoadingSpinner size="small" /> : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('searchFilters')}
            </Text>
            <Pressable onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Category Filter */}
            <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
              {t('categories')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <Pressable
                style={[
                  styles.chip,
                  !selectedCategory && { backgroundColor: theme.colors.primary },
                  selectedCategory && { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onPress={() => setSelectedCategory(undefined)}
              >
                <Text style={{ color: !selectedCategory ? '#FFF' : theme.colors.text, fontSize: 13 }}>
                  {t('allCategories')}
                </Text>
              </Pressable>
              {categoriesQuery.data?.map((cat: Category) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.chip,
                    selectedCategory === cat.id
                      ? { backgroundColor: theme.colors.primary }
                      : { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={{
                      color: selectedCategory === cat.id ? '#FFF' : theme.colors.text,
                      fontSize: 13,
                    }}
                  >
                    {getCategoryName(cat)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* City Filter */}
            <Text style={[styles.filterLabel, { color: theme.colors.text, marginTop: 20 }]}>
              {t('allCities')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              <Pressable
                style={[
                  styles.chip,
                  !selectedCity && { backgroundColor: theme.colors.primary },
                  selectedCity && { backgroundColor: theme.colors.surfaceVariant },
                ]}
                onPress={() => setSelectedCity(undefined)}
              >
                <Text style={{ color: !selectedCity ? '#FFF' : theme.colors.text, fontSize: 13 }}>
                  {t('allCities')}
                </Text>
              </Pressable>
              {citiesQuery.data?.map((city: City) => (
                <Pressable
                  key={city.id}
                  style={[
                    styles.chip,
                    selectedCity === city.id
                      ? { backgroundColor: theme.colors.primary }
                      : { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  onPress={() => setSelectedCity(city.id)}
                >
                  <Text
                    style={{
                      color: selectedCity === city.id ? '#FFF' : theme.colors.text,
                      fontSize: 13,
                    }}
                  >
                    {getCityName(city)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Sort */}
            <Text style={[styles.filterLabel, { color: theme.colors.text, marginTop: 20 }]}>
              {t('searchSort')}
            </Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.sortChip,
                    sortOption === opt.value
                      ? { backgroundColor: theme.colors.primary }
                      : { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                  onPress={() => setSortOption(opt.value)}
                >
                  <Text
                    style={{
                      color: sortOption === opt.value ? '#FFF' : theme.colors.text,
                      fontSize: 13,
                    }}
                  >
                    {t(opt.key)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyBtnText}>{t('confirm')}</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 8 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  nearMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 36,
  },
  radiusRow: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  radiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 6,
    minHeight: 30,
    justifyContent: 'center',
  },
  chipBar: {
    marginTop: 8,
  },
  chipBarContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: { fontSize: 12, fontWeight: '500' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: { fontSize: 13 },
  clearFilters: { fontSize: 13, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  modalContainer: { flex: 1, paddingTop: 16 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  modalBody: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  filterLabel: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  sortOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  applyBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
