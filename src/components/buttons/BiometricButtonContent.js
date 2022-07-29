import React from 'react';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { Text } from '../text';
import { BiometryTypes } from '@rainbow-me/helpers';
import { useBiometryType } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { fonts } from '@rainbow-me/styles';

const { Face, FaceID, Fingerprint, none, passcode, TouchID } = BiometryTypes;

const Label = styled(Text).attrs(
  ({
    color,
    size = fonts.size.larger,
    theme: { colors },
    weight = fonts.weight.semibold,
  }) => ({
    align: 'center',
    color: color || colors.appleBlue,
    letterSpacing: 'rounded',
    size,
    weight,
  })
)({});

function useBiometryIconString(showIcon) {
  const biometryType = useBiometryType();

  const isFace = biometryType === Face || biometryType === FaceID;
  const isPasscode = biometryType === passcode;
  const isTouch = biometryType === Fingerprint || biometryType === TouchID;

  const biometryIconString = isFace
    ? '􀎽'
    : isTouch
    ? '􀟒'
    : isPasscode
    ? '􀒲'
    : '';

  return !biometryType || biometryType === none || !showIcon
    ? ''
    : `${biometryIconString} `;
}

export default function BiometricButtonContent({
  label,
  showIcon = true,
  testID,
  ...props
}) {
  const biometryIcon = useBiometryIconString(!android && showIcon);
  return (
    <Animated.View
      entering={FadeIn.duration(200).delay(100)}
      exiting={FadeOut}
      key={label}
      layout={Layout}
    >
      <Label
        testID={testID || label}
        {...props}
        {...(android && { lineHeight: 23 })}
      >
        {`${biometryIcon}${label}`}
      </Label>
    </Animated.View>
  );
}
