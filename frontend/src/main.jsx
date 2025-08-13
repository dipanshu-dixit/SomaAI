import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, Box, Text } from '@chakra-ui/react';
import theme from './theme';
import App from './App';
import './index.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', encodeURIComponent(error.message || ''), encodeURIComponent(JSON.stringify(errorInfo)));
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} textAlign="center">
          <Text fontSize="xl" color="red.500" mb={4}>
            Something went wrong
          </Text>
          <Text color="gray.600" mb={4}>
            Failed to load application. Please refresh the page.
          </Text>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 16px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </Box>
      );
    }

    return this.props.children;
  }
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ChakraProvider>
  </React.StrictMode>
);