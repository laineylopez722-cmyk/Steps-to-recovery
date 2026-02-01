# Primer Web Components - Component Reference

## Core Components

### `<primer-checkout>`

The root component that initializes the Primer SDK and manages the checkout flow.

**Required Attributes:**

- `client-token` - JWT token from backend client session

**Optional Attributes:**

- `custom-styles` - JSON string of CSS custom properties
- `loader-disabled` - Boolean to disable loading indicator

**Properties (set via JavaScript):**

- `options` - SDK configuration object (locale, payment methods, etc.)

**Example:**

```html
<primer-checkout client-token="eyJ0eXAiOiJKV1QiLCJhbGc...">
  <primer-main slot="main">
    <!-- Content -->
  </primer-main>
</primer-checkout>
```

### `<primer-main>`

Container for checkout content with predefined slots for different states.

**Slots:**

- `payments` - Main payment method selection area
- `checkout-complete` - Success state content
- `checkout-failure` - Error state content

**Example:**

```html
<primer-main slot="main">
  <div slot="payments">
    <primer-payment-method type="PAYMENT_CARD"></primer-payment-method>
  </div>
  <div slot="checkout-complete">
    <h2>Payment Successful!</h2>
  </div>
</primer-main>
```

### `<primer-payment-method>`

Displays a specific payment method.

**Attributes:**

- `type` - Payment method type (PAYMENT_CARD, PAYPAL, APPLE_PAY, GOOGLE_PAY, etc.)
- `disabled` - Boolean to disable the payment method

**Example:**

```html
<primer-payment-method type="PAYMENT_CARD"></primer-payment-method>
<primer-payment-method type="PAYPAL"></primer-payment-method>
<primer-payment-method type="GOOGLE_PAY" disabled></primer-payment-method>
```

### `<primer-payment-method-container>`

Declarative container for automatically rendering filtered payment methods.

**Attributes:**

- `include` - Comma-separated list of payment method types to include
- `exclude` - Comma-separated list of payment method types to exclude

**Example:**

```html
<!-- Show only digital wallets -->
<primer-payment-method-container include="APPLE_PAY,GOOGLE_PAY"></primer-payment-method-container>

<!-- Show everything except cards -->
<primer-payment-method-container exclude="PAYMENT_CARD"></primer-payment-method-container>
```

## Card Form Components

### `<primer-card-form>`

Container for card payment inputs with built-in validation and state management.

**Slots:**

- `card-form-content` - Custom content area for inputs

**Example:**

```html
<primer-card-form>
  <div slot="card-form-content">
    <primer-input-card-number></primer-input-card-number>
    <primer-input-card-expiry></primer-input-card-expiry>
    <primer-input-cvv></primer-input-cvv>
    <primer-card-form-submit></primer-card-form-submit>
  </div>
</primer-card-form>
```

### `<primer-input-card-number>`

Secure card number input field with automatic card type detection.

**DOM Structure:**

```html
<primer-input-wrapper>
  <primer-input-label slot="label">Card Number</primer-input-label>
  <div slot="input">
    <!-- Secure iframe for card number -->
    <primer-card-network-selector></primer-card-network-selector>
  </div>
</primer-input-wrapper>
```

### `<primer-input-card-expiry>`

Expiration date input with automatic formatting (MM/YY).

### `<primer-input-cvv>`

CVV/security code input field.

### `<primer-input-card-holder-name>`

Cardholder name text input (not in secure iframe).

### `<primer-card-form-submit>`

Localized submit button for card forms.

### `<primer-billing-address>`

Collects billing address information (SDK Core only).

**Attributes:**

- Mode configuration (drop-in or custom layout)

**Example:**

```html
<primer-card-form>
  <div slot="card-form-content">
    <primer-input-card-number></primer-input-card-number>
    <primer-billing-address></primer-billing-address>
    <primer-card-form-submit></primer-card-form-submit>
  </div>
</primer-card-form>
```

## Base UI Components

### `<primer-input-wrapper>`

Container that provides consistent styling for form inputs.

**Attributes:**

- `has-error` - Boolean to show error state

**Slots:**

- `label` - For primer-input-label
- `input` - For primer-input or custom content
- `error` - For primer-input-error

**Example:**

```html
<primer-input-wrapper>
  <primer-input-label slot="label">Email</primer-input-label>
  <primer-input slot="input" type="email"></primer-input>
  <primer-input-error slot="error">Invalid email</primer-input-error>
</primer-input-wrapper>
```

### `<primer-input>`

Standard input field with consistent styling.

**Attributes:**

- Standard HTML input attributes: `type`, `value`, `placeholder`, `disabled`, `required`, etc.
- `name` - For form data collection

**Events:**

- `input` - Value changed
- `change` - Value committed (blur/Enter)
- `focus` - Input focused
- `blur` - Input blurred
- `invalid` - Validation failed

### `<primer-input-label>`

Form label component.

**Attributes:**

- `for` - ID of associated input
- `disabled` - Boolean for disabled state

### `<primer-input-error>`

Error message component.

