import {
  divWorklet,
  greaterThanWorklet,
  lessThanWorklet,
  mulWorklet,
  powWorklet,
  toFixedWorklet,
  toScaledIntegerWorklet,
} from '@/__swaps__/safe-math/SafeMath';
import { ChainId } from '@/__swaps__/types/chains';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/__swaps__/utils/numbers';
import ethereumUtils, { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { useMemo, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { formatUnits } from 'viem';
import { useSwapContext } from '../providers/swap-provider';
import { GasSettings } from './useCustomGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';
import { useAccountSettings } from '@/hooks';

const LOWER_BOUND_FACTOR = 0.75;
const UPPER_BOUND_FACTOR = 1.25;

function safeBigInt(value: string) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

export function useEstimatedGasFee({
  chainId,
  gasLimit,
  gasSettings,
}: {
  chainId: ChainId;
  gasLimit: string | undefined;
  gasSettings: GasSettings | undefined;
}) {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const nativeNetworkAsset = useNativeAssetForNetwork(network);
  const { gasFeeRange, internalSelectedInputAsset } = useSwapContext();
  const { nativeCurrency } = useAccountSettings();

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee) : gasSettings.gasPrice;

    const totalWei = multiply(gasLimit, amount);

    const inputAsset = internalSelectedInputAsset.value;
    const range = gasFeeRange.value;

    const nativeGasFee = inputAsset ? divWorklet(totalWei, powWorklet(10, inputAsset.decimals)) : undefined;

    const isEstimateOutsideRange =
      range && nativeGasFee && (lessThanWorklet(nativeGasFee, range[0]) || greaterThanWorklet(nativeGasFee, range[1]));

    // If the gas fee range hasn't been set or the estimated fee is outside the range, calculate the range based on the gas fee
    if (inputAsset && nativeGasFee && (!range || isEstimateOutsideRange)) {
      const lowerBound = toFixedWorklet(mulWorklet(nativeGasFee, LOWER_BOUND_FACTOR), inputAsset.decimals);
      const upperBound = toFixedWorklet(mulWorklet(nativeGasFee, UPPER_BOUND_FACTOR), inputAsset.decimals);
      gasFeeRange.value = [lowerBound, upperBound];
    }

    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();

    if (!networkAssetPrice) return `${formatNumber(weiToGwei(totalWei))} Gwei`;

    const gasAmount = formatUnits(safeBigInt(totalWei), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, gasAmount);

    return convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency);
  }, [
    gasFeeRange,
    gasLimit,
    gasSettings,
    internalSelectedInputAsset.value,
    nativeCurrency,
    nativeNetworkAsset?.decimals,
    nativeNetworkAsset?.price,
  ]);
}

export function useSwapEstimatedGasFee(gasSettings: GasSettings | undefined) {
  const { internalSelectedInputAsset: assetToSell, internalSelectedOutputAsset: assetToBuy, quote } = useSwapContext();

  const [state, setState] = useState({
    assetToBuy: assetToBuy.value,
    assetToSell: assetToSell.value,
    chainId: assetToSell.value?.chainId ?? ChainId.mainnet,
    quote: quote.value,
  });

  const debouncedStateSet = useDebouncedCallback(setState, 100, { leading: false, trailing: true });

  // Updates the state as a single block in response to quote changes to ensure the gas fee is cleanly updated once
  useAnimatedReaction(
    () => quote.value,
    (current, previous) => {
      if (!assetToSell.value || !assetToBuy.value || !current || !previous || 'error' in current) return;

      const isSwappingMoreThanAvailableBalance = greaterThanWorklet(
        current.sellAmount.toString(),
        toScaledIntegerWorklet(assetToSell.value.maxSwappableAmount, assetToSell.value.decimals)
      );

      // Skip gas fee recalculation if the user is trying to swap more than their available balance, as it isn't
      // needed and was previously resulting in errors in useEstimatedGasFee.
      if (isSwappingMoreThanAvailableBalance) return;

      if (current !== previous) {
        runOnJS(debouncedStateSet)({
          assetToBuy: assetToBuy.value,
          assetToSell: assetToSell.value,
          chainId: assetToSell.value?.chainId ?? ChainId.mainnet,
          quote: current,
        });
      }
    }
  );

  const { data: gasLimit, isFetching } = useSwapEstimatedGasLimit(
    { chainId: state.chainId, quote: state.quote, assetToSell: state.assetToSell },
    {
      enabled: !!state.quote && !!state.assetToSell && !!state.assetToBuy && !('error' in quote),
    }
  );

  const estimatedFee = useEstimatedGasFee({ chainId: state.chainId, gasLimit, gasSettings });

  return useMemo(() => ({ isLoading: isFetching, data: estimatedFee }), [estimatedFee, isFetching]);
}
