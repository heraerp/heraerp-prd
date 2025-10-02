# @hera/entities-core

Core entity preset definitions and utilities for HERA Universal ERP.

## Features

- Type-safe entity preset definitions
- Smart code validation
- Overlay system for extending presets
- Mixin support for cross-cutting concerns
- Role-based policies

## Usage

```typescript
import { PRODUCT_PRESET } from '@hera/entities-core/presets';
import { withOverlay } from '@hera/entities-core/overlay';
import { withMixins, TAGGABLE } from '@hera/entities-core/mixins';

// Extend a preset with overlays
const CustomProduct = withOverlay(PRODUCT_PRESET, {
  dynamicFields: [
    { name: 'custom_field', type: 'text', smart_code: 'HERA.CUSTOM.FIELD.v1' }
  ]
});

// Add mixins for cross-cutting features
const TaggableProduct = withMixins(PRODUCT_PRESET, [TAGGABLE]);
```