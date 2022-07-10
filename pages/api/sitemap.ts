import { Request, Response } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';

export default async (_req: Request, res: Response) => {
  const smStream = new SitemapStream({
    hostname: 'https://www.vislet.nyc',
  });

  smStream.write({
    url: '/',
  });

  smStream.end();

  // generate a sitemap and add the XML feed to a url which will be used later on.
  const sitemap = await streamToPromise(smStream).then((sm) => sm.toString());

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
};
