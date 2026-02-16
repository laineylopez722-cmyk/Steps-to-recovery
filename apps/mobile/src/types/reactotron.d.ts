import type { ReactotronReactNative } from 'reactotron-react-native';

declare global {
  interface Console {
    tron?: typeof import('reactotron-react-native').default;
  }
}
