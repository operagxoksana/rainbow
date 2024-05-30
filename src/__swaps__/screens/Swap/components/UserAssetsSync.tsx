import { Address } from 'viem';
import { useAccountSettings } from '@/hooks';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectUserAssetsList, selectorFilterByUserChains } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { useUserAssets } from '../resources/assets';

export const UserAssetsSync = () => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const userAssetsWalletAddress = userAssetsStore(state => state.associatedWalletAddress);
  const isSwapsOpen = useSwapsStore(state => state.isSwapsOpen);

  useUserAssets(
    {
      address: currentAddress as Address,
      currency: currentCurrency,
    },
    {
      enabled: !isSwapsOpen || userAssetsWalletAddress !== currentAddress,
      select: data =>
        selectorFilterByUserChains({
          data,
          selector: selectUserAssetsList,
        }),
      onSuccess: data => {
        if (!isSwapsOpen || userAssetsWalletAddress !== currentAddress) {
          const userAssets = new Map(data.map(d => [d.uniqueId, d as ParsedSearchAsset]));
          userAssetsStore.setState({
            associatedWalletAddress: currentAddress as Address,
            userAssetsById: new Set(data.map(d => d.uniqueId)),
            userAssets,
          });

          const inputAsset = userAssets.values().next().value;
          useSwapsStore.setState({
            inputAsset,
            selectedOutputChainId: inputAsset.chainId ?? ChainId.mainnet,
          });
        }
      },
    }
  );

  return null;
};
