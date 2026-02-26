import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');
export const MEDIA_ITEM_SIZE = (width - 50 - 10) / 2; // 2-col grid, accounting for padding + gap

// -- Small component to play individual videos --
export const VideoItem = ({ url }: { url: string }) => {
    const player = useVideoPlayer(url, (player) => {
        player.loop = false;
        player.play();
    });

    return (
        <VideoView
            style={styles.mediaItem}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
        />
    );
};

const styles = StyleSheet.create({
    mediaItem: { 
        width: MEDIA_ITEM_SIZE, 
        height: MEDIA_ITEM_SIZE, 
        borderRadius: 10, 
        backgroundColor: '#1E293B' 
    }
});
