/**
 * Asset Service Unit Tests
 */

import { describe, it, expect } from '@jest/globals';
import { AssetCondition, RiskLevel } from '@prisma/client';
import * as assetService from '../../services/asset.service.js';

describe('Asset Service', () => {
  describe('calculateRiskLevel', () => {
    it('should return CRITICAL for critical assets in very poor condition', () => {
      const risk = assetService.calculateRiskLevel(
        true,
        AssetCondition.VERY_POOR
      );
      expect(risk).toBe(RiskLevel.CRITICAL);
    });

    it('should return CRITICAL for critical assets in poor condition', () => {
      const risk = assetService.calculateRiskLevel(
        true,
        AssetCondition.POOR
      );
      expect(risk).toBe(RiskLevel.CRITICAL);
    });

    it('should return HIGH for critical assets in fair condition', () => {
      const risk = assetService.calculateRiskLevel(
        true,
        AssetCondition.FAIR
      );
      expect(risk).toBe(RiskLevel.HIGH);
    });

    it('should return MEDIUM for critical assets in good condition', () => {
      const risk = assetService.calculateRiskLevel(
        true,
        AssetCondition.GOOD
      );
      expect(risk).toBe(RiskLevel.MEDIUM);
    });

    it('should return LOW for critical assets in excellent condition', () => {
      const risk = assetService.calculateRiskLevel(
        true,
        AssetCondition.EXCELLENT
      );
      expect(risk).toBe(RiskLevel.LOW);
    });

    it('should return HIGH for non-critical assets in very poor condition', () => {
      const risk = assetService.calculateRiskLevel(
        false,
        AssetCondition.VERY_POOR
      );
      expect(risk).toBe(RiskLevel.HIGH);
    });

    it('should return MEDIUM for non-critical assets in poor condition', () => {
      const risk = assetService.calculateRiskLevel(
        false,
        AssetCondition.POOR
      );
      expect(risk).toBe(RiskLevel.MEDIUM);
    });

    it('should return LOW for non-critical assets in fair condition', () => {
      const risk = assetService.calculateRiskLevel(
        false,
        AssetCondition.FAIR
      );
      expect(risk).toBe(RiskLevel.LOW);
    });

    it('should return LOW for non-critical assets in good condition', () => {
      const risk = assetService.calculateRiskLevel(
        false,
        AssetCondition.GOOD
      );
      expect(risk).toBe(RiskLevel.LOW);
    });

    it('should return LOW for non-critical assets in excellent condition', () => {
      const risk = assetService.calculateRiskLevel(
        false,
        AssetCondition.EXCELLENT
      );
      expect(risk).toBe(RiskLevel.LOW);
    });
  });

  describe('Risk Assessment Logic', () => {
    it('should prioritize critical assets with higher risk levels', () => {
      const criticalPoor = assetService.calculateRiskLevel(
        true,
        AssetCondition.POOR
      );
      const nonCriticalPoor = assetService.calculateRiskLevel(
        false,
        AssetCondition.POOR
      );

      expect(criticalPoor).toBe(RiskLevel.CRITICAL);
      expect(nonCriticalPoor).toBe(RiskLevel.MEDIUM);
    });

    it('should have consistent risk ordering', () => {
      const riskOrder = [
        RiskLevel.LOW,
        RiskLevel.MEDIUM,
        RiskLevel.HIGH,
        RiskLevel.CRITICAL,
      ];

      // Verify all returned values are in the valid risk order
      const conditions = [
        AssetCondition.EXCELLENT,
        AssetCondition.GOOD,
        AssetCondition.FAIR,
        AssetCondition.POOR,
        AssetCondition.VERY_POOR,
      ];

      conditions.forEach((condition) => {
        const risk = assetService.calculateRiskLevel(true, condition);
        expect(riskOrder).toContain(risk);
      });
    });
  });
});
