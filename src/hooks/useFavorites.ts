import { useQuery } from '@tanstack/react-query';
import useAccountProfile from './useAccountProfile';
import { createQueryKey, queryClient } from '@/react-query';
import { getUniswapFavorites } from '@/handlers/localstorage/uniswap';
import useAccountSettings from './useAccountSettings';

export const getFavorites = () => [
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
  '0xc00e94cb662c3520282e6f5717214004a7f26888',
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
  '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
  '0x408e41876cccdc0f92210600ef50372656052a38',
  '0xba100000625a3754423978a60c9317c58a424e3d',
  '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
];

export const saveFavorites = () => {};

export const favoritesQueryKey = ({ address }: { address: string }) =>
  createQueryKey('favorites', { address }, { persisterVersion: 1 });

export function useFavorites() {
  const { accountAddress } = useAccountProfile();
  const { network } = useAccountSettings();

  const queryKey = favoritesQueryKey({ address: accountAddress });

  const query = useQuery(
    queryKey,
    async () => await getUniswapFavorites(network),
    {
      enabled: !!accountAddress,
      staleTime: Infinity,
      cacheTime: Infinity,
    }
  );

  return {
    favorites: query?.data ?? [],
    addToFavorites: (tokenAddress: string) => {
      const lowercasedAddress = tokenAddress.toLowerCase();
      if (!query?.data?.includes(lowercasedAddress)) {
        queryClient.setQueryData(queryKey, (oldData: string[] | undefined) => [
          ...(oldData ?? []),
          lowercasedAddress,
        ]);
      }
    },
    removeFromFavorites: (tokenAddress: string) => {},
  };
}