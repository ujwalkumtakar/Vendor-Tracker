'use client';

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
    }
  }
}, { ssr: true });

/**
 * Providers is a wrapper component that provides the necessary AWS
 * Amplify configuration to the application.
 *
 * This component should be used to wrap the entire application to
 * ensure that the Amplify configuration is available to all components.
 *
 * @param {React.ReactNode} children - The children of the Providers
 * component.
 * @returns {React.ReactElement} - The wrapped children.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