**Attributes:**

- `for` - ID of associated input
- `active` - Boolean to show/hide error

### `<primer-button>`

Styled button component.

**Attributes:**

- `variant` - "primary" or "secondary"
- `buttonType` - "button" or "submit"
- `disabled` - Boolean

**Example:**

```html
<primer-button variant="primary">Pay Now</primer-button>
<primer-button variant="secondary">Cancel</primer-button>
```

## Utility Components

### `<primer-error-message-container>`

Automatically displays payment processing errors.

**Example:**

```html
<div slot="payments">
  <primer-payment-method type="PAYMENT_CARD"></primer-payment-method>
  <primer-error-message-container></primer-error-message-container>
</div>
```

### `<primer-vault-manager>`

Displays saved payment methods when vault is enabled.

**Requires:**

- Vault enabled in SDK options: `{"vault": {"enabled": true}}`

### `<primer-show-other-payments>`

Manages visibility of alternative payment methods when vault is active.

**Slots:**

- `other-payments` - Content shown when "Show other payments" is clicked

## Events

### Core Checkout Events

**`primer:ready`**

- Fired when SDK initialization completes
- Detail: PrimerJS instance with callbacks:
  - `onPaymentSuccess` - New in v0.7.0
  - `onPaymentFailure` - New in v0.7.0
  - `onVaultedMethodsUpdate` - New in v0.7.0
  - `onPaymentStart`, `onPaymentPrepare`
  - `refreshSession()`, `getPaymentMethods()`

**Example:**

```javascript
checkout.addEventListener('primer:ready', (event) => {
  const primer = event.detail;

  // Set up callbacks
  primer.onPaymentSuccess = ({ paymentSummary, paymentMethodType }) => {
    console.log('Payment successful!');
  };

  primer.onPaymentFailure = ({ error, paymentMethodType }) => {
    console.error('Payment failed:', error.message);
  };
});
```

**`primer:state-change`**

- Fired when checkout state changes
- Detail: `{isProcessing, isSuccessful, isLoading, primerJsError, paymentFailure}`
- Note: `error` → `primerJsError`, `failure` → `paymentFailure` (v0.7.0)

**Example:**

```javascript
checkout.addEventListener('primer:state-change', (event) => {
  const { isProcessing, isSuccessful, primerJsError, paymentFailure } = event.detail;
  if (primerJsError) {
    console.error('SDK error:', primerJsError);
  }
  if (paymentFailure) {
    console.error('Payment failed:', paymentFailure);
  }
});
```

**`primer:methods-update`**

- Fired when available payment methods change
- Detail: InitializedPayments instance with `.toArray()`, `.get()`, `.size()` methods
- Note: Replaces `primer-payment-methods-updated`

**Example:**

```javascript
checkout.addEventListener('primer:methods-update', (event) => {
  const methods = event.detail.toArray();
  console.log(`${methods.length} payment methods available`);

  // Get specific method
  const cardMethod = event.detail.get('PAYMENT_CARD');
});
```

### Payment Lifecycle Events (New in v0.7.0)

**`primer:payment-start`**

- Fired when payment processing begins
- Detail: undefined

**`primer:payment-success`**

- Fired when payment completes successfully
- Detail: `{paymentSummary, paymentMethodType, timestamp}`
- PaymentSummary is PII-filtered (safe for client-side)

**Example:**

```javascript
checkout.addEventListener('primer:payment-success', (event) => {
  const { paymentSummary, paymentMethodType, timestamp } = event.detail;
  console.log(`✅ Payment successful via ${paymentMethodType}`);
  console.log(`Card: ${paymentSummary.network} ending in ${paymentSummary.last4Digits}`);
  // Navigate to success page
});
```

**`primer:payment-failure`**

- Fired when payment fails
- Detail: `{error: {code, message, diagnosticsId}, paymentSummary?, paymentMethodType, timestamp}`

**Example:**

```javascript
checkout.addEventListener('primer:payment-failure', (event) => {
  const { error, paymentMethodType } = event.detail;
  console.error(`❌ Payment failed: ${error.message}`);
  console.error(`Diagnostics ID: ${error.diagnosticsId}`);
  // Show error to user
});
```

### Vault Events (New in v0.7.0)

**`primer:vault:methods-update`**

- Fired when vaulted payment methods loaded/updated
- Detail: `{vaultedPayments, timestamp}`
- vaultedPayments API: `.toArray()`, `.get(id)`, `.size()`

**Example:**

```javascript
checkout.addEventListener('primer:vault:methods-update', (event) => {
  const { vaultedPayments } = event.detail;
  console.log(`${vaultedPayments.size()} saved payment methods`);

  vaultedPayments.toArray().forEach((method) => {
    console.log(`${method.paymentInstrumentType}: ${method.paymentInstrumentData.last4Digits}`);
  });
});
```

### Card Events

**`primer:card-network-change`**

- Fired when card network detected
- Detail: `{detectedCardNetwork, selectableCardNetworks, isLoading}`

**Example:**

