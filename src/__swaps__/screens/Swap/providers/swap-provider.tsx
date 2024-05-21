// @refresh
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { StyleProp, TextStyle, TextInput, NativeModules } from 'react-native';
import * as i18n from '@/languages';
import {
  AnimatedRef,
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { SwapAssetType, inputKeys } from '@/__swaps__/types/swap';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { useAnimatedSwapStyles } from '@/__swaps__/screens/Swap/hooks/useAnimatedSwapStyles';
import { useSwapTextStyles } from '@/__swaps__/screens/Swap/hooks/useSwapTextStyles';
import { useSwapNavigation, NavigationSteps } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapInputsController } from '@/__swaps__/screens/Swap/hooks/useSwapInputsController';
import { ExtendedAnimatedAssetWithColors, ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useSwapWarning } from '@/__swaps__/screens/Swap/hooks/useSwapWarning';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { swapsStore } from '@/state/swaps/swapsStore';
import { isSameAsset } from '@/__swaps__/utils/assets';
import { parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { RainbowError, logger } from '@/logger';
import { useSwapGas } from '@/__swaps__/screens/Swap/hooks/useSwapGas';
import { useSwapSettings } from '../hooks/useSwapSettings';
import { QuoteTypeMap, RapSwapActionParameters } from '@/raps/references';
import { walletExecuteRap } from '@/raps/execute';
import { ethereumUtils } from '@/utils';
import { loadWallet } from '@/model/wallet';
import { getProviderForNetwork } from '@/handlers/web3';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

interface SwapContextType {
  isFetching: SharedValue<boolean>;
  isSwapping: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
  searchInputRef: AnimatedRef<TextInput>;

  // TODO: Combine navigation progress steps into a single shared value
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<number>;

  sliderXPosition: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;

  lastTypedInput: SharedValue<inputKeys>;
  focusedInput: SharedValue<inputKeys>;

  selectedOutputChainId: SharedValue<ChainId>;
  setSelectedOutputChainId: (chainId: ChainId) => void;

  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  setAsset: ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset }) => void;

  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  executeSwap: () => void;

  SwapSettings: ReturnType<typeof useSwapSettings>;
  SwapGas: ReturnType<typeof useSwapGas>;
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  AnimatedSwapStyles: ReturnType<typeof useAnimatedSwapStyles>;
  SwapTextStyles: ReturnType<typeof useSwapTextStyles>;
  SwapNavigation: ReturnType<typeof useSwapNavigation>;
  SwapWarning: ReturnType<typeof useSwapWarning>;

  confirmButtonIcon: Readonly<SharedValue<string>>;
  confirmButtonLabel: Readonly<SharedValue<string>>;
  confirmButtonIconStyle: StyleProp<TextStyle>;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

interface SwapProviderProps {
  children: ReactNode;
}

export const SwapProvider = ({ children }: SwapProviderProps) => {
  const isFetching = useSharedValue(false);
  const isSwapping = useSharedValue(false);
  const isQuoteStale = useSharedValue(0);

  const searchInputRef = useAnimatedRef<TextInput>();

  const inputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const outputProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);
  const configProgress = useSharedValue(NavigationSteps.INPUT_ELEMENT_FOCUSED);

  const sliderXPosition = useSharedValue(SLIDER_WIDTH * INITIAL_SLIDER_POSITION);
  const sliderPressProgress = useSharedValue(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT);

  const lastTypedInput = useSharedValue<inputKeys>('inputAmount');
  const focusedInput = useSharedValue<inputKeys>('inputAmount');

  const selectedOutputChainId = useSharedValue<ChainId>(ChainId.mainnet);

  const internalSelectedInputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(null);
  const internalSelectedOutputAsset = useSharedValue<ExtendedAnimatedAssetWithColors | null>(null);

  const quote = useSharedValue<Quote | CrosschainQuote | QuoteError | null>(null);

  const SwapSettings = useSwapSettings({
    inputAsset: internalSelectedInputAsset,
  });

  const SwapGas = useSwapGas({
    SwapSettings,
    inputAsset: internalSelectedInputAsset,
    outputAsset: internalSelectedOutputAsset,
    quote,
  });

  const SwapInputController = useSwapInputsController({
    focusedInput,
    lastTypedInput,
    inputProgress,
    outputProgress,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isFetching,
    isQuoteStale,
    sliderXPosition,
    quote,
  });

  const SwapNavigation = useSwapNavigation({
    SwapInputController,
    inputProgress,
    outputProgress,
    configProgress,
  });

  const SwapWarning = useSwapWarning({
    SwapInputController,
    inputAsset: internalSelectedInputAsset,
    outputAsset: internalSelectedOutputAsset,
    quote,
    sliderXPosition,
    isFetching,
    isQuoteStale,
  });

  const AnimatedSwapStyles = useAnimatedSwapStyles({
    SwapWarning,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    inputProgress,
    outputProgress,
    configProgress,
    isFetching,
  });

  const SwapTextStyles = useSwapTextStyles({
    SwapInputController,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    isQuoteStale,
    focusedInput,
    inputProgress,
    outputProgress,
    sliderPressProgress,
  });

  const handleProgressNavigation = ({ type }: { type: SwapAssetType }) => {
    'worklet';

    const inputAsset = internalSelectedInputAsset.value;
    const outputAsset = internalSelectedOutputAsset.value;

    switch (type) {
      case SwapAssetType.inputAsset:
        // if there is already an output asset selected, just close both lists
        if (outputAsset) {
          inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        } else {
          inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
        }
        break;
      case SwapAssetType.outputAsset:
        // if there is already an input asset selected, just close both lists
        if (inputAsset) {
          inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
          outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        } else {
          inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
          outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        }
        break;
    }
  };

  const setSelectedOutputChainId = (chainId: ChainId) => {
    const updateChainId = (chainId: ChainId) => {
      'worklet';
      selectedOutputChainId.value = chainId;
    };

    swapsStore.setState({ selectedOutputChainId: chainId });
    runOnUI(updateChainId)(chainId);
  };

  const setAsset = ({ type, asset }: { type: SwapAssetType; asset: ParsedSearchAsset }) => {
    const updateAssetValue = ({ type, asset }: { type: SwapAssetType; asset: ExtendedAnimatedAssetWithColors | null }) => {
      'worklet';

      switch (type) {
        case SwapAssetType.inputAsset:
          internalSelectedInputAsset.value = asset;
          selectedOutputChainId.value = asset?.chainId ?? ChainId.mainnet;
          break;
        case SwapAssetType.outputAsset:
          internalSelectedOutputAsset.value = asset;
          break;
      }

      handleProgressNavigation({
        type,
      });
    };

    // const prevAsset = swapsStore.getState()[type];
    const prevOtherAsset = swapsStore.getState()[type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset];

    // TODO: Fix me. This is causing assets to not be set sometimes?
    // if we're setting the same asset, exit early as it's a no-op
    // if (prevAsset && isSameAsset(prevAsset, asset)) {
    //   logger.debug(`[setAsset]: Not setting ${type} asset as it's the same as what is already set`);
    //   handleProgressNavigation({
    //     type,
    //     inputAsset: type === SwapAssetType.inputAsset ? asset : prevOtherAsset,
    //     outputAsset: type === SwapAssetType.outputAsset ? asset : prevOtherAsset,
    //   });
    //   return;
    // }

    // if we're setting the same asset as the other asset, we need to clear the other asset
    if (prevOtherAsset && isSameAsset(prevOtherAsset, asset)) {
      logger.debug(`[setAsset]: Swapping ${type} asset for ${type === SwapAssetType.inputAsset ? 'output' : 'input'} asset`);

      swapsStore.setState({
        [type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset]: null,
      });
      runOnUI(updateAssetValue)({
        type: type === SwapAssetType.inputAsset ? SwapAssetType.outputAsset : SwapAssetType.inputAsset,
        asset: null,
      });
    }

    logger.debug(`[setAsset]: Setting ${type} asset to ${asset.name} on ${asset.chainId}`);

    swapsStore.setState({
      [type]: asset,
    });
    runOnUI(updateAssetValue)({ type, asset: parseAssetAndExtend({ asset }) });
  };

  const getNonceAndPerformSwap = async ({
    type,
    parameters,
  }: {
    type: 'swap' | 'crosschainSwap';
    parameters: RapSwapActionParameters<typeof type>;
  }) => {
    const NotificationManager = ios ? NativeModules.NotificationManager : null;
    NotificationManager?.postNotification('rapInProgress');

    const resetSwappingStatus = () => {
      'worklet';
      isSwapping.value = false;
    };

    const network = ethereumUtils.getNetworkFromChainId(parameters.chainId);
    const provider = await getProviderForNetwork(network);

    const wallet = await loadWallet(parameters.quote.from, false, provider);
    if (!wallet) {
      // TODO: Show alert to user
      runOnUI(resetSwappingStatus)();
      return;
    }

    const { errorMessage } = await walletExecuteRap(wallet, type, parameters);
    console.log(errorMessage);

    runOnUI(resetSwappingStatus)();
    if (errorMessage) {
      if (errorMessage !== 'handled') {
        logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
        const extractedError = errorMessage.split('[')[0];
        Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
        return;
      }
    }

    // TODO: Refresh input and output asset balances
    // TODO: Analytics
    NotificationManager?.postNotification('rapCompleted');
    Navigation.handleAction(Routes.PROFILE_SCREEN, {});
  };

  const executeSwap = () => {
    'worklet';
    if (configProgress.value !== NavigationSteps.SHOW_REVIEW) return;

    const inputAsset = internalSelectedInputAsset.value;
    const outputAsset = internalSelectedOutputAsset.value;
    const q = quote.value;

    if (!inputAsset || !outputAsset || !q || (q as QuoteError)?.error) {
      return;
    }

    isSwapping.value = true;

    const type = inputAsset.chainId !== outputAsset.chainId ? 'crosschainSwap' : 'swap';
    const quoteData = q as QuoteTypeMap[typeof type];
    const flashbots = (SwapSettings.flashbots.value && inputAsset.chainId === ChainId.mainnet) ?? false;

    console.log(SwapGas.selectedGas.value);

    const parameters: RapSwapActionParameters<typeof type> = {
      sellAmount: quoteData.sellAmount?.toString(),
      buyAmount: quoteData.buyAmount?.toString(),
      chainId: inputAsset.chainId,
      assetToSell: inputAsset,
      assetToBuy: outputAsset,
      quote: quoteData,
      flashbots,

      // TODO: Need to expand the types to bring in new BX gas types
      selectedGas: SwapGas.selectedGas.value,
      gasFeeParamsBySpeed: SwapGas.gasFeeParamsBySpeed.value ?? {},
    };

    runOnJS(getNonceAndPerformSwap)({
      type,
      parameters,
    });
  };

  const confirmButtonIcon = useDerivedValue(() => {
    if (isSwapping.value) {
      return '';
    }
    if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
      return '􀎽';
    } else if (configProgress.value === NavigationSteps.SHOW_GAS) {
      return '􀆅';
    }

    if (isFetching.value) {
      return '';
    }

    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    if (SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value) {
      return '';
    } else if (SwapInputController.inputMethod.value === 'slider' && SwapInputController.percentageToSwap.value === 0) {
      return '';
    } else {
      return '􀕹';
    }
  });

  const confirmButtonLabel = useDerivedValue(() => {
    if (isSwapping.value) {
      return 'Swapping';
    }
    if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
      return 'Hold to Swap';
    } else if (configProgress.value === NavigationSteps.SHOW_GAS) {
      return 'Save';
    }

    if (isFetching.value) {
      return 'Fetching prices';
    }

    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    if (SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value) {
      return 'Enter Amount';
    } else if (
      SwapInputController.inputMethod.value === 'slider' &&
      (SwapInputController.percentageToSwap.value === 0 || isInputZero || isOutputZero)
    ) {
      return 'Enter Amount';
    } else {
      return 'Review';
    }
  });

  const confirmButtonIconStyle = useAnimatedStyle(() => {
    const isInputZero = Number(SwapInputController.inputValues.value.inputAmount) === 0;
    const isOutputZero = Number(SwapInputController.inputValues.value.outputAmount) === 0;

    const sliderCondition =
      SwapInputController.inputMethod.value === 'slider' &&
      (SwapInputController.percentageToSwap.value === 0 || isInputZero || isOutputZero);
    const inputCondition = SwapInputController.inputMethod.value !== 'slider' && (isInputZero || isOutputZero) && !isFetching.value;

    const shouldHide = sliderCondition || inputCondition;

    return {
      display: shouldHide ? 'none' : 'flex',
    };
  });

  useEffect(() => {
    return () => {
      swapsStore.setState({
        inputAsset: null,
        outputAsset: null,
        quote: null,
      });

      SwapInputController.quoteFetchingInterval.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('re-rendered swap provider: ', Date.now());

  return (
    <SwapContext.Provider
      value={{
        isFetching,
        isSwapping,
        isQuoteStale,
        searchInputRef,

        inputProgress,
        outputProgress,
        configProgress,

        sliderXPosition,
        sliderPressProgress,

        lastTypedInput,
        focusedInput,

        selectedOutputChainId,
        setSelectedOutputChainId,

        internalSelectedInputAsset,
        internalSelectedOutputAsset,
        setAsset,

        quote,
        executeSwap,

        SwapSettings,
        SwapGas,
        SwapInputController,
        AnimatedSwapStyles,
        SwapTextStyles,
        SwapNavigation,
        SwapWarning,

        confirmButtonIcon,
        confirmButtonLabel,
        confirmButtonIconStyle,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

export const useSwapContext = () => {
  const context = useContext(SwapContext);
  if (context === undefined) {
    throw new Error('useSwap must be used within a SwapProvider');
  }
  return context;
};

export { NavigationSteps };
