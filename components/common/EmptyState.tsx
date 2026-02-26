import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence,
    FadeInDown
} from 'react-native-reanimated';
import { FolderOpen, Target, Plus, Search } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface EmptyStateProps {
    title: string;
    description: string;
    icon: 'folder' | 'target' | 'search';
    actionLabel?: string;
    onAction?: () => void;
}

export const EmptyState = ({ title, description, icon, actionLabel, onAction }: EmptyStateProps) => {
    const floatAnim = useSharedValue(0);

    useEffect(() => {
        floatAnim.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 2000 }),
                withTiming(0, { duration: 2000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: floatAnim.value }]
        };
    });

    const IconComponent = 
        icon === 'folder' ? FolderOpen : 
        icon === 'target' ? Target : Search;

    return (
        <Animated.View 
            entering={FadeInDown.duration(600).springify()}
            style={styles.container}
        >
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                <IconComponent size={64} color={Colors.primary} strokeWidth={1} />
            </Animated.View>
            
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {actionLabel && onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
                    <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        minHeight: 300,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    actionText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: 'bold',
    },
});
