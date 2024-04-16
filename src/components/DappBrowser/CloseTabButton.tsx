import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SharedValue, interpolate, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Box, TextIcon, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { deviceUtils } from '@/utils';
import { AnimatedBlurView } from '@/__swaps__/screens/Swap/components/AnimatedBlurView';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { TIMING_CONFIGS } from '../animations/animationConfigs';
import { COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, TAB_VIEW_COLUMN_WIDTH } from './Dimensions';

// ⚠️ TODO: Fix close button press detection — currently being blocked
// by the gesture handlers within the BrowserTab component.

export const X_BUTTON_SIZE = 22;
export const X_BUTTON_PADDING = 6;

const INVERTED_WEBVIEW_SCALE = deviceUtils.dimensions.width / TAB_VIEW_COLUMN_WIDTH;
const SINGLE_TAB_INVERTED_WEBVIEW_SCALE = 10 / 7;

const SCALE_ADJUSTED_X_BUTTON_SIZE = X_BUTTON_SIZE * INVERTED_WEBVIEW_SCALE;
const SCALE_ADJUSTED_X_BUTTON_PADDING = X_BUTTON_PADDING * INVERTED_WEBVIEW_SCALE;

const SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB = X_BUTTON_SIZE * SINGLE_TAB_INVERTED_WEBVIEW_SCALE;
const SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB = X_BUTTON_PADDING * SINGLE_TAB_INVERTED_WEBVIEW_SCALE;

export const CloseTabButton = ({
  animatedMultipleTabsOpen,
  animatedTabIndex,
  gestureScale,
  gestureX,
  gestureY,
  isOnHomepage,
  multipleTabsOpen,
  tabId,
  animatedActiveTabIndex,
  tabViewProgress,
  tabViewVisible,
  closeTabWorklet,
  currentlyOpenTabIds,
}: {
  animatedMultipleTabsOpen: SharedValue<number>;
  animatedTabIndex: SharedValue<number>;
  gestureScale: SharedValue<number>;
  gestureX: SharedValue<number>;
  gestureY: SharedValue<number>;
  isOnHomepage: boolean;
  multipleTabsOpen: SharedValue<boolean>;
  tabId: string;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  tabViewProgress: SharedValue<number> | undefined;
  tabViewVisible: SharedValue<boolean> | undefined;
  closeTabWorklet?: (tabId: string, tabIndex: number) => void;
  currentlyOpenTabIds: SharedValue<string[]>;
}) => {
  const { isDarkMode } = useColorMode();

  const closeButtonStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value || 0;
    const animatedIsActiveTab = animatedActiveTabIndex?.value === animatedTabIndex.value;

    // Switch to using progress-based interpolation when the tab view is
    // entered. This is mainly to avoid showing the close button in the
    // active tab until the tab view animation is near complete.
    const interpolatedOpacity = interpolate(progress, [0, 80, 100], [animatedIsActiveTab ? 0 : 1, animatedIsActiveTab ? 0 : 1, 1]);
    const opacity = tabViewVisible?.value || !animatedIsActiveTab ? interpolatedOpacity : withTiming(0, TIMING_CONFIGS.fastFadeConfig);

    return { opacity };
  });

  const containerStyle = useAnimatedStyle(() => {
    const buttonPadding = multipleTabsOpen.value ? SCALE_ADJUSTED_X_BUTTON_PADDING : SCALE_ADJUSTED_X_BUTTON_PADDING_SINGLE_TAB;
    const buttonSize = multipleTabsOpen.value ? SCALE_ADJUSTED_X_BUTTON_SIZE : SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB;

    const isEmptyState = isOnHomepage && !multipleTabsOpen.value;
    const opacity = isEmptyState ? withTiming(0, TIMING_CONFIGS.tabPressConfig) : withTiming(1, TIMING_CONFIGS.tabPressConfig);
    const pointerEvents = tabViewVisible?.value && !isEmptyState ? 'auto' : 'none';

    return {
      height: buttonSize + buttonPadding * 2,
      opacity,
      pointerEvents,
      right: 0,
      top: 0,
      width: buttonSize + buttonPadding * 2,
    };
  });

  const multipleTabsStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedMultipleTabsOpen.value, [0, 0.9, 1], [0, 0, 1], 'clamp'),
      pointerEvents: multipleTabsOpen.value ? 'auto' : 'none',
    };
  });

  const singleTabStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedMultipleTabsOpen.value, [0, 0.1, 1], [1, 0, 0], 'clamp'),
      pointerEvents: multipleTabsOpen.value ? 'none' : 'auto',
    };
  });

  const closeTab = useCallback(() => {
    'worklet';
    // Store the tab's index before modifying currentlyOpenTabIds, so we can pass it along to closeTabWorklet()
    const storedTabIndex = animatedTabIndex.value;

    const isOnlyOneTabOpen = (currentlyOpenTabIds?.value.length || 0) === 1;
    const isTabInLeftColumn = storedTabIndex % 2 === 0 && !isOnlyOneTabOpen;
    const xDestination = isTabInLeftColumn ? -deviceUtils.dimensions.width / 1.5 : -deviceUtils.dimensions.width;

    // Remove the tab from currentlyOpenTabIds as soon as the tab close is initiated
    currentlyOpenTabIds?.modify(value => {
      const index = value.indexOf(tabId);
      if (index !== -1) {
        value.splice(index, 1);
      }
      return value;
    });

    gestureX.value = withTiming(xDestination, TIMING_CONFIGS.tabPressConfig, () => {
      // Ensure the tab remains hidden after being swiped off screen (until the tab is destroyed)
      gestureScale.value = 0;
      // Because the animation is complete we know the tab is off screen and can be safely destroyed
      closeTabWorklet?.(tabId, storedTabIndex);
    });

    // In the event two tabs are open when this one is closed, we animate its Y position to align it
    // vertically with the remaining tab as this tab exits and the remaining tab scales up.
    const isLastOrSecondToLastTabAndExiting = currentlyOpenTabIds?.value?.indexOf(tabId) === -1 && currentlyOpenTabIds.value.length === 1;
    if (isLastOrSecondToLastTabAndExiting) {
      const existingYTranslation = gestureY.value;
      const scaleDiff = 0.7 - TAB_VIEW_COLUMN_WIDTH / deviceUtils.dimensions.width;
      gestureY.value = withTiming(existingYTranslation + scaleDiff * COLLAPSED_WEBVIEW_HEIGHT_UNSCALED, TIMING_CONFIGS.tabPressConfig);
    }
  }, [animatedTabIndex, closeTabWorklet, currentlyOpenTabIds, gestureScale, gestureX, gestureY, tabId]);

  return (
    <Animated.View style={[styles.containerStyle, containerStyle]}>
      <GestureHandlerV1Button
        disableButtonPressWrapper
        onPressWorklet={closeTab}
        pointerEvents="auto"
        style={styles.buttonPressWrapperStyle}
      >
        <Box as={Animated.View} position="absolute" style={singleTabStyle}>
          {IS_IOS ? (
            <Box
              as={AnimatedBlurView}
              blurAmount={10}
              blurType={isDarkMode ? 'materialDark' : 'materialLight'}
              style={[styles.closeButtonStyle, closeButtonStyle, { borderRadius: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB / 2 }]}
            >
              <Box
                background="fillSecondary"
                borderRadius={SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB / 2}
                height="full"
                position="absolute"
                width="full"
              />
              <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB} multipleTabsOpen={false} />
            </Box>
          ) : (
            <Box
              as={Animated.View}
              background="fillTertiary"
              style={[
                styles.closeButtonStyle,
                closeButtonStyle,
                { height: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB, width: SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB },
              ]}
            >
              <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE_SINGLE_TAB} multipleTabsOpen={false} />
            </Box>
          )}
        </Box>
        <Box as={Animated.View} position="absolute" style={multipleTabsStyle}>
          {IS_IOS ? (
            <Box
              as={AnimatedBlurView}
              blurAmount={10}
              blurType={isDarkMode ? 'materialDark' : 'materialLight'}
              style={[styles.closeButtonStyle, closeButtonStyle, { borderRadius: SCALE_ADJUSTED_X_BUTTON_SIZE / 2 }]}
            >
              <Box
                background="fillSecondary"
                borderRadius={SCALE_ADJUSTED_X_BUTTON_SIZE / 2}
                height="full"
                position="absolute"
                width="full"
              />
              <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE} multipleTabsOpen={true} />
            </Box>
          ) : (
            <Box
              as={Animated.View}
              background="fillTertiary"
              style={[
                styles.closeButtonStyle,
                closeButtonStyle,
                { height: SCALE_ADJUSTED_X_BUTTON_SIZE, width: SCALE_ADJUSTED_X_BUTTON_SIZE },
              ]}
            >
              <XIcon buttonSize={SCALE_ADJUSTED_X_BUTTON_SIZE} multipleTabsOpen={true} />
            </Box>
          )}
        </Box>
      </GestureHandlerV1Button>
    </Animated.View>
  );
};

const XIcon = ({ buttonSize, multipleTabsOpen }: { buttonSize: number; multipleTabsOpen: boolean }) => {
  return (
    <TextIcon
      color="labelTertiary"
      containerSize={buttonSize}
      size={multipleTabsOpen ? 'icon 28px' : 'icon 17px'}
      textStyle={multipleTabsOpen ? undefined : { paddingBottom: 0.5 }}
      weight="bold"
    >
      􀆄
    </TextIcon>
  );
};

const styles = StyleSheet.create({
  buttonPressWrapperStyle: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  closeButtonStyle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerStyle: {
    position: 'absolute',
    zIndex: 99999999999,
  },
});
