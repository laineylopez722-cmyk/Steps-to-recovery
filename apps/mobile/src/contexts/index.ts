/**
 * Context Providers Export
 *
 * Central export point for all React context providers used throughout the app.
 *
 * **Available Contexts**:
 * - `AuthProvider` - Authentication and session management
 * - `SyncProvider` - Background data synchronization
 * - `NotificationProvider` - Notification scheduling and management
 *
 * **Usage**: Wrap your app with these providers in the root component.
 *
 * @module contexts
 * @example
 * ```tsx
 * <AuthProvider>
 *   <SyncProvider>
 *     <NotificationProvider>
 *       <App />
 *     </NotificationProvider>
 *   </SyncProvider>
 * </AuthProvider>
 * ```
 */

export { AuthProvider, useAuth } from './AuthContext';
export { SyncProvider, useSync } from './SyncContext';
export { NotificationProvider, useNotifications } from './NotificationContext';