```javascript
cardForm.addEventListener('primer:card-network-change', (event) => {
  const { detectedCardNetwork, selectableCardNetworks } = event.detail;
  console.log(`Detected: ${detectedCardNetwork}`);
});
```

**`primer:card-success`**

- Fired when card form submission succeeds
- Detail: `{result}`

**`primer:card-error`**

- Fired when card validation errors occur
- Detail: `{errors: InputValidationError[]}`

**`primer:card-submit`** (Triggerable)

- Dispatch this event to trigger card form submission programmatically
- Detail: `{source?: string}`

**Example:**

```javascript
// Trigger card form submission from external button
const cardForm = document.querySelector('primer-card-form');
cardForm.dispatchEvent(
  new CustomEvent('primer:card-submit', {
    detail: { source: 'external-button' },
  }),
);
```

## SDK Options Structure

```typescript
interface SDKOptions {
  // Core Options
  sdkCore?: boolean; // Default: true since v0.4.0
  locale?: string; // e.g., 'en-GB', 'fr-FR'
  merchantDomain?: string; // For Apple Pay domain validation
  disabledPayments?: boolean; // Disable all payment methods
  enabledPaymentMethods?: PaymentMethodType[]; // Filter which methods display

  // Card Options
  card?: {
    cardholderName?: {
      required?: boolean;
      visible?: boolean;
    };
  };

  // Apple Pay Options
  applePay?: {
    buttonType?: 'buy' | 'donate' | 'plain' | 'checkout' | 'set-up' | 'book' | 'subscribe';
    buttonStyle?: 'black' | 'white' | 'white-outline';
    billingOptions?: {
      requiredBillingContactFields?: (
        | 'emailAddress'
        | 'name'
        | 'phoneNumber'
        | 'postalAddress'
        | 'phoneticName'
      )[];
    };
    shippingOptions?: {
      requiredShippingContactFields?: (
        | 'emailAddress'
        | 'name'
        | 'phoneNumber'
        | 'postalAddress'
        | 'phoneticName'
      )[];
      requireShippingMethod?: boolean;
    };
  };

  // Google Pay Options
  googlePay?: {
    buttonType?:
      | 'long'
      | 'short'
      | 'book'
      | 'buy'
      | 'checkout'
      | 'donate'
      | 'order'
      | 'pay'
      | 'plain'
      | 'subscribe';
    buttonColor?: 'default' | 'black' | 'white';
    buttonSizeMode?: 'fill' | 'static';
    captureBillingAddress?: boolean;
    emailRequired?: boolean;
    requireShippingMethod?: boolean;
  };

  // PayPal Options
  paypal?: {
    style?: {
      layout?: 'vertical' | 'horizontal';
      color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
      shape?: 'rect' | 'pill';
      height?: number; // 25-55
      label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment';
      tagline?: boolean;
      borderRadius?: number; // 0-55
      disableMaxWidth?: boolean;
    };
    disableFunding?: string[]; // ['credit', 'card', 'paylater', etc.]
    enableFunding?: string[]; // ['venmo', etc.]
    vault?: boolean;
    buyerCountry?: string; // Sandbox only
    debug?: boolean;
  };

  // Klarna Options
  klarna?: {
    paymentFlow?: 'DEFAULT' | 'PREFER_VAULT';
    allowedPaymentCategories?: ('pay_now' | 'pay_later' | 'pay_over_time')[];
    buttonOptions?: {
      text?: string;
    };
  };

  // Vault Options
  vault?: {
    enabled?: boolean;
    showEmptyState?: boolean;
  };

  // Stripe Options
  stripe?: {
    mandateData?: {
      fullMandateText?: string;
      merchantName?: string;
    };
    publishableKey?: string;
  };

  // Submit Button Options
  submitButton?: {
    amountVisible?: boolean;
    useBuiltInButton?: boolean; // Set false for external buttons
  };
}
```

## CSS Custom Properties

### Brand Colors

- `--primer-color-brand` - Primary brand color
- `--primer-color-loader` - Loading indicator color
- `--primer-color-focus` - Focus state color

### Typography

- `--primer-typography-brand` - Font family

### Spacing & Sizing

- `--primer-space-base` - Base spacing unit (default: 4px)
- `--primer-size-base` - Base size unit (default: 4px)
- `--primer-radius-base` - Border radius (default: 4px)

### Theme-Specific Variables

```css
.primer-light-theme {
  --primer-color-text-primary: var(--primer-color-gray-900);
  --primer-color-background-outlined-default: var(--primer-color-gray-000);
}

.primer-dark-theme {
  --primer-color-text-primary: var(--primer-color-gray-100);
  --primer-color-background-outlined-default: var(--primer-color-gray-800);
}
```

### Usage Example

```css
:root {
  --primer-color-brand: #2f98ff;
  --primer-radius-base: 8px;
  --primer-typography-brand: 'Inter, sans-serif';
}

/* Or apply to specific checkout */
primer-checkout {
  --primer-color-brand: #4a6cf7;
  --primer-radius-base: 4px;
}
```
