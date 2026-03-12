import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Check, ArrowUpRight } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

export interface WebFeatureBlock {
    title: string;
    description: string;
    icon?: 'check' | 'arrow';
}

interface WebInfoOverlayProps {
    isVisible: boolean;
    onClose: () => void;
    title: string;
    introHighlightText: string;
    introRestText: string;
    features: WebFeatureBlock[];
    nativeDisclaimerDesc: string;
}

export const WebInfoOverlay = ({
    isVisible,
    onClose,
    title,
    introHighlightText,
    introRestText,
    features,
    nativeDisclaimerDesc
}: WebInfoOverlayProps) => {
    // Fail-safe: Only render on Web
    if (Platform.OS !== 'web') return null;

    return (
        <Modal visible={isVisible} transparent={true} animationType="fade">
            <View style={styles.webWelcomeOverlay}>
                <View style={styles.webWelcomeCard}>
                    <View style={styles.webWelcomeHeader}>
                        <Text style={styles.webWelcomeTitle}>{title}</Text>
                    </View>
                    
                    <ScrollView style={styles.webWelcomeScroll}>
                        <Text style={styles.webWelcomeIntro}>
                            The <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{introHighlightText}</Text> {introRestText}
                        </Text>

                        {features.map((feat, index) => (
                            <View key={index} style={styles.webFeatureBlock}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    {feat.icon === 'check' ? (
                                        <Check size={18} color={Colors.primary} />
                                    ) : (
                                        <ArrowUpRight size={18} color={Colors.primary} />
                                    )}
                                    <Text style={styles.webFeatureTitle}>{feat.title}</Text>
                                </View>
                                <Text style={styles.webFeatureDesc}>{feat.description}</Text>
                            </View>
                        ))}

                        <View style={styles.webFeatureBlock}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Check size={18} color={Colors.success} />
                                <Text style={styles.webFeatureTitle}>Native Mobile Experience</Text>
                            </View>
                            <Text style={styles.webFeatureDesc}>
                                {nativeDisclaimerDesc}
                            </Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.webWelcomeButton}
                        onPress={onClose}
                    >
                        <Text style={styles.webWelcomeButtonText}>Got It!</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  webWelcomeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  webWelcomeCard: {
    backgroundColor: Colors.surface,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  webWelcomeHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 15,
  },
  webWelcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  webWelcomeScroll: {
    marginBottom: 20,
  },
  webWelcomeIntro: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 24,
  },
  webFeatureBlock: {
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  webFeatureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  webFeatureDesc: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  webWelcomeButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  webWelcomeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
