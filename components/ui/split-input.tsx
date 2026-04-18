import React from "react";
import { Platform, TextInput, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { InputWithFocus } from "@/components/ui/input-with-focus";

interface SplitInputProps {
  label: string;
  leftPlaceholder?: string;
  rightPlaceholder: string;
  leftValue: string;
  rightValue: string;
  onChangeLeft: (value: string) => void;
  onChangeRight: (value: string) => void;
  leftTopCaption?: string;
  containerStyle?: any;
  wrapperStyle?: any;
  labelStyle?: any;
  disabled?: boolean;
}

export function SplitInput({
  label,
  leftPlaceholder,
  rightPlaceholder,
  leftValue,
  rightValue,
  onChangeLeft,
  onChangeRight,
  containerStyle,
  wrapperStyle,
  labelStyle,
  disabled = false,
}: SplitInputProps) {
  const { colors } = useTheme();

  return (
    <View style={wrapperStyle}>
      {label ? (
        <ThemedText
          type="body2"
          style={[{ color: colors.text, fontWeight: "600", marginBottom: 8 }, labelStyle]}
        >
          {label}
        </ThemedText>
      ) : null}

      <InputWithFocus
        containerStyle={[
          {
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderRadius: 12,
            overflow: "hidden",
            backgroundColor: colors.filterInputBackground,
            borderColor: colors.border,
            minHeight: 48,
          },
          containerStyle,
        ]}
        primaryColor={colors.primary}
      >
        <TextInput
          style={{
            width: "25%",
            minWidth: 90,
            color: colors.text,
            fontSize: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 0,
            ...(Platform.OS === "web"
              ? ({
                  outlineWidth: 0,
                  outlineColor: "transparent",
                  outlineStyle: "solid",
                  boxShadow: "none",
                } as any)
              : {}),
          }}
          placeholder={leftPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={leftValue}
          onChangeText={onChangeLeft}
          editable={!disabled}
          underlineColorAndroid="transparent"
        />

        <View
          style={{
            width: 1,
            alignSelf: "stretch",
            backgroundColor: colors.border,
            opacity: 0.7,
          }}
        />

        <TextInput
          style={{
            width: "75%",
            color: colors.text,
            fontSize: 14,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: 0,
            ...(Platform.OS === "web"
              ? ({
                  outlineWidth: 0,
                  outlineColor: "transparent",
                  outlineStyle: "solid",
                  boxShadow: "none",
                } as any)
              : {}),
          }}
          placeholder={rightPlaceholder}
          placeholderTextColor={colors.textSecondary}
          value={rightValue}
          onChangeText={onChangeRight}
          editable={!disabled}
          underlineColorAndroid="transparent"
        />
      </InputWithFocus>
    </View>
  );
}
