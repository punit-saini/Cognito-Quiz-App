import { CustomInputProps } from '@/type';
import { useState } from "react";
import { StyleProp, Text, TextInput, TextStyle, View } from 'react-native';
const CustomInput = ({
    placeholder = 'Enter text',
    value,
    onChangeText,
    label,
    secureTextEntry = false,
    keyboardType="default",
    style,
    placeholderTextColor = "#888",
    autoCapitalize = "none",
    autoCorrect = false
}: CustomInputProps & {
    style?: StyleProp<TextStyle>,
    placeholderTextColor?: string,
    autoCapitalize?: "none" | "sentences" | "words" | "characters",
    autoCorrect?: boolean
}) => {
    const [isFocused, setIsFocused] = useState(false);


    return (
        <View className="w-full">
            {label && <Text className="label">{label}</Text>}

            <TextInput
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                placeholderTextColor={placeholderTextColor}
                style={style}
                // className={clsx('input', isFocused ? 'border-primary' : 'border-gray-300')}
            />
        </View>
    )
}
export default CustomInput