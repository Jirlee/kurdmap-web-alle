import React from 'react';
import { View } from 'react-native';

const MapView = React.forwardRef((props, ref) => {
  return React.createElement(View, { ...props, ref });
});

MapView.displayName = 'MapView';

export const Marker = (props) => React.createElement(View, props);
export const Callout = (props) => React.createElement(View, props);
export const PROVIDER_GOOGLE = 'google';
export default MapView;
