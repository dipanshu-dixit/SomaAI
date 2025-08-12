import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme, Box, Text } from '@chakra-ui/react';
import App from './App';

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
    console.error('Application error:', error, errorInfo);
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
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', backgroundColor: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </Box>
      );
    }

    return this.props.children;
  }
}

// gentle custom theme
const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)',
        color: '#0f1724',
        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      }
    }
  },
  colors: {
    brand: {
      50: '#ebf5ff',
      500: '#2b6cb0'
    }
  }
});

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
