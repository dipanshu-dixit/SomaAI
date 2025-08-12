import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Container, Heading, Text, VStack, HStack, Tag, Button, Spinner, List, ListItem } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { analyze } from '../api/api';

// Helper function for urgency color scheme
function getUrgencyColorScheme(urgency) {
    switch (urgency) {
        case 'HIGH': return 'red';
        case 'MEDIUM': return 'yellow';
        case 'LOW': return 'green';
        default: return 'gray';
    }
}

export default function Result() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const symptom = state?.symptom || '';
    const answers = state?.answers || {};
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!symptom) {
            navigate('/');
            return;
        }
        (async () => {
            try {
                setLoading(true);
                setError(null);
                const r = await analyze(symptom, answers);
                setResult(r);
            } catch (err) {
                console.error('Analysis error:', err);
                setError(err.message || 'Failed to get AI response. Please try again.');
            } finally {
                setLoading(false);
            }
        })();
    }, [symptom, answers, navigate]);

    // Memoized handlers to prevent re-renders
    const handleTryAgain = useCallback(() => {
        window.location.reload();
    }, []);

    const handleBack = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const handleAskAgain = useCallback(() => {
        window.location.reload();
    }, []);

    // Memoized lists to prevent re-renders
    const possibleCausesList = useMemo(() => {
        return result?.possibleCauses?.map((c, i) => (
            <ListItem key={i}>• {c}</ListItem>
        ));
    }, [result?.possibleCauses]);

    const nextStepsList = useMemo(() => {
        return result?.nextSteps?.map((s, i) => (
            <ListItem key={i}>✅ {s}</ListItem>
        ));
    }, [result?.nextSteps]);

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="stretch">
                <Box bg="white" p={6} borderRadius="md" boxShadow="sm">
                    <HStack justify="space-between">
                        <Heading size="md">Result</Heading>
                        <Tag colorScheme={getUrgencyColorScheme(result?.urgency)}>
                            {result?.urgency || '—'}
                        </Tag>
                    </HStack>
                    <Text color="gray.600" mt={2}>Symptom: {symptom}</Text>

                    {loading && (
                        <HStack mt={6}>
                            <Spinner /> <Text>Analyzing with AI — one moment...</Text>
                        </HStack>
                    )}

                    {error && (
                        <Box bg="red.50" p={4} borderRadius="md" mt={4}>
                            <Text color="red.600" fontWeight="semibold">Error</Text>
                            <Text color="red.500" mt={1}>{error}</Text>
                            <Button 
                                mt={3} 
                                size="sm" 
                                colorScheme="red" 
                                variant="outline"
                                onClick={handleTryAgain}
                            >
                                Try Again
                            </Button>
                        </Box>
                    )}

                    {result && (
                        <VStack align="stretch" mt={6} spacing={4}>
                            <Box bg="#f7fbff" p={4} borderRadius="md">
                                <Text fontWeight="bold">Summary</Text>
                                <Text mt={2}>{result.summary}</Text>
                                <Text mt={2} color="gray.600">{result.friendlyNote}</Text>
                            </Box>

                            <Box bg="white">
                                <Text fontWeight="semibold">Possible causes</Text>
                                <List spacing={2} mt={2}>
                                    {possibleCausesList}
                                </List>
                            </Box>

                            <Box bg="white">
                                <Text fontWeight="semibold">Next steps</Text>
                                <List spacing={2} mt={2}>
                                    {nextStepsList}
                                </List>
                            </Box>

                            <Text fontSize="sm" color="gray.500">Confidence: {result.confidence || 'N/A'}</Text>
                            <HStack spacing={3}>
                                <Button variant="ghost" onClick={handleBack}>Back</Button>
                                <Button colorScheme="blue" onClick={handleAskAgain}>Ask again</Button>
                            </HStack>
                        </VStack>
                    )}
                </Box>
            </VStack>
        </Container>
    );
}
