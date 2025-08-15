import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Flex, Text } from '@chakra-ui/react';
import Home from './pages/Home';
import Result from './pages/Result';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <Flex direction="column" minH="100vh">
        <Box flex="1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
        <Box as="footer" py={4} textAlign="center" borderTop="1px" borderColor="gray.200">
          <Text fontSize="sm" color="gray.500">
            powered by HighBerl
          </Text>
        </Box>
      </Flex>
    </BrowserRouter>
  );
}