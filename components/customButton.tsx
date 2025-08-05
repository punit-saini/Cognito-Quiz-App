import { CustomButtonProps } from "@/type";
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

const CustomButton = ({
    onPress,
    title="Click Me",
    style,
    textStyle,
    leftIcon,
    isLoading = false
}: CustomButtonProps & {
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}) => {
    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.8}
            style={[styles.buttonContainer, style]}
            disabled={isLoading}
        >
            <LinearGradient
                colors={['#37B6E9', '#1A8CC5', '#0A6B99']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.contentContainer}>
                    {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
                    {isLoading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={[styles.buttonText, textStyle]}>
                            {title}
                        </Text>
                    )}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    )
}
const styles = StyleSheet.create({
    buttonContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#37B6E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        width: '100%',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
    }
});

export default CustomButton