import '../components/styles/globals.css';
import React from 'react';

const App = (props: any) => {
  const { Component, pageProps } = props;
  return <Component {...pageProps} />;
};

export default App;
