import React, { useCallback, useMemo } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Box, HitSlop, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { CoinRowButton } from '@/__swaps__/screens/Swap/components/CoinRowButton';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { StyleSheet } from 'react-native';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { UniqueId } from '@/__swaps__/types/assets';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { toggleFavorite } from '@/resources/favorites';
import { SwapCoinIcon } from './SwapCoinIcon';
import { ethereumUtils } from '@/utils';

const CoinName = ({ assetId }: { assetId: UniqueId }) => {
  const name = userAssetsStore(state => state.getUserAsset(assetId).name);
  return (
    <Text color="label" size="17pt" weight="semibold">
      {name}
    </Text>
  );
};

const CoinUserBalance = ({ assetId }: { assetId: UniqueId }) => {
  const balance = userAssetsStore(state => state.getUserAsset(assetId).balance.display);
  return (
    <Text color="labelTertiary" size="13pt" weight="semibold">
      {balance}
    </Text>
  );
};

const CoinSymbol = ({ assetId }: { assetId: UniqueId }) => {
  const symbol = userAssetsStore(state => state.getUserAsset(assetId).symbol);
  return (
    <Text color="labelTertiary" size="13pt" weight="semibold">
      {symbol}
    </Text>
  );
};

const CoinPercentChange = ({ assetId }: { assetId: UniqueId }) => {
  const isTrending = false; // fix this when implementing token to sell list

  const percentChange = useMemo(() => {
    if (isTrending) {
      const rawChange = Math.random() * 30;
      const isNegative = Math.random() < 0.2;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${rawChange.toFixed(1)}%`;

      return { change, color, prefix };
    }
  }, [isTrending]);

  if (!isTrending || !percentChange) return null;

  return (
    <Inline alignVertical="center" space={{ custom: 1 }}>
      <Text align="center" color={percentChange.color} size="12pt" weight="bold">
        {percentChange.prefix}
      </Text>
      <Text color={percentChange.color} size="13pt" weight="semibold">
        {percentChange.change}
      </Text>
    </Inline>
  );
};

const CoinIcon = ({ assetId }: { assetId: UniqueId }) => {
  const { symbol, iconUrl, address, mainnetAddress, chainId, color } = userAssetsStore(state => {
    const asset = state.getUserAsset(assetId);
    return {
      symbol: asset.symbol,
      iconUrl: asset.icon_url,
      address: asset.address,
      mainnetAddress: asset.mainnetAddress,
      chainId: asset.chainId,
      color: asset.colors?.primary ?? asset.colors?.fallback,
    };
  });
  return (
    <SwapCoinIcon
      iconUrl={iconUrl}
      address={address}
      mainnetAddress={mainnetAddress}
      large
      network={ethereumUtils.getNetworkFromChainId(chainId)}
      symbol={symbol}
      color={color}
    />
  );
};

const CoinInfoButton = ({ assetId }: { assetId: UniqueId }) => {
  return <CoinRowButton icon="􀅳" outline size="icon 14px" />;
};

const CoinFavoriteButton = ({ assetId, isFavorited }: { assetId: UniqueId; isFavorited: boolean }) => {
  const address = userAssetsStore(state => state.getUserAsset(assetId).address);
  return <CoinRowButton color={isFavorited ? '#FFCB0F' : undefined} onPress={() => toggleFavorite(address)} icon="􀋃" weight="black" />;
};

const CoinActions = ({ assetId, isFavorited }: { assetId: UniqueId; isFavorited: boolean }) => {
  return (
    <Inline space="8px">
      <CoinInfoButton assetId={assetId} />
      <CoinFavoriteButton assetId={assetId} isFavorited={isFavorited} />
    </Inline>
  );
};

const CoinBalance = ({ assetId }: { assetId: UniqueId }) => {
  const nativeBalance = userAssetsStore(state => state.getUserAsset(assetId).native.balance.display);
  return <BalancePill balance={nativeBalance} />;
};

export const CoinRow2 = React.memo(
  ({ assetId, isFavorited = false, output = false }: { assetId: string; isFavorited?: boolean; output?: boolean }) => {
    const { setAsset } = useSwapContext();

    const handleSelectToken = useCallback(() => {
      const userAsset = userAssetsStore.getState().getUserAsset(assetId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: userAsset,
        userAsset,
      });

      setAsset({
        type: SwapAssetType.inputAsset,
        asset: parsedAsset,
      });
    }, [assetId, setAsset]);

    return (
      <ButtonPressAnimation disallowInterruption onPress={handleSelectToken} scaleTo={0.95}>
        <HitSlop vertical="10px">
          <Box
            alignItems="center"
            paddingVertical="10px"
            paddingHorizontal="20px"
            flexDirection="row"
            justifyContent="space-between"
            width="full"
          >
            <Inline alignVertical="center" space="10px">
              <CoinIcon assetId={assetId} />
              <Stack space="10px">
                <CoinName assetId={assetId} />
                <Inline alignVertical="center" space={{ custom: 5 }}>
                  {!output ? <CoinUserBalance assetId={assetId} /> : <CoinSymbol assetId={assetId} />}
                  <CoinPercentChange assetId={assetId} />
                </Inline>
              </Stack>
            </Inline>
            {output ? <CoinActions assetId={assetId} isFavorited={isFavorited} /> : <CoinBalance assetId={assetId} />}
          </Box>
        </HitSlop>
      </ButtonPressAnimation>
    );
  }
);

CoinRow2.displayName = 'CoinRow';

export const styles = StyleSheet.create({
  solidColorCoinIcon: {
    opacity: 0.4,
  },
});
