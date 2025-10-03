
# Personal Finance Tracker

A modern, full-featured web application for managing your personal finances, built with React, TypeScript, and Vite. This project implements the Vertical Slice Architecture (VSA) for maximum maintainability, scalability, and testability.

---

## 🚀 Features

- **Accounts**: Track multiple account types (checking, savings, credit, investment)
- **Transactions**: Record income and expenses, categorize, and tag
- **Budgets**: Set spending limits, monitor progress, and receive alerts
- **Goals**: Define and track financial goals
- **Reports**: Visualize spending, trends, and generate analytics
- **Dashboard**: Get a real-time overview of your financial health
- **Testing**: Automated unit, integration, and component tests
- **Authentication**: Secure login, signup, and session management
- **Data Export**: Export data to CSV/JSON
- **Responsive UI**: Mobile-friendly, clean design with Tailwind CSS

---

## 🏗️ Architecture

### Vertical Slice Architecture (VSA)
- **Feature-first organization**: Each slice (feature) contains its own models, services, components, and tests
- **Loose coupling**: Slices communicate via injected services, not direct imports
- **Centralized state**: Managed via React Context and reducer pattern
- **Barrel exports**: Clean public APIs for each slice

**Example slice structure:**
```
src/slices/accounts/
├── Account.ts                # Domain model
├── AccountService.ts         # Business logic
├── components/               # UI components
├── services/                 # Additional services
├── __tests__/                # Tests
└── index.ts                  # Barrel exports
```

---

## 📦 Tech Stack

- **Frontend**: React 18+, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js, react-chartjs-2
- **Testing**: Vitest, Testing Library
- **Linting**: ESLint, TypeScript ESLint
- **State Management**: React Context + Reducer

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm/yarn)

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Build
```bash
pnpm build
```

### Run Tests
```bash
pnpm test
```

---

## 🧩 Project Structure

```
├── public/                # Static assets
├── src/
│   ├── app/               # App shell, navigation, error boundaries
│   ├── shared/            # Shared types, context, utilities
│   ├── slices/            # Feature slices (accounts, transaction, budget, etc.)
│   ├── index.css          # Global styles
│   └── main.tsx           # App entry point
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── tsconfig*.json
└── README.md
```

---

## 🧠 Key Concepts

- **Domain Models**: Rich business logic in model classes (e.g., Account, Transaction)
- **Service Layer**: Each slice exposes a service for business operations
- **Validation**: Comprehensive validation in models and services
- **Testing**: 50+ test files for models, services, and UI
- **Cross-slice orchestration**: Managed via `ServiceIntegration.tsx`
- **Type Safety**: Strong TypeScript usage throughout

---

## 🧪 Testing

- **Unit tests**: For models and services
- **Integration tests**: Cross-slice and service orchestration
- **Component tests**: UI and interaction
- **Test runner**: Vitest

Run all tests:
```bash
pnpm test
```

---

## 🔒 Security
- Authentication and session management via the `auth` slice
- Validation and error handling in all user input paths

---

## 📈 Analytics & Reporting
- Visualize spending by category, trends, and net worth
- Export reports to CSV/JSON

---

## 📚 Documentation
- **VSA.md**: In-depth architecture and best practices analysis
- **Slice-level docs**: (Recommended) Add `README.md` to each slice for feature-specific details

---

## 🤝 Contributing

1. Fork the repo
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgements
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Chart.js](https://www.chartjs.org/)
- [Vitest](https://vitest.dev/)

---

## 📣 Contact

For questions, suggestions, or support, please open an issue or contact the maintainer.
