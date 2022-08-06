import { ChainId } from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import { Signer } from 'ethers';
import { toLower } from 'lodash';
import {
  Rap,
  RapExchangeActionParameters,
  SwapActionParameters,
} from '../common';
import {
  ProtocolType,
  TransactionStatus,
  TransactionType,
} from '@rainbow-me/entities';
import {
  estimateSwapGasLimit,
  executeSwap,
} from '@rainbow-me/handlers/uniswap';
import { isL2Network, toHex } from '@rainbow-me/handlers/web3';
import { parseGasParamsForTransaction } from '@rainbow-me/parsers';
import { additionalDataUpdateL2AssetToWatch } from '@rainbow-me/redux/additionalAssetsData';
import { dataAddNewTransaction } from '@rainbow-me/redux/data';
import store from '@rainbow-me/redux/store';
import { greaterThan } from '@rainbow-me/utilities';
import { AllowancesCache, ethereumUtils, gasUtils } from '@rainbow-me/utils';
import logger from 'logger';

const actionName = 'swap';

const swap = async (
  wallet: Signer,
  currentRap: Rap,
  index: number,
  parameters: RapExchangeActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const {
    inputAmount,
    tradeDetails,
    permit,
    chainId,
    requiresApprove,
  } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { accountAddress } = store.getState().settings;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { gasFeeParamsBySpeed, selectedGasFee } = store.getState().gas;
  let gasParams = parseGasParamsForTransaction(selectedGasFee);
  // if swap isn't the last action, use fast gas or custom (whatever is faster)
  const isL2 = isL2Network(
    ethereumUtils.getNetworkFromChainId(parameters?.chainId || ChainId.mainnet)
  );
  const emptyGasFee = isL2
    ? !gasParams.gasPrice
    : !gasParams.maxFeePerGas || !gasParams.maxPriorityFeePerGas;

  if (currentRap.actions.length - 1 > index || emptyGasFee) {
    const fastMaxFeePerGas =
      gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxFeePerGas?.amount;
    const fastMaxPriorityFeePerGas =
      gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxPriorityFeePerGas?.amount;

    if (greaterThan(fastMaxFeePerGas, gasParams?.maxFeePerGas || 0)) {
      gasParams.maxFeePerGas = fastMaxFeePerGas;
    }
    if (
      greaterThan(
        fastMaxPriorityFeePerGas,
        gasParams?.maxPriorityFeePerGas || 0
      )
    ) {
      gasParams.maxPriorityFeePerGas = fastMaxPriorityFeePerGas;
    }
  }
  let gasLimit;
  try {
    const newGasLimit = await estimateSwapGasLimit({
      chainId: Number(chainId),
      requiresApprove,
      tradeDetails,
    });
    gasLimit = newGasLimit;
  } catch (e) {
    logger.sentry(`[${actionName}] error estimateSwapGasLimit`);
    captureException(e);
    throw e;
  }

  let swap;
  try {
    logger.sentry(`[${actionName}] executing rap`, {
      ...gasParams,
      gasLimit,
    });
    const nonce = baseNonce ? baseNonce + index : undefined;

    const swapParams = {
      ...gasParams,
      chainId,
      flashbots: !!parameters.flashbots,
      gasLimit,
      nonce,
      permit: !!permit,
      tradeDetails,
      wallet,
    };

    // @ts-ignore
    swap = await executeSwap(swapParams);
    dispatch(
      additionalDataUpdateL2AssetToWatch({
        hash: swap?.hash || '',
        inputCurrency: {
          address: inputCurrency?.address,
          decimals: inputCurrency?.decimals,
          mainnetAddress: inputCurrency?.mainnet_address,
          symbol: inputCurrency?.symbol,
        },
        network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
        outputCurrency: {
          address: outputCurrency?.address,
          decimals: outputCurrency?.decimals,
          mainnetAddress: outputCurrency?.mainnet_address,
          symbol: outputCurrency?.symbol,
        },
        userAddress: accountAddress,
      })
    );

    if (permit) {
      const walletAddress = await wallet.getAddress();
      // Clear the allowance
      const cacheKey = toLower(
        `${walletAddress}|${tradeDetails.sellTokenAddress}|${tradeDetails.to}`
      );
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete AllowancesCache.cache[cacheKey];
    }
  } catch (e) {
    logger.sentry('Error', e);
    const fakeError = new Error('Failed to execute swap');
    captureException(fakeError);
    throw e;
  }

  logger.log(`[${actionName}] response`, swap);

  const newTransaction = {
    ...gasParams,
    amount: inputAmount,
    asset: inputCurrency,
    data: swap?.data,
    flashbots: parameters.flashbots,
    from: accountAddress,
    gasLimit,
    hash: swap?.hash,
    network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
    nonce: swap?.nonce,
    protocol: ProtocolType.uniswap,
    status: TransactionStatus.swapping,
    to: swap?.to,
    type: TransactionType.trade,
    value: (swap && toHex(swap.value)) || undefined,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);

  dispatch(
    dataAddNewTransaction(
      // @ts-ignore
      newTransaction,
      accountAddress,
      false,
      wallet?.provider as any
    )
  );
  return swap?.nonce;
};

export default swap;
