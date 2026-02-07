// This function is web-only as native doesn't currently support server (or build-time) rendering.
import * as React from 'react';

export function useClientOnlyValue(_server: React.ReactNode, client: React.ReactNode): React.ReactNode {
  return (client ?? _server) as React.ReactNode;
}
