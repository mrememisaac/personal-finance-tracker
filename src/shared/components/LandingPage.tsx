import React from 'react';
import '../../index.css';
import '../styles/landing.css';

const LandingPage: React.FC = () => {
  return (
    <main className="landing-root">
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-title">Take control of your money</h1>
          <p className="landing-subtitle">Personal Finance Tracker helps you budget, track spending, and reach your goals — simple, private, and fast.</p>
          <a href="/auth/signup" className="landing-cta">Get started — Sign up</a>
        </div>
      </section>

      <section className="landing-features">
        <div className="feature">
          <h3>Smart budgeting</h3>
          <p>Plan monthly budgets and get simple visual insights about where your money goes.</p>
        </div>
        <div className="feature">
          <h3>Privacy-first</h3>
          <p>Your data stays local to your account. No surprise tracking or third-party sharing.</p>
        </div>
        <div className="feature">
          <h3>Actionable insights</h3>
          <p>Automated categorization and recommendations to help you save more.</p>
        </div>
      </section>

      <section className="landing-footer-cta">
        <a href="/auth/signup" className="landing-cta secondary">Create free account</a>
      </section>
    </main>
  );
};

export default LandingPage;
