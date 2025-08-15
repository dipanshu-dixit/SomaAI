import React, { useState, useEffect } from 'react';
import {
    Box, Container, Heading, Text, VStack, HStack, Button,
    Card, CardBody, CardHeader, Tag, Divider
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function getUrgencyColorScheme(urgency) {
    switch (urgency) {
        case 'HIGH': return 'red';
        case 'MEDIUM': return 'yellow';
        case 'LOW': return 'green';
        default: return 'gray';
    }
}

export default function History() {
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const storedHistory = JSON.parse(localStorage.getItem('symptomHistory') || '[]');
        setHistory(storedHistory);
    }, []);

    const handleClearHistory = () => {
        localStorage.removeItem('symptomHistory');
        setHistory([]);
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                    <Heading size="lg">Symptom History</Heading>
                    <Button onClick={() => navigate('/')} variant="ghost">Back to Home</Button>
                </HStack>

                {history.length === 0 ? (
                    <Box bg="white" p={6} borderRadius="md" boxShadow="sm" textAlign="center">
                        <Text>No history yet. Go back and check a symptom to start your timeline.</Text>
                    </Box>
                ) : (
                    <VStack spacing={4} align="stretch">
                        {history.map(item => (
                            <Card key={item.id} variant="outline" bg="white" boxShadow="sm">
                                <CardHeader>
                                    <HStack justify="space-between">
                                        <Heading size="sm">{item.symptom}</Heading>
                                        <Tag colorScheme={getUrgencyColorScheme(item.urgency)}>{item.urgency}</Tag>
                                    </HStack>
                                    <Text fontSize="sm" color="gray.500">{item.date}</Text>
                                </CardHeader>
                                <CardBody>
                                    <Text>{item.summary}</Text>
                                </CardBody>
                            </Card>
                        ))}
                        <Divider my={4} />
                        <Button colorScheme="red" variant="outline" onClick={handleClearHistory} size="sm">
                            Clear History
                        </Button>
                    </VStack>
                )}
            </VStack>
        </Container>
    );
}
