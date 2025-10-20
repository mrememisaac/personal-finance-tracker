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
                            <h1 className="landing-title">Your money, your control</h1>
                            <p className="landing-subtitle">Track spending, set budgets, and reach financial goals with a simple, private tool built for clarity.</p>
                            <p className="landing-tagline">No ads. No tracking. Just honest money management.</p>
                            <a href="/auth/signup" className="landing-cta landing-cta-primary">Start for free</a>
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
                    <div className="feature-icon">💰</div>
                    <h3>Budget like a pro</h3>
                    <p>Set category limits, get alerts when you're close to budget, and understand spending patterns at a glance.</p>
                </div>
                <div className="feature">
                    <div className="feature-icon">🔒</div>
                    <h3>Your data, private</h3>
                    <p>Everything stays in your account. We don't sell data, track you, or share with third parties.</p>
                </div>
                <div className="feature">
                    <div className="feature-icon">📊</div>
                    <h3>See the full picture</h3>
                    <p>Auto-categorized transactions, visual reports, and personalized recommendations to help you save.</p>
                </div>
            </section>

            <section className="landing-trust">
                <h2 className="landing-section-title">Why choose Personal Finance Tracker?</h2>
                <div className="trust-grid">
                    <div className="trust-item">
                        <strong>100% Free</strong>
                        <p>No subscriptions, no hidden fees. Ever.</p>
                    </div>
                    <div className="trust-item">
                        <strong>Works offline</strong>
                        <p>Sync when you're ready. Your data is always accessible.</p>
                    </div>
                    <div className="trust-item">
                        <strong>Fast & responsive</strong>
                        <p>Built for speed. Works smooth on desktop, tablet, and mobile.</p>
                    </div>
                </div>
            </section>

            <section className="landing-footer-cta">
                <div className="footer-cta-container">
                    <a href="/auth/signup" className="landing-cta landing-cta-primary">Get started free</a>
                    <p className="cta-note">No credit card required</p>
                </div>
            </section>
        </main>
    );
};

export default LandingPage;
