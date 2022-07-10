import Head from 'next/head';
import React from 'react';
import Footer from '../components/homepage/footer';
import Header from '../components/homepage/header';
import styles from './index.module.css';

export const baseUrl = 'https://www.zamiang.com';
const title = 'Vislet - Brennan Moore';
const description = 'Small interactive visualizations to help us understand the cities we live in.';

export default function Home() {
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS Feed for zamiang.com"
          href="/rss.xml"
        />
        {/* Open Graph */}
        <meta property="og:url" content={baseUrl} key="ogurl" />
        <meta property="og:title" content={title} key="ogtitle" />
        <meta property="og:description" content={description} key="ogdesc" />
      </Head>
      <main className={styles.container}>
        <Header />
        <article>
          <header className={styles.header}>
            <div className={styles.profilePhoto}></div>
            <h1>Hi, I’m Brennan.</h1>
            <h2>I build innovative digital products people love.</h2>
            <div className={styles.centerDivider}></div>
          </header>
        </article>
        <Footer />
      </main>
    </div>
  );
}
