import { IS_IOS } from '@/env';

const Routes = {
  ADD_CASH_SCREEN_NAVIGATOR: 'AddCashSheetNavigator',
  ADD_CASH_SHEET: 'AddCashSheet',
  ADD_WALLET_NAVIGATOR: 'AddWalletNavigator',
  ADD_WALLET_SHEET: 'AddWalletSheet',
  APP_ICON_UNLOCK_SHEET: 'AppIconUnlockSheet',
  AVATAR_BUILDER: 'AvatarBuilder',
  AVATAR_BUILDER_WALLET: 'AvatarBuilderWallet',
  BACKUP_SCREEN: 'BackupScreen',
  BACKUP_SHEET: 'BackupSheet',
  CHANGE_WALLET_SHEET: 'ChangeWalletSheet',
  CHANGE_WALLET_SHEET_NAVIGATOR: 'ChangeWalletSheetNavigator',
  CHECK_IDENTIFIER_SCREEN: 'CheckIdentifierScreen',
  CLAIM_CLAIMABLE_PANEL: 'ClaimClaimablePanel',
  CONFIRM_REQUEST: 'ConfirmRequest',
  CONNECTED_DAPPS: 'ConnectedDapps',
  CONSOLE_SHEET: 'ConsoleSheet',
  CURRENCY_SELECT_SCREEN: 'CurrencySelectScreen',
  DAPP_BROWSER_SCREEN: 'DappBrowserScreen',
  DAPP_BROWSER: 'DappBrowser',
  SWAP: 'Swap',
  DIAGNOSTICS_SHEET: 'DiagnosticsSheet',
  DISCOVER_SCREEN: 'DiscoverScreen',
  ENS_ADDITIONAL_RECORDS_SHEET: 'ENSAdditionalRecordsSheet',
  ENS_ASSIGN_RECORDS_SHEET: 'ENSAssignRecordsSheet',
  ENS_CONFIRM_REGISTER_SHEET: 'ENSConfirmRegisterSheet',
  ENS_INTRO_SHEET: 'ENSIntroSheet',
  ENS_SEARCH_SHEET: 'ENSSearchSheet',
  EXPANDED_ASSET_SCREEN: 'ExpandedAssetScreen',
  EXPANDED_ASSET_SHEET: 'ExpandedAssetSheet',
  EXPLAIN_SHEET: 'ExplainSheet',
  PORTAL: 'Portal',
  EXTERNAL_LINK_WARNING_SHEET: 'ExternalLinkWarningSheet',
  HARDWARE_WALLET_TX_NAVIGATOR: 'HardwareWalletTxNavigator',
  IMPORT_OR_WATCH_WALLET_SHEET: 'ImportOrWatchWalletSheet',
  IMPORT_SCREEN: 'ImportScreen',
  LEARN_WEB_VIEW_SCREEN: 'LearnWebViewScreen',
  POAP_SHEET: 'PoapSheet',
  MINT_SHEET: 'MintSheet',
  MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR: 'MainNativeBottomSheetNavigation',
  MAIN_NAVIGATOR: 'MainNavigator',
  MAIN_NAVIGATOR_WRAPPER: 'MainNavigatorWrapper',
  MINTS_SHEET: 'MintsSheet',
  MODAL_SCREEN: 'ModalScreen',
  NATIVE_STACK: 'NativeStack',
  NETWORK_SWITCHER: 'NetworkSection',
  NFT_OFFERS_SHEET: 'NFTOffersSheet',
  NFT_SINGLE_OFFER_SHEET: 'NFTSingleOfferSheet',
  NOTIFICATIONS_PROMO_SHEET: 'NotificationsPromoSheet',
  OP_REWARDS_SHEET: 'OpRewardsSheet',
  PAIR_HARDWARE_WALLET_AGAIN_SHEET: 'PairHardwareWalletAgainSheet',
  PAIR_HARDWARE_WALLET_ERROR_SHEET: 'PairHardwareWalletErrorSheet',
  PAIR_HARDWARE_WALLET_INTRO_SHEET: 'PairHardwareWalletIntroSheet',
  PAIR_HARDWARE_WALLET_NAVIGATOR: 'PairHardwareWalletNavigator',
  PAIR_HARDWARE_WALLET_SEARCH_SHEET: 'PairHardwareWalletSearchSheet',
  PAIR_HARDWARE_WALLET_SIGNING_SHEET: 'PairHardwareWalletSigningSheet',
  PAIR_HARDWARE_WALLET_SUCCESS_SHEET: 'PairHardwareWalletSuccessSheet',
  PIN_AUTHENTICATION_SCREEN: 'PinAuthenticationScreen',
  POINTS_SCREEN: 'PointsScreen',
  POSITION_SHEET: 'PositionSheet',
  PROFILE_PREVIEW_SHEET: 'ProfilePreviewSheet',
  PROFILE_SCREEN: 'ProfileScreen',
  PROFILE_SHEET: 'ProfileSheet',
  QR_SCANNER_SCREEN: 'QRScannerScreen',
  RECEIVE_MODAL: 'ReceiveModal',
  REGISTER_ENS_NAVIGATOR: 'RegisterEnsNavigator',
  REMOTE_PROMO_SHEET: 'RemotePromoSheet',
  CHOOSE_BACKUP_SHEET: 'ChooseBackupSheet',
  RESTORE_CLOUD_SHEET: 'RestoreCloudSheet',
  RESTORE_SHEET: 'RestoreSheet',
  SELECT_ENS_SHEET: 'SelectENSSheet',
  SELECT_UNIQUE_TOKEN_SHEET: 'SelectUniqueTokenSheet',
  SEND_CONFIRMATION_SHEET: 'SendConfirmationSheet',
  SEND_SHEET: 'SendSheet',
  SEND_SHEET_NAVIGATOR: 'SendSheetNavigator',
  SETTINGS_SHEET: 'SettingsSheet',
  SHOWCASE_SHEET: 'ShowcaseSheet',
  SPEED_UP_AND_CANCEL_BOTTOM_SHEET: 'SpeedUpAndCancelBootomSheet',
  SPEED_UP_AND_CANCEL_SHEET: 'SpeedUpAndCancelSheet',
  STACK: 'Stack',
  SWAPS_PROMO_SHEET: 'SwapsPromoSheet',
  SWAP_DETAILS_SHEET: 'SwapDetailsSheet',
  SWAP_SETTINGS_SHEET: 'SwapSettingsSheet',
  SWIPE_LAYOUT: 'SwipeLayout',
  TRANSACTION_DETAILS: 'TransactionDetails',
  NO_NEED_WC_SHEET: 'NoNeedWCSheet',
  WALLET_CONNECT_APPROVAL_SHEET: 'WalletConnectApprovalSheet',
  WALLET_CONNECT_REDIRECT_SHEET: 'WalletConnectRedirectSheet',
  WALLET_NOTIFICATIONS_SETTINGS: 'WalletNotificationsSettings',
  WALLET_SCREEN: 'WalletScreen',
  WELCOME_SCREEN: 'WelcomeScreen',

  SETTINGS_SECTION: 'SettingsSection',
  SETTINGS_WALLET_NOTIFICATIONS: 'WalletNotificationsSettings',
  SETTINGS_BACKUP_VIEW: 'ViewWalletBackup',
  SETTINGS_SECTION_APP_ICON: 'AppIconSection',
  SETTINGS_SECTION_BACKUP: 'BackupSection',
  SETTINGS_SECTION_CURRENCY: 'CurrencySection',
  SETTINGS_SECTION_DEV: 'DevSection',
  SETTINGS_SECTION_LANGUAGE: 'LanguageSection',
  SETTINGS_SECTION_NETWORK: 'NetworkSection',
  SETTINGS_SECTION_NOTIFICATIONS: 'NotificationsSection',
  SETTINGS_SECTION_PRIVACY: 'PrivacySection',
  DAPP_BROWSER_CONTROL_PANEL: 'DappBrowserControlPanel',
  CLAIM_REWARDS_PANEL: 'ClaimRewardsPanel',
} as const;

export const NATIVE_ROUTES = [
  Routes.RECEIVE_MODAL,
  Routes.SETTINGS_SHEET,
  Routes.EXPANDED_ASSET_SHEET,
  Routes.CHANGE_WALLET_SHEET,
  Routes.MODAL_SCREEN,
  ...(IS_IOS ? [Routes.SEND_SHEET_NAVIGATOR, Routes.ADD_CASH_SCREEN_NAVIGATOR] : []),
];

const RoutesWithPlatformDifferences = {
  ...Routes,
  SEND_FLOW: Routes.SEND_SHEET_NAVIGATOR,
};

export default RoutesWithPlatformDifferences;
