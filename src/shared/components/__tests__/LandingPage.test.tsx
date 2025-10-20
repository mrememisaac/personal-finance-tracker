import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from '../LandingPage';

describe('LandingPage', () => {
    it('renders hero and CTA', () => {
        render(<LandingPage />);
        expect(screen.getByText(/Take control of your money/i)).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /sign up/i })[0]).toBeInTheDocument();
    });
});
