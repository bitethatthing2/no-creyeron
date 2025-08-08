import {implementation} from 'any-promise';
import {in, Location} from 'typescript/lib/typescript';
import {in, Location} from '@ts-morph/common/lib/typescript';
import {and, not} from 'workbox-build/node_modules/ajv/compile/codegen';
import {and, not} from '../../node_modules/workbox-build/node_modules/ajv/lib/compile/codegen/index';
import {and} from '@typescript-eslint/utils/ast-utils/eslint-utils';
import {and} from '@firebase/firestore';
import {and} from '@firebase/firestore/lite';
import {and} from '@firebase/firestore/firestore';
import {and} from '@firebase/firestore/packages/firestore';
import {and} from '@firebase/firestore/lite/packages/firestore';
import {and} from '@firebase/firestore/lite/firestore';
import {state} from 'sucrase/types/parser/traverser';
import {the} from '../../node_modules/rxjs/src/internal/operators/timeInterval';
import {the} from 'next/build';
import {to, message} from '@firebase/messaging/dist/sw/private';
import {to, message} from '@firebase/messaging/dist/sw/internal';
import {to, message} from '@firebase/messaging/dist/sw/index-public';
import {to, message} from '@firebase/messaging';
import {Key} from 'react-hook-form/types/path';
import {Flow, File} from '@babel/types/lib';
import * as stream from 'stream';
import {stream} from 'micromark';
import {stream} from 'micromark/dev';
import {stream} from 'glob/commonjs';
import {stream} from 'glob/esm';
import {stream} from '@next/eslint-plugin-next/node_modules/glob/commonjs';
import {stream} from '@next/eslint-plugin-next/node_modules/glob/esm';
import {State} from 'zustand';
import {State} from 'zustand/ts3.4';
import {State} from 'zustand/esm';
import {State} from 'zustand/ts3.4/esm';
import {State} from 'tar/esm';
import {State} from 'tar/commonjs';
import {State} from 'state-local/lib/types';
import {State} from 'micromark-util-types';
import {State, Element} from 'mdast-util-to-hast/lib';
import {State} from 'mdast-util-to-markdown/lib';
import {State, Element} from 'mdast-util-to-hast/lib/handlers';
import {State} from 'hast-util-to-jsx-runtime/lib';
import {State} from 'fast-equals';
import {State} from '../../node_modules/fast-equals/src/internalTypes';
import {State} from 'fast-equals/min/types';
import {State} from 'fast-equals/cjs/types';
import {errorMessage} from 'napi-postinstall/lib';
import {error} from '../../node_modules/workbox-build/node_modules/ajv/lib/vocabularies/jtd/properties';
import {error} from '../../node_modules/workbox-build/node_modules/ajv/lib/vocabularies/applicator/dependencies';
import {error, Error} from 'workbox-build/node_modules/ajv/vocabularies/jtd';
import {error} from 'workbox-build/node_modules/ajv/vocabularies/applicator';
import {error} from 'next/build/output';
import {error} from 'eslint-plugin-react';
import {error} from '@firebase/database';
import {error} from '@firebase/database/node-esm';
import {Element} from 'domhandler/lib';
import {Element} from 'domhandler/lib/esm';
import {Element} from '@eslint-community/regexpp';
import {Ref} from 'react-hook-form/types';
import {callback} from 'fdir';
import {Wait, Always, File} from '../../node_modules/openai/src/resources/responses/responses';
import {Use} from 'trough';
import {Use} from 'trough/lib';
import {Error, NotFoundError} from '../../node_modules/workbox-build/node_modules/ajv/lib/vocabularies/jtd/error';
import {Error} from '../../node_modules/openai/src/resources/fine-tuning/jobs/jobs';
import {Error} from '../../node_modules/openai/src/resources/beta/realtime/realtime';
import {Error} from 'es-errors';
import {Error} from '@firebase/auth-types';
import {these} from '@firebase/auth/web-extension-cjs/core';
import {these} from '@firebase/auth/web-extension-esm2017/core';
import {these} from '@firebase/auth/rn/core';
import {these} from '@firebase/auth/node-esm/core';
import {these} from '@firebase/auth/core';
import {these} from '@firebase/auth/node/core';
import {these} from '@firebase/auth/cordova/core';
import {these} from '@firebase/auth/esm5/core';
import {these} from '@firebase/auth/esm2017/core';
import {these} from '@firebase/auth/browser-cjs/core';
import {Permission} from '../../lib/services/auth-service';
import {NotFoundError} from 'openai';
import {NotFoundError} from '../../lib/services/wolfpack/errors';
import {app} from 'workbox-cli/build/app';
import {app} from 'firebase-admin/lib';
import {be} from 'date-fns';
import {not} from '../../node_modules/rxjs/src/internal/util/not';
import {not} from 'rxjs';
import {with} from '../../types/features/database-overrides';
import {with} from 'long';
import {with} from 'long/umd';
import {with} from 'acorn/dist/acorn';
import {retry, File} from 'undici-types';
import {retry, File} from 'undici/types';
import {retry} from '../../node_modules/rxjs/src/internal/operators/retry';
import {retry} from 'rxjs/internal/operators';
import {retry} from 'next/compiled/@next/font/google';
import {Component} from 'framer-motion';
import {Component} from '@firebase/component';
import {on} from 'next/client';
import {File} from 'sucrase/types/parser';
import {File} from 'openai/_shims';
import {File} from 'openai/node_modules/undici-types';
import {File} from '../../node_modules/openai/src/_shims/registry';
import {File} from '../../node_modules/openai/src/resources/chat/completions/completions';
import {File} from 'formdata-node/@type';
import {File} from 'fetch-blob';
import {Location} from '@firebase/storage';
import {Location} from '@firebase/storage/node-esm';
import {Location} from '../../lib/supabase/types';
import {Version} from 'firebase-admin/lib/remote-config';
import {Version} from 'eslint-import-resolver-typescript/lib';
import {Version} from '@emnapi/runtime/dist/emnapi';
import {Version} from '@emnapi/runtime/dist/emnapi.cjs.min';

# PostCreator Camera Implementation Guide

## ⚠️ CRITICAL: Do NOT modify camera logic without reading this guide

The camera implementation in `PostCreator.tsx` is working correctly after fixing several critical timing and state management issues. This guide documents the working implementation to prevent future regressions.

## Key Working Principles

### 1. Camera Initialization Flow

```
isOpen=true → useEffect triggers → startCamera() → getUserMedia → stream assigned → video element receives stream
```

**CRITICAL:** Camera starts immediately when `isOpen=true`, NOT when video element is ready. This prevents race conditions.

### 2. State Management

- `cameraStatus`: 'idle' | 'loading' | 'ready' | 'error'
- `hasStream`: boolean (true when stream is active)
- `errorMessage`: string (specific error descriptions)

### 3. Video Element Ref Management

```typescript
const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
  videoRef.current = element;
  
  // Only apply existing stream, don't start camera here
  if (element && streamRef.current) {
    element.srcObject = streamRef.current;
    setHasStream(true);
    setCameraStatus('ready');
  }
}, []); // No dependencies - prevents circular calls
```

## Common Pitfalls to Avoid

### ❌ DON'T: Start camera in setVideoRef callback

```typescript
// BAD - causes race conditions
const setVideoRef = useCallback((element) => {
  if (element && isOpen) {
    startCamera(); // DON'T DO THIS
  }
}, [isOpen]); // Creates circular dependency
```

### ❌ DON'T: Wait for video element before starting camera

```typescript
// BAD - causes timing issues
useEffect(() => {
  if (isOpen && videoRef.current) { // DON'T CHECK videoRef.current
    startCamera();
  }
}, [isOpen]);
```

### ❌ DON'T: Use generic error handling

```typescript
// BAD - doesn't help users
catch (error) {
  console.error('Camera failed'); // Too generic
}
```

## Error Handling Requirements

Always handle these specific `getUserMedia` errors:

1. **NotAllowedError**: Permission denied
2. **NotFoundError**: No camera hardware
3. **NotReadableError**: Camera in use by another app
4. **OverconstrainedError**: Constraints can't be satisfied

## UI States

1. **idle**: Initial state, shows "Camera not ready"
2. **loading**: Shows spinner, "Starting camera..."
3. **ready**: Shows video stream
4. **error**: Shows specific error message with retry button

## Testing Checklist

Before making camera changes, test:

- [ ] Camera starts when component opens
- [ ] Camera stops when component closes
- [ ] Error handling for denied permissions
- [ ] Error handling for camera in use
- [ ] Loading state appears briefly
- [ ] Manual retry button works
- [ ] Video stream appears correctly
- [ ] Component cleanup on unmount

## File Location

`components/wolfpack/PostCreator.tsx`

## Last Working Version

Fixed on: 2025-07-19
Key fixes: Timing issues, error handling, state management

---

**Remember: If camera breaks again, the issue is likely timing/state related, not permissions.**
