/**
 * React Query API Hooks
 *
 * Central export point for all API hooks
 */

// Auth hooks
export {
  authKeys,
  useCurrentUser,
  useLogin,
  useRegister,
  useLogout,
  useRefreshUser,
} from './useAuth';

// Asset hooks
export {
  assetKeys,
  useAssets,
  useAsset,
  useAssetStatistics,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from './useAssets';

// Document hooks
export {
  documentKeys,
  useDocuments,
  useDocument,
  useDocumentDownloadUrl,
  useRequestUploadUrl,
  useCreateDocument,
  useDeleteDocument,
  useUploadDocument,
} from './useDocuments';

// DWSP hooks
export {
  dwspKeys,
  useDwsps,
  useDwsp,
  useCreateDwsp,
  useUpdateDwsp,
  useValidateDwsp,
  useSubmitDwsp,
  useDeleteDwsp,
} from './useDwsp';

// Report hooks
export {
  reportKeys,
  useReports,
  useReport,
  useMonthlyReport,
  useQuarterlyReport,
  useAnnualReport,
  useCreateReport,
  useSubmitReport,
  useDeleteReport,
} from './useReports';

// Analytics hooks
export {
  analyticsKeys,
  useDashboardAnalytics,
  useComplianceAnalytics,
  useAssetAnalytics,
  useDocumentAnalytics,
  useActivityTimeline,
  useDwspTrends,
  useUserActivity,
  useSystemAnalytics,
} from './useAnalytics';
