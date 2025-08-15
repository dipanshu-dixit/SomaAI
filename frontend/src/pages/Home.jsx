import React, { useState } from 'react';
import {
    Box, Container, Heading, Input, IconButton, Grid, GridItem,
    Button, Text, VStack, HStack, useToast, chakra,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import MCQModal from '../components/MCQModal';
import { getQuestions, quickQuery as apiQuickQuery } from '../api/api';
import { useNavigate } from 'react-router-dom';

const QuickTile = ({ emoji, label, onClick }) => (
    <Button onClick={onClick} variant="ghost" bg="white" boxShadow="sm" borderRadius="md" h="14">
        <HStack spacing={3}>
            <chakra.span fontSize="lg">{emoji}</chakra.span>
            <Text fontWeight="semibold">{label}</Text>
        </HStack>
    </Button>
);

export default function Home() {
    const [symptom, setSymptom] = useState('');
    const [questions, setQuestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [flowType, setFlowType] = useState('physical');
    const [quickQuery, setQuickQuery] = useState('');
    const [quickQueryAnswer, setQuickQueryAnswer] = useState('');
    const [isQuickQueryOpen, setQuickQueryOpen] = useState(false);
    const [quickQueryLoading, setQuickQueryLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleQuick = async (label, type = 'physical') => {
        setSymptom(label);
        setFlowType(type);
        await loadQuestions(label);
    };

    const loadQuestions = async (sym) => {
        try {
            toast({ title: 'Loading questions...', status: 'info', duration: 1000 });
            // Use the state `flowType` which is set before this function is called.
            const qs = await getQuestions(sym, flowType);
            setQuestions(qs || []);
            setIsOpen(true);
        } catch (err) {
            console.error('Error loading questions:', err);
            toast({
                title: 'Error',
                description: err.message || 'Could not load questions',
                status: 'error',
                duration: 5000
            });
        }
    };

    const onSubmitSearch = async (e) => {
        e?.preventDefault();
        if (!symptom?.trim()) return toast({ title: 'Type anything!', status: 'warning' });
        setFlowType('physical');
        await loadQuestions(symptom);
    };

    const handleQuickQuerySubmit = async (e) => {
        e.preventDefault();
        if (!quickQuery.trim()) {
            return toast({ title: 'Please enter a question.', status: 'warning', duration: 3000 });
        }
        setQuickQueryLoading(true);
        try {
            const answer = await apiQuickQuery(quickQuery);
            setQuickQueryAnswer(answer);
            setQuickQueryOpen(true);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message || 'Could not get an answer.',
                status: 'error',
                duration: 5000
            });
        } finally {
            setQuickQueryLoading(false);
        }
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="stretch">
                <Box bgGradient="linear(to-r, blue.400, purple.400)" p={6} borderRadius="md" color="white">
                    <HStack justify="space-between">
                        <Heading size="lg">Symptom.ai</Heading>
                        <Button variant="ghost" colorScheme="whiteAlpha" onClick={() => navigate('/history')}>
                            History
                        </Button>
                    </HStack>
                    <Text mt={4} opacity={0.9}>Understand your body and mind</Text>
                    <form onSubmit={onSubmitSearch}>
                        <HStack mt={4}>
                            <Input
                                placeholder="Search for a symptom or question"
                                value={symptom}
                                onChange={(e) => setSymptom(e.target.value)}
                                bg="white"
                                color="gray.800"
                                borderRadius="full"
                            />
                            <IconButton type="submit" aria-label="search" icon={<SearchIcon />} colorScheme="blue" />
                        </HStack>
                    </form>
                </Box>

                <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
                    <Heading size="md" mb={3}>Check your symptoms</Heading>
                    <Grid templateColumns="repeat(3, 1fr)" gap={3}>
                        <GridItem><QuickTile emoji="💧" label="Headache" onClick={() => handleQuick('Headache')} /></GridItem>
                        <GridItem><QuickTile emoji="😴" label="Can't sleep" onClick={() => handleQuick('Can\'t sleep')} /></GridItem>
                        <GridItem><QuickTile emoji="❤️" label="Chest pain" onClick={() => handleQuick('Chest pain')} /></GridItem>
                        <GridItem><QuickTile emoji="🥵" label="Fever" onClick={() => handleQuick('Fever')} /></GridItem>
                        <GridItem><QuickTile emoji="😣" label="Anxiety" onClick={() => handleQuick('Anxiety')} /></GridItem>
                        <GridItem><QuickTile emoji="🧠" label="Mind Check-in" onClick={() => handleQuick('Mental Health Check-in', 'mental')} /></GridItem>
                        <GridItem><QuickTile emoji="🤢" label="Stomach ache" onClick={() => handleQuick('Stomach pain')} /></GridItem>
                    </Grid>
                </Box>

                <Box p={4} bg="white" borderRadius="md" boxShadow="sm">
                    <Heading size="md" mb={3}>Have a quick question?</Heading>
                    <Text color="gray.600" mb={3}>e.g., "Is it normal to feel tired after lunch?"</Text>
                    <form onSubmit={handleQuickQuerySubmit}>
                        <HStack>
                            <Input
                                placeholder="Ask anything..."
                                value={quickQuery}
                                onChange={(e) => setQuickQuery(e.target.value)}
                            />
                            <Button type="submit" colorScheme="purple" isLoading={quickQueryLoading}>Ask</Button>
                        </HStack>
                    </form>
                </Box>

                <Text textAlign="center" color="gray.600">Quick tiles pick the most common starting flows — you can still type anything above.</Text>
            </VStack>

            <MCQModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                questions={questions}
                symptom={symptom}
                onComplete={(answers) => {
                    navigate('/result', { state: { symptom, answers, type: flowType } });
                }}
            />

            <Modal isOpen={isQuickQueryOpen} onClose={() => setQuickQueryOpen(false)} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Quick Answer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text whiteSpace="pre-wrap">{quickQueryAnswer}</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={() => setQuickQueryOpen(false)}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
}
