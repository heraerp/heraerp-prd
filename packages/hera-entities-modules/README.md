# @hera/entities-modules

Industry-specific entity preset overlays for HERA Universal ERP.

## Modules

- **salon** - Hair salon and beauty industry presets
- **jewelry** - Jewelry and gemstone industry presets

## Usage

```typescript
import { salon, jewelry } from '@hera/entities-modules';

// Use salon-specific product preset
const { SALON_PRODUCT } = salon;

// Use jewelry-specific product with tagging support
const { JEWELRY_PRODUCT } = jewelry;
```