import React, { useState } from 'react';
import {
    Box, Container, Heading, Input, IconButton, Grid, GridItem,
    Button, Text, VStack, HStack, useToast, chakra
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import MCQModal from '../components/MCQModal';
import { getQuestions } from '../api/api';
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
    const toast = useToast();
    const navigate = useNavigate();

    const handleQuick = async (label) => {
        setSymptom(label);
        await loadQuestions(label);
    };

    const loadQuestions = async (sym) => {
        try {
            toast({ title: 'Loading questions...', status: 'info', duration: 1000 });
            const qs = await getQuestions(sym);
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
        await loadQuestions(symptom);
    };

    return (
        <Container maxW="container.md" py={8}>
            <VStack spacing={6} align="stretch">
                <Box bgGradient="linear(to-r, blue.400, purple.400)" p={6} borderRadius="md" color="white">
                    <HStack justify="space-between">
                        <Heading size="lg">SymptomAI</Heading>
                        <Button variant="ghost" colorScheme="whiteAlpha">☰</Button>
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
                        <GridItem><QuickTile emoji="🤢" label="Stomach ache" onClick={() => handleQuick('Stomach pain')} /></GridItem>
                    </Grid>
                </Box>

                <Text textAlign="center" color="gray.600">Quick tiles pick the most common starting flows — you can still type anything above.</Text>
            </VStack>

            <MCQModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                questions={questions}
                symptom={symptom}
                onComplete={(answers) => {
                    // pass answers into result route
                    navigate('/result', { state: { symptom, answers } });
                }}
            />
        </Container>
    );
}
