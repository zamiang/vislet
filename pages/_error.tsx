import React from 'react';

function Error({ statusCode }: any) {
  return (
    <p>
      {statusCode ? `An error ${statusCode} occurred on server` : 'An error occurred on client'}
    </p>
  );
}

Error.getInitialProps = ({ req, res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  if (!(process as any).browser) {
    console.error(err, req);
  }
  return { statusCode };
};

export default Error;
