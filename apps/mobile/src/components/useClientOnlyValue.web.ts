import { useState, useEffect }  from 'react';
import * as React from 'react';

// `useEffect` is not invoked during server rendering, meaning
// we can use this to determine if we're on the server or not.
export function useClientOnlyValue(_server: React.ReactNode, client: React.ReactNode): React.ReactNode {
  const [value, setValue] = useState<React.ReactNode>(_server as React.ReactNode);
  useEffect(() => {
    setValue((client ?? _server) as React.ReactNode);
  }, [client, _server]);

  return value;
}