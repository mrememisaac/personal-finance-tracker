import React from 'react';
import '../../index.css';
import '../styles/landing.css';

const LandingPage: React.FC = () => {
    return (
        <main className="landing-root">
            <section className="landing-hero">
                <div className="landing-hero-inner">
                        <div className="landing-hero-grid">
                            <div>
                                <h1 className="landing-title">Take control of your money</h1>
                                <p className="landing-subtitle">Personal Finance Tracker helps you budget, track spending, and reach your goals — simple, private, and fast.</p>
                                <a href="/auth/signup" className="landing-cta">Get started — Sign up</a>
                            </div>
                            <div className="landing-illustration" aria-hidden="true">
                                <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
                                    <rect x="0" y="0" width="280" height="200" rx="12" fill="url(#g)" />
                                    <g opacity="0.9">
                                        <circle cx="70" cy="120" r="28" fill="white" />
                                        <rect x="110" y="70" width="120" height="80" rx="8" fill="rgba(255,255,255,0.9)" />
                                    </g>
                                    <defs>
                                        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                                            <stop offset="0" stopColor="#0ea5a4" stopOpacity="0.12" />
                                            <stop offset="1" stopColor="#3b82f6" stopOpacity="0.08" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
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
