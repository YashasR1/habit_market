import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { VideoItem, MEDIA_ITEM_SIZE } from './MediaItems';

interface ProjectMediaGalleryProps {
  media: any[];
  onDeleteMedia?: (url: string) => void;
}

export const ProjectMediaGallery = ({ media, onDeleteMedia }: ProjectMediaGalleryProps) => {
  const [loadedIndex, setLoadedIndex] = useState(0);

  // Auto-advance if current item is a video
  React.useEffect(() => {
    if (media.length > 0 && loadedIndex < media.length) {
      if (media[loadedIndex].type !== 'image') {
        handleMediaLoadNext();
      }
    }
  }, [loadedIndex, media]);

  if (media.length === 0) return null;

  const handleMediaLoadNext = () => {
    setLoadedIndex((prev) => prev + 1);
  };

  return (
    <View style={styles.mediaSection}>
      <Text style={styles.mediaSectionTitle}>
        Attachments ({media.length})
      </Text>
      <View style={styles.mediaGrid}>
        {media.map((item: any, idx: number) => (
          <Animated.View
            key={idx}
            style={styles.mediaWrapper}
            entering={FadeIn.delay(idx * 100).duration(400).springify()}
          >
            <TouchableOpacity activeOpacity={0.9}>
              {item.type === "image" ? (
                <View style={styles.mediaItem}>
                  {idx <= loadedIndex ? (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.mediaItemContent}
                      resizeMode="cover"
                      onLoad={idx === loadedIndex ? handleMediaLoadNext : undefined}
                      onError={idx === loadedIndex ? handleMediaLoadNext : undefined}
                    />
                  ) : (
                    <View style={styles.loadingPlaceholder}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.mediaItem}>
                    <VideoItem url={item.url} />
                </View>
              )}
            </TouchableOpacity>
            {onDeleteMedia && (
                <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => {
                        Alert.alert(
                            "Delete Media",
                            "Are you sure you want to remove this?",
                            [
                                { text: "Cancel", style: "cancel" },
                                { 
                                    text: "Delete", 
                                    style: "destructive",
                                    onPress: () => onDeleteMedia(item.url)
                                }
                            ]
                        );
                    }}
                >
                    <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
            )}
            <View style={styles.mediaFooter}>
              <Text style={styles.mediaUploadedBy} numberOfLines={1}>
                {item.uploadedBy}
              </Text>
              <Text style={styles.mediaTime}>
                {new Date(item.uploadedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mediaSection: { marginTop: 30 },
  mediaSectionTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  mediaWrapper: { width: MEDIA_ITEM_SIZE, position: 'relative' },
  mediaItem: {
    width: MEDIA_ITEM_SIZE,
    height: MEDIA_ITEM_SIZE,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    overflow: "hidden",
  },
  mediaItemContent: {
    width: "100%",
    height: "100%",
  },
  loadingPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  mediaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  mediaUploadedBy: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  mediaTime: { color: Colors.textMuted, fontSize: 10 },
  deleteBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 6,
      borderRadius: 15,
      zIndex: 10,
  }
});
