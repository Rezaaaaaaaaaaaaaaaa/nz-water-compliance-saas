/**
 * Feature Flags System
 *
 * Redis-based feature flag management for gradual rollouts,
 * A/B testing, and emergency kill switches.
 */

import Redis from 'ioredis';
import { logger } from '../config/logger.js';

export interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100
  allowedOrganizations?: string[];
  allowedUsers?: string[];
  deniedOrganizations?: string[];
  deniedUsers?: string[];
  metadata?: Record<string, any>;
}

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private static prefix = 'feature:';
  private cache: Map<string, { config: FeatureFlagConfig; timestamp: number }> = new Map();
  private cacheTTL = 60000; // 1 minute

  constructor(private redis: Redis) {}

  /**
   * Generate Redis key for feature flag
   */
  private key(flag: string): string {
    return `${FeatureFlagManager.prefix}${flag}`;
  }

  /**
   * Check if feature is enabled for user/organization
   */
  async isEnabled(
    flag: string,
    context?: {
      userId?: string;
      organizationId?: string;
      email?: string;
    }
  ): Promise<boolean> {
    try {
      // Get feature configuration
      const config = await this.getConfig(flag);

      if (!config) {
        // Feature not configured, default to disabled
        return false;
      }

      // Check if globally disabled
      if (!config.enabled) {
        return false;
      }

      // Check user deny list
      if (context?.userId && config.deniedUsers?.includes(context.userId)) {
        return false;
      }

      // Check organization deny list
      if (context?.organizationId && config.deniedOrganizations?.includes(context.organizationId)) {
        return false;
      }

      // Check user allow list (takes precedence)
      if (context?.userId && config.allowedUsers?.includes(context.userId)) {
        return true;
      }

      // Check organization allow list
      if (context?.organizationId && config.allowedOrganizations?.includes(context.organizationId)) {
        return true;
      }

      // Check rollout percentage
      if (config.rolloutPercentage !== undefined) {
        if (config.rolloutPercentage === 0) {
          return false;
        }
        if (config.rolloutPercentage === 100) {
          return true;
        }

        // Use consistent hashing for stable rollout
        const hash = await this.hash(flag, context?.userId || context?.organizationId || '');
        return hash < config.rolloutPercentage;
      }

      // Default: feature is enabled globally
      return true;
    } catch (error) {
      logger.error({ error, flag, context }, 'Error checking feature flag');
      // Fail open - return false on error
      return false;
    }
  }

  /**
   * Get feature flag configuration
   */
  async getConfig(flag: string): Promise<FeatureFlagConfig | null> {
    // Check cache first
    const cached = this.cache.get(flag);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.config;
    }

    try {
      const data = await this.redis.get(this.key(flag));
      if (!data) {
        return null;
      }

      const config = JSON.parse(data) as FeatureFlagConfig;

      // Update cache
      this.cache.set(flag, { config, timestamp: Date.now() });

      return config;
    } catch (error) {
      logger.error({ error, flag }, 'Error getting feature flag config');
      return null;
    }
  }

  /**
   * Enable feature flag globally
   */
  async enable(flag: string, config?: Partial<FeatureFlagConfig>): Promise<void> {
    const fullConfig: FeatureFlagConfig = {
      enabled: true,
      rolloutPercentage: 100,
      ...config,
    };

    await this.setConfig(flag, fullConfig);
    logger.info({ flag, config: fullConfig }, 'Feature flag enabled');
  }

  /**
   * Disable feature flag globally
   */
  async disable(flag: string): Promise<void> {
    const config = await this.getConfig(flag);
    if (config) {
      config.enabled = false;
      await this.setConfig(flag, config);
    }
    logger.info({ flag }, 'Feature flag disabled');
  }

  /**
   * Set feature flag configuration
   */
  async setConfig(flag: string, config: FeatureFlagConfig): Promise<void> {
    try {
      await this.redis.set(this.key(flag), JSON.stringify(config));

      // Clear cache
      this.cache.delete(flag);

      logger.debug({ flag, config }, 'Feature flag config updated');
    } catch (error) {
      logger.error({ error, flag, config }, 'Error setting feature flag config');
      throw error;
    }
  }

  /**
   * Set rollout percentage (gradual rollout)
   */
  async setRolloutPercentage(flag: string, percentage: number): Promise<void> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    const config = await this.getConfig(flag) || { enabled: true };
    config.rolloutPercentage = percentage;

    await this.setConfig(flag, config);
    logger.info({ flag, percentage }, 'Feature flag rollout percentage updated');
  }

  /**
   * Add organization to allow list
   */
  async allowOrganization(flag: string, organizationId: string): Promise<void> {
    const config = await this.getConfig(flag) || { enabled: true };
    if (!config.allowedOrganizations) {
      config.allowedOrganizations = [];
    }
    if (!config.allowedOrganizations.includes(organizationId)) {
      config.allowedOrganizations.push(organizationId);
      await this.setConfig(flag, config);
    }
  }

  /**
   * Add user to allow list
   */
  async allowUser(flag: string, userId: string): Promise<void> {
    const config = await this.getConfig(flag) || { enabled: true };
    if (!config.allowedUsers) {
      config.allowedUsers = [];
    }
    if (!config.allowedUsers.includes(userId)) {
      config.allowedUsers.push(userId);
      await this.setConfig(flag, config);
    }
  }

  /**
   * Remove organization from allow list
   */
  async removeOrganization(flag: string, organizationId: string): Promise<void> {
    const config = await this.getConfig(flag);
    if (config?.allowedOrganizations) {
      config.allowedOrganizations = config.allowedOrganizations.filter(id => id !== organizationId);
      await this.setConfig(flag, config);
    }
  }

  /**
   * Remove user from allow list
   */
  async removeUser(flag: string, userId: string): Promise<void> {
    const config = await this.getConfig(flag);
    if (config?.allowedUsers) {
      config.allowedUsers = config.allowedUsers.filter(id => id !== userId);
      await this.setConfig(flag, config);
    }
  }

  /**
   * List all feature flags
   */
  async listFlags(): Promise<Array<{ flag: string; config: FeatureFlagConfig }>> {
    try {
      const keys = await this.redis.keys(`${FeatureFlagManager.prefix}*`);
      const flags: Array<{ flag: string; config: FeatureFlagConfig }> = [];

      for (const key of keys) {
        const flag = key.replace(FeatureFlagManager.prefix, '');
        const config = await this.getConfig(flag);
        if (config) {
          flags.push({ flag, config });
        }
      }

      return flags;
    } catch (error) {
      logger.error({ error }, 'Error listing feature flags');
      return [];
    }
  }

  /**
   * Delete feature flag
   */
  async delete(flag: string): Promise<void> {
    await this.redis.del(this.key(flag));
    this.cache.delete(flag);
    logger.info({ flag }, 'Feature flag deleted');
  }

  /**
   * Consistent hash function for rollout percentage
   */
  private async hash(flag: string, identifier: string): Promise<number> {
    const input = `${flag}:${identifier}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}

/**
 * Common feature flags
 */
export enum FeatureFlag {
  AI_COMPLIANCE_ASSISTANT = 'ai-compliance-assistant',
  AI_DOCUMENT_ANALYSIS = 'ai-document-analysis',
  AI_WATER_QUALITY = 'ai-water-quality',
  DWQAR_EXPORT = 'dwqar-export',
  ADVANCED_ANALYTICS = 'advanced-analytics',
  GEOSPATIAL_MAP = 'geospatial-map',
  PREDICTIVE_ANALYTICS = 'predictive-analytics',
  BENCHMARKING = 'benchmarking',
  WORKFLOW_AUTOMATION = 'workflow-automation',
  REAL_TIME_UPDATES = 'real-time-updates',
  CUSTOM_REPORTS = 'custom-reports',
}
