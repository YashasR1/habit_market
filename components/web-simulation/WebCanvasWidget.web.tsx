import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { FileEdit, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { WebInfoOverlay } from './WebInfoOverlay';

export const WebCanvasWidget = () => {
    const [showClientPortalInfo, setShowClientPortalInfo] = useState(false);

    if (Platform.OS !== 'web') return null;

    return (
        <>
            <TouchableOpacity 
                style={[styles.canvasWidget, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}
                activeOpacity={0.75}
                onPress={() => setShowClientPortalInfo(true)}
            >
                <View style={styles.canvasWidgetLeft}>
                    <View style={[styles.canvasIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <FileEdit size={16} color="#F59E0B" />
                    </View>
                    <View style={styles.canvasWidgetTextContainer}>
                        <Text style={styles.canvasWidgetTitle}>Demo Client</Text>
                        <Text style={styles.canvasWidgetDesc}>edited Project Launch</Text>
                    </View>
                </View>
                <View style={styles.canvasWidgetRight}>
                    <Text style={styles.canvasWidgetTime}>Just now</Text>
                    <ChevronRight size={16} color={Colors.textMuted} />
                </View>
            </TouchableOpacity>

            <WebInfoOverlay 
                isVisible={showClientPortalInfo}
                onClose={() => setShowClientPortalInfo(false)}
                title="Shared Client Portals"
                introHighlightText="Assign"
                introRestText="section transforms HabitMarket into a collaborative workspace for coaches, trainers, and advisors."
                features={[
                    {
                        title: "Real-time Syncing",
                        description: "Invite clients to dedicated canvas boards. Track their progress, update their assigned tasks, and share rich-text notes instantly.",
                        icon: "arrow"
                    }
                ]}
                nativeDisclaimerDesc="Because Client Portals rely on secure socket connections, background caching, and push notifications, this feature is built exclusively for the HabitMarket Mobile App."
            />
        </>
    );
};

const styles = StyleSheet.create({
  canvasWidget: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.surface,
      padding: 12,
      borderRadius: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: Colors.border,
  },
  canvasWidgetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
  },
  canvasIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(56, 189, 248, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
  },
  canvasWidgetTextContainer: {
      flex: 1,
  },
  canvasWidgetTitle: {
      color: Colors.text,
      fontSize: 14,
      fontWeight: 'bold',
  },
  canvasWidgetDesc: {
      color: Colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
  },
  canvasWidgetRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
  },
  canvasWidgetTime: {
      color: Colors.textMuted,
      fontSize: 11,
  },
});
