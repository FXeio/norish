import type { z } from "zod";
import type {
  BulkCreateSiteAuthTokenInputSchema,
  BulkDeleteSiteAuthTokenInputSchema,
  CreateSiteAuthTokenInputSchema,
  SiteAuthTokenDecryptedSchema,
  SiteAuthTokenSafeSchema,
  SiteAuthTokenSelectSchema,
  UpdateSiteAuthTokenInputSchema,
} from "@norish/shared/contracts/zod/site-auth-tokens";

export type SiteAuthTokenDto = z.output<typeof SiteAuthTokenSelectSchema>;
export type SiteAuthTokenDecryptedDto = z.output<typeof SiteAuthTokenDecryptedSchema>;
export type SiteAuthTokenSafeDto = z.output<typeof SiteAuthTokenSafeSchema>;
export type CreateSiteAuthTokenInputDto = z.input<typeof CreateSiteAuthTokenInputSchema>;
export type UpdateSiteAuthTokenInputDto = z.input<typeof UpdateSiteAuthTokenInputSchema>;
export type BulkCreateSiteAuthTokenInputDto = z.input<typeof BulkCreateSiteAuthTokenInputSchema>;
export type BulkDeleteSiteAuthTokenInputDto = z.input<typeof BulkDeleteSiteAuthTokenInputSchema>;
