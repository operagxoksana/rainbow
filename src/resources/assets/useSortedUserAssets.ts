import { getIsHardhatConnected } from '@/handlers/web3';
import { useAccountSettings } from '@/hooks';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';

export function useSortedUserAssets() {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const connectedToHardhat = getIsHardhatConnected();

  return useUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat,
  });
}
