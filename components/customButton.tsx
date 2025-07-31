import { CustomButtonProps } from "@/type";
// import clsx from "clsx";
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
// import cn from "clsx";

const CustomButton = ({
    onPress,
    title="Click Me",
    style,
    textStyle,
    leftIcon,
    isLoading = false
}: CustomButtonProps) => {
    return (
        <TouchableOpacity  onPress={onPress}>
            {leftIcon}

            <View className="flex-center flex-row">
                {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                ): (
                    <Text >
                        {title}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    )
}
export default CustomButton