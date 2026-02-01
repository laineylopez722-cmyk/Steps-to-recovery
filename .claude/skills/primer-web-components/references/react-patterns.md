# React Integration Patterns for Primer Web Components

## React 19 vs React 18 Integration

### React 19 (Recommended)

React 19 natively supports passing object props to web components via JSX.

**TypeScript Setup:**

```typescript
import { CustomElements } from '@primer-io/primer-js/dist/jsx/index';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends CustomElements {}
  }
}
```

**Component Example:**

```typescript
const SDK_OPTIONS = { locale: 'en-GB' };

function CheckoutPage({ clientToken }: { clientToken: string }) {
  return (
    <primer-checkout
      client-token={clientToken}
      options={SDK_OPTIONS}
    />
  );
}
```

### React 18 (Legacy)

React 18 requires imperative property assignment via refs.

**Component Example:**

```typescript
import { useRef, useEffect } from 'react';

const SDK_OPTIONS = { locale: 'en-GB' };

function CheckoutPage({ clientToken }: { clientToken: string }) {
  const checkoutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkout = checkoutRef.current;
    if (!checkout) return;

    // Imperative property assignment
    checkout.options = SDK_OPTIONS;

    // Event listeners
    const handleReady = () => console.log('SDK ready');
    checkout.addEventListener('primer:ready', handleReady);

    return () => {
      checkout.removeEventListener('primer:ready', handleReady);
    };
  }, []);

  return (
    <primer-checkout
      ref={checkoutRef}
      client-token={clientToken}
    />
  );
}
```

## Critical Pattern: Stable Object References

**THE PROBLEM:** Creating new object references on every render causes web components to re-initialize, losing user input and state.

### ❌ WRONG - Causes Re-initialization

```typescript
// WRONG: New object every render
function CheckoutPage() {
  return <primer-checkout options={{ locale: 'en-GB' }} />;
}

// WRONG: New object in component body
function CheckoutPage() {
  const options = { locale: 'en-GB' }; // New object every render!
  return <primer-checkout options={options} />;
}
```

### ✅ CORRECT - Stable References

**Pattern 1: Module-level constant (static options)**

```typescript
const SDK_OPTIONS = {
  locale: 'en-GB',
  paymentMethodOptions: {
    PAYMENT_CARD: {
      requireCVV: true,
      requireBillingAddress: true,
    },
  },
};

function CheckoutPage({ clientToken }: { clientToken: string }) {
  return (
    <primer-checkout
      client-token={clientToken}
      options={SDK_OPTIONS}
    />
  );
}
```

**Pattern 2: useMemo (dynamic options)**

```typescript
import { useMemo } from 'react';

function CheckoutPage({
  clientToken,
  userLocale,
  merchantName
}: CheckoutPageProps) {
  const sdkOptions = useMemo(
    () => ({
      locale: userLocale,
      paymentMethodOptions: {
        APPLE_PAY: {
          merchantName: merchantName,
          merchantCountryCode: 'GB',
        },
      },
    }),
    [userLocale, merchantName] // Only recreate when deps change
  );

  return (
    <primer-checkout
      client-token={clientToken}
      options={sdkOptions}
    />
  );
}
```

**Pattern 3: useMemo with empty deps (constant within component)**

```typescript
function CheckoutPage() {
  const options = useMemo(() => ({ locale: 'en-GB' }), []);
  return <primer-checkout options={options} />;
}
```

## Event Handling in React

### React 19

```typescript
function CheckoutPage({ clientToken }: { clientToken: string }) {
  const checkoutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkout = checkoutRef.current;
    if (!checkout) return;

    const handleStateChange = (event: CustomEvent) => {
      const { isProcessing, isSuccessful, primerJsError, paymentFailure } = event.detail;
      console.log('State:', { isProcessing, isSuccessful, primerJsError, paymentFailure });
    };

    checkout.addEventListener('primer:state-change', handleStateChange);

    return () => {
      checkout.removeEventListener('primer:state-change', handleStateChange);
    };
  }, []);

  return (
    <primer-checkout
      ref={checkoutRef}
      client-token={clientToken}
      options={SDK_OPTIONS}
    />
  );
}
```

### Dynamic Payment Method Handling

```typescript
function CheckoutPage() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const checkoutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkout = checkoutRef.current;
    if (!checkout) return;

    const handleMethodsUpdate = (event: CustomEvent) => {
      const methods = event.detail.toArray();
      setPaymentMethods(methods);
    };

    checkout.addEventListener('primer:methods-update', handleMethodsUpdate);

    return () => {
      checkout.removeEventListener('primer:methods-update', handleMethodsUpdate);
    };
  }, []);

  return (
    <primer-checkout ref={checkoutRef} client-token={clientToken}>
      <primer-main slot="main">
        <div slot="payments">
          {paymentMethods.map(({ type }) => (
            <primer-payment-method key={type} type={type} />
          ))}
        </div>
      </primer-main>
    </primer-checkout>
  );
}
```

### Payment Lifecycle Event Handling (New in v0.7.0)

```typescript
function CheckoutPage({ clientToken }: { clientToken: string }) {
  const checkoutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkout = checkoutRef.current;
    if (!checkout) return;

    // Set up callbacks via primer:ready
    const handleReady = (event: CustomEvent) => {
      const primer = event.detail;

      primer.onPaymentSuccess = ({ paymentSummary, paymentMethodType }) => {
        console.log('✅ Payment successful');
        console.log(`${paymentSummary.network} ending in ${paymentSummary.last4Digits}`);
        // Navigate to success page
      };

      primer.onPaymentFailure = ({ error, paymentMethodType }) => {
        console.error('❌ Payment failed:', error.message);
        console.error('Diagnostics ID:', error.diagnosticsId);
        // Show error to user
      };

      primer.onVaultedMethodsUpdate = ({ vaultedPayments }) => {
        console.log(`${vaultedPayments.size()} saved payment methods`);
      };
    };

    checkout.addEventListener('primer:ready', handleReady);

    return () => {
      checkout.removeEventListener('primer:ready', handleReady);
    };
  }, []);

  return (
    <primer-checkout
      ref={checkoutRef}
      client-token={clientToken}
      options={SDK_OPTIONS}
    />
  );
}
```

Alternatively, you can use events directly:

```typescript
function CheckoutPage() {
  useEffect(() => {
    const handlePaymentSuccess = (event: CustomEvent) => {
      const { paymentSummary, paymentMethodType, timestamp } = event.detail;
      console.log('Payment successful!');
      // Handle success
    };

    const handlePaymentFailure = (event: CustomEvent) => {
      const { error, paymentMethodType } = event.detail;
      console.error('Payment failed:', error.message);
      // Handle failure
    };

    document.addEventListener('primer:payment-success', handlePaymentSuccess);
    document.addEventListener('primer:payment-failure', handlePaymentFailure);

    return () => {
      document.removeEventListener('primer:payment-success', handlePaymentSuccess);
      document.removeEventListener('primer:payment-failure', handlePaymentFailure);
    };
  }, []);

  // ...
}
```

## Server-Side Rendering (SSR) Support

### Next.js App Router (13+)

```typescript
'use client';

import { useEffect } from 'react';
import { loadPrimer } from '@primer-io/primer-js';

export default function CheckoutPage() {
  useEffect(() => {
    try {
      loadPrimer();
      console.log('✅ Primer loaded');
    } catch (error) {
      console.error('❌ Primer loading failed:', error);
    }
  }, []);

  return (
    <div>
      <primer-checkout client-token="your-client-token">
        {/* Checkout content */}
      </primer-checkout>
    </div>
  );
}
```

### SvelteKit

```javascript
<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  onMount(async () => {
    if (browser) {
      try {
        const { loadPrimer } = await import('@primer-io/primer-js');
        loadPrimer();
        console.log('✅ Primer loaded');
      } catch (error) {
        console.error('❌ Failed to load Primer:', error);
      }
    }
  });
</script>

<div>
  <primer-checkout client-token="your-client-token">
    <!-- Checkout content -->
  </primer-checkout>
</div>
```

## Custom Hooks

### usePrimerDropIn Hook (Legacy Universal Checkout API)

**⚠️ IMPORTANT:** This hook uses the legacy `Primer.showUniversalCheckout()` API, which is NOT part of the Primer Web Components API documented in this skill. This hook is provided for reference only if you need to work with the older Universal Checkout integration.

For web components, use the patterns shown in the "Event Handling in React" section above instead.

```typescript
'use client';
import { Primer, PrimerCheckout } from '@primer-io/checkout-web';
import { useCallback, useEffect, useState, useRef } from 'react';

interface UsePrimerDropInOptions {
  clientToken?: string | null;
  containerId?: string;
  onCheckoutComplete?: (data: any) => void;
}

export function usePrimerDropIn({
  clientToken,
  containerId = 'container',
  onCheckoutComplete,
}: UsePrimerDropInOptions = {}) {
  const primerInstanceRef = useRef<PrimerCheckout | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const previousTokenRef = useRef<string | null | undefined>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clientToken || typeof window === 'undefined') return;

    if (clientToken === previousTokenRef.current && primerInstanceRef.current) {
      return;
    }

    if (isInitializingRef.current) {
      return;
    }

    isInitializingRef.current = true;
    setIsLoading(true);
    setError(null);

    const initialize = async () => {
      try {
        if (primerInstanceRef.current) {
          await primerInstanceRef.current.teardown();
          primerInstanceRef.current = null;
        }

        const checkout = await Primer.showUniversalCheckout(clientToken, {
          container: `#${containerId}`,
          onCheckoutComplete: (data: any) => {
            setIsSuccess(true);
            setIsLoading(false);
            if (onCheckoutComplete) {
              onCheckoutComplete(data);
            }
          },
          onCheckoutFail: (err: any, data: any, handler: any) => {
            setError(err as Error);
            setIsLoading(false);
            return handler?.showErrorMessage();
          },
        });

        if (!checkout) {
          throw new Error('Failed to create drop-in checkout');
        }

        primerInstanceRef.current = checkout;
        previousTokenRef.current = clientToken;
      } catch (err) {
        setError(err as Error);
        primerInstanceRef.current = null;
      } finally {
        setIsLoading(false);
        isInitializingRef.current = false;
      }
    };

    initialize();

    return () => {
      if (primerInstanceRef.current) {
        primerInstanceRef.current.teardown();
      }
    };
  }, [clientToken, containerId, onCheckoutComplete]);

  const resetPrimerInstance = useCallback(async () => {
    if (isInitializingRef.current) return;

    setIsLoading(true);
    try {
      if (primerInstanceRef.current) {
        await primerInstanceRef.current.teardown();
      }
    } catch (err) {
      console.error('Error tearing down Primer checkout:', err);
    } finally {
      primerInstanceRef.current = null;
      previousTokenRef.current = null;
      isInitializingRef.current = false;
      setIsSuccess(false);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  return {
    dropInCheckout: primerInstanceRef.current,
    isLoading,
    isSuccess,
    error,
    resetPrimerInstance,
  };
}
```

**Usage:**

```typescript
import { usePrimerDropIn } from '@/hooks/usePrimerDropIn';
import { useRouter } from 'next/navigation';

function CheckoutComponent({ clientToken }: { clientToken: string | null }) {
  const router = useRouter();

  const { isLoading, isSuccess, error, resetPrimerInstance } = usePrimerDropIn({
    clientToken,
    containerId: 'primer-checkout-container',
    onCheckoutComplete: (data) => {
      console.log('Payment completed!', data);
      setTimeout(() => router.push('/success'), 2000);
    },
  });

  return (
    <div>
      {isLoading && <div>Processing payment...</div>}
      {error && (
        <div>
          <p>Error: {String(error)}</p>
          <button onClick={resetPrimerInstance}>Try again</button>
        </div>
      )}
      {isSuccess && <div>Payment successful!</div>}
      {!error && !isSuccess && (
        <div id="primer-checkout-container"></div>
      )}
    </div>
  );
}
```

## Preventing Flash of Undefined Components

### CSS Approach

```css
primer-checkout:has(:not(:defined)) {
  visibility: hidden;
}
```

### JavaScript Approach

```javascript
Promise.allSettled([
  customElements.whenDefined('primer-checkout'),
  customElements.whenDefined('primer-payment-method'),
]).then(() => {
  document.querySelector('.checkout-container').classList.add('ready');
});
```

```css
.checkout-container {
  opacity: 0;
  transition: opacity 0.2s;
}

.checkout-container.ready {
  opacity: 1;
}
```
