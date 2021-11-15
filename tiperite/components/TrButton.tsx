import { useTheme } from '../hooks/useTheme';
import React from 'react';
import {
  TouchableOpacityProps,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';

export interface TrButtonProps
  extends Omit<TouchableOpacityProps, 'activeOpacity'> {
  title?: string;
  busy?: boolean;
}

export function TrButton({
  disabled,
  onPress,
  style,
  title,
  busy,
  ...props
}: TrButtonProps): JSX.Element {
  const theme = useTheme('TrButton');

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 0.5 : 0.2}
      disabled={disabled || busy}
      onPress={onPress}
      style={[theme.root, { opacity: disabled ? 0.5 : 1 }, style]}
      key={disabled ? 0 : 1}
      {...props}
    >
      {busy ? (
        <ActivityIndicator size="small" />
      ) : (
        <Text style={theme.title}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
