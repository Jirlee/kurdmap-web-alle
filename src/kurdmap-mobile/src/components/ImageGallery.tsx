import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessImage } from '@/types/api';

interface Props {
  images: BusinessImage[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function ImageGallery({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const renderItem = useCallback(
    ({ item, index }: { item: BusinessImage; index: number }) => (
      <Pressable onPress={() => setSelectedIndex(index)}>
        <Image
          source={{ uri: item.url }}
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      </Pressable>
    ),
    [],
  );

  const keyExtractor = useCallback((item: BusinessImage) => item.id, []);

  if (images.length === 0) return null;

  return (
    <View>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        snapToInterval={SCREEN_WIDTH * 0.7 + 10}
        decelerationRate="fast"
      />

      <Modal
        visible={selectedIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedIndex(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable style={styles.closeBtn} onPress={() => setSelectedIndex(null)}>
            <Ionicons name="close" size={28} color="#FFF" />
          </Pressable>
          {selectedIndex !== null && (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={styles.fullImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  thumbnail: {
    width: SCREEN_WIDTH * 0.7,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
