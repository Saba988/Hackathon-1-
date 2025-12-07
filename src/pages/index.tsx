import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import PersonalizedInsight from '@site/src/components/PersonalizedInsight';
import GridSnake from '@site/src/components/GridSnake';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <GridSnake />
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <Heading as="h1" className="hero__title">
          <span className="text--gradient">🦾 {siteConfig.title} 🧪</span>
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/physical-ai-humanoid-robotics/module-1-ros2">
            Start Learning 🤖
          </Link>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <PersonalizedInsight title="Course Overview" />
        </div>
      </div>
    </header>
  );
}


export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Master Physical AI and Humanoid Robotics with ROS 2, Isaac Sim, and VLA models.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}