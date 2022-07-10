import Link from 'next/link';
import React from 'react';
import styles from './footer.module.css';

const Footer = () => (
  <div className={styles.footer}>
    <div className={styles.grid}>
      <div className={styles.gridItem}>
        <Link href="/writing">
          <a className={styles.footerLink}>Writing</a>
        </Link>
      </div>
      <div className={styles.gridItem}>
        <Link href="/photos">
          <a className={styles.footerLink}>Photos</a>
        </Link>
      </div>
      <div className={styles.gridItem}>
        <Link href="https://www.instagram.com/zamiang">
          <a className={styles.footerLink}>Instagram</a>
        </Link>
      </div>
      <div className={styles.gridItem}>
        <Link href="/rss.xml">
          <a className={styles.footerLink}>RSS</a>
        </Link>
      </div>
      <div className={styles.gridItem}>
        <Link href="https://github.com/zamiang/homepage-notion-nextjs">
          <a className={styles.footerLink}>Source</a>
        </Link>
      </div>
    </div>
    <div className={styles.copyright}>
      {'Copyright © '}
      <Link href="/">
        <a className={styles.footerLink} style={{ margin: 0 }}>
          Brennan Moore
        </a>
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </div>
  </div>
);

export default Footer;
