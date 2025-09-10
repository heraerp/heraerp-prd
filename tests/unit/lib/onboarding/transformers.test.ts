/**
 * Unit tests for HERA Onboarding transformers
 */

import { describe, it, expect } from 'vitest';
import { toJoyrideSteps, validateTour, extractRouteMap, extractWaitMap, filterSteps } from '../transformers';
import { lightTheme } from '../themes';
import type { HeraStep, HeraTour } from '../types';

describe('Transformers', () => {
  const mockSteps: HeraStep[] = [
    {
      smartCode: 'HERA.UI.ONBOARD.TEST.STEP1.v1',
      selector: '.test-element',
      titleKey: 'test.title',
      bodyKey: 'test.body',
      placement: 'bottom',
      spotlightPadding: 10,
    },
    {
      smartCode: 'HERA.UI.ONBOARD.TEST.STEP2.v1',
      selector: '.test-element-2',
      titleKey: 'test.title2',
      bodyKey: 'test.body2',
      placement: 'top',
      route: '/test-route',
      waitFor: '.wait-element',
    },
  ];

  const mockMessages = {
    'test.title': 'Test Title',
    'test.body': 'Test Body',
    'test.title2': 'Test Title 2',
    'test.body2': 'Test Body 2',
    'ui.onboard.controls.next': 'Next',
    'ui.onboard.controls.back': 'Back',
    'ui.onboard.controls.close': 'Close',
    'ui.onboard.controls.skip': 'Skip',
    'ui.onboard.controls.last': 'Finish',
    'ui.onboard.controls.open': 'Open',
    'ui.onboard.progress.step': 'Step {{current}} of {{total}}',
  };

  describe('toJoyrideSteps', () => {
    it('should transform HERA steps to Joyride steps', () => {
      const result = toJoyrideSteps(mockSteps, mockMessages, lightTheme);
      
      expect(result).toHaveLength(2);
      expect(result[0].target).toBe('.test-element');
      expect(result[0].placement).toBe('bottom');
      expect(result[0].spotlightPadding).toBe(10);
      expect(result[0].locale.next).toBe('Next');
      expect(result[0].data.smartCode).toBe('HERA.UI.ONBOARD.TEST.STEP1.v1');
    });

    it('should include progress indicator in content', () => {
      const result = toJoyrideSteps(mockSteps, mockMessages, lightTheme);
      const content = result[0].content as React.ReactElement;
      
      expect(content.props.className).toBe('hera-onboarding-content');
      expect(content.props.children).toHaveLength(3); // progress, title, body
    });

    it('should hide skip button on last step', () => {
      const result = toJoyrideSteps(mockSteps, mockMessages, lightTheme);
      
      expect(result[0].showSkipButton).toBe(true);
      expect(result[1].showSkipButton).toBe(false);
    });
  });

  describe('validateTour', () => {
    it('should validate a valid tour', () => {
      const validTour: HeraTour = {
        tourSmartCode: 'HERA.UI.ONBOARD.TEST.v1',
        steps: mockSteps,
      };
      
      expect(() => validateTour(validTour)).not.toThrow();
    });

    it('should throw for missing tour Smart Code', () => {
      const invalidTour = {
        tourSmartCode: '',
        steps: mockSteps,
      } as HeraTour;
      
      expect(() => validateTour(invalidTour)).toThrow('Tour must have a Smart Code');
    });

    it('should throw for empty steps', () => {
      const invalidTour: HeraTour = {
        tourSmartCode: 'HERA.UI.ONBOARD.TEST.v1',
        steps: [],
      };
      
      expect(() => validateTour(invalidTour)).toThrow('Tour must have at least one step');
    });

    it('should throw for invalid step Smart Code format', () => {
      const invalidSteps: HeraStep[] = [{
        ...mockSteps[0],
        smartCode: 'INVALID.CODE' as any,
      }];
      
      const invalidTour: HeraTour = {
        tourSmartCode: 'HERA.UI.ONBOARD.TEST.v1',
        steps: invalidSteps,
      };
      
      expect(() => validateTour(invalidTour)).toThrow('invalid Smart Code format');
    });
  });

  describe('extractRouteMap', () => {
    it('should extract routes from steps', () => {
      const routeMap = extractRouteMap(mockSteps);
      
      expect(routeMap.size).toBe(1);
      expect(routeMap.get(1)).toBe('/test-route');
      expect(routeMap.has(0)).toBe(false);
    });

    it('should handle function routes', () => {
      const routeFunc = async (router: any) => { await router.push('/test'); };
      const stepsWithFunc: HeraStep[] = [{
        ...mockSteps[0],
        route: routeFunc,
      }];
      
      const routeMap = extractRouteMap(stepsWithFunc);
      expect(routeMap.get(0)).toBe(routeFunc);
    });
  });

  describe('extractWaitMap', () => {
    it('should extract wait conditions from steps', () => {
      const waitMap = extractWaitMap(mockSteps);
      
      expect(waitMap.size).toBe(1);
      expect(waitMap.get(1)).toBe('.wait-element');
      expect(waitMap.has(0)).toBe(false);
    });

    it('should handle function wait conditions', () => {
      const waitFunc = () => true;
      const stepsWithFunc: HeraStep[] = [{
        ...mockSteps[0],
        waitFor: waitFunc,
      }];
      
      const waitMap = extractWaitMap(stepsWithFunc);
      expect(waitMap.get(0)).toBe(waitFunc);
    });
  });

  describe('filterSteps', () => {
    it('should filter steps based on predicate', () => {
      const filtered = filterSteps(mockSteps, (step) => step.placement === 'bottom');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].smartCode).toBe('HERA.UI.ONBOARD.TEST.STEP1.v1');
      expect(filtered[0].stepIndex).toBe(0);
    });

    it('should reindex filtered steps', () => {
      const filtered = filterSteps(mockSteps, (step, index) => index > 0);
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].stepIndex).toBe(0);
    });
  });
});