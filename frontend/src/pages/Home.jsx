import React, { useState } from 'react';
import { Container, VStack, Heading, Text, Box, Textarea, Button, useToast } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import ResultCard from '@/components/ResultCard';
import axios from 'axios';

const MotionHeading = motion(Heading);
const MotionBox = motion(Box);

const cosmicLines = [
    "✨ This feels a bit heavy — let’s figure it out together.",
    "🌌 I know this sounds scary — we’ll break it down step-by-step.",
    "🌿 Small steps today, bigger wins tomorrow."
];

function maybeAddPersonality(result) {
    if (!result || !result.result) return result;
    // 40% chance to append a small cosmic feel
    if (Math.random() < 0.4) {
        const pick = cosmicLines[Math.floor(Math.random() * cosmicLines.length)];
        return { ...result, result: { ...result.result, summary: `${result.result.summary} ${pick}` } };
    }
    return result;
}

export default function Home() {
    const [symptoms, setSymptoms] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const toast = useToast();

    const handleSubmit = async () => {
        if (!symptoms.trim()) {
            toast({ title: 'Type your symptoms', status: 'warning', duration: 1400, isClosable: true });
            return;
        }
        setLoading(true);
        setResult(null);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/analyze`, { symptoms }, { timeout: 30000 });
            const enhanced = maybeAddPersonality(res.data);
            setResult(enhanced);
        } catch (err) {
            console.error(err);
            toast({ title: 'API error', description: err.message || 'Something went wrong', status: 'error', duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box minH="100vh" bgGradient="linear(to-br, brand.600, purple.600)" py={12}>
            <Container maxW="container.md" bg="transparent">
                <VStack spacing={6} align="stretch">
                    <MotionHeading
                        as="h1"
                        size="2xl"
                        textAlign="center"
                        color="white"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        🌌 SomaAI
                    </MotionHeading>

                    <Text color="whiteAlpha.800" textAlign="center">Quick, friendly health guidance — with a tiny sprinkle of wisdom ✨</Text>

                    <MotionBox bg="white" p={5} rounded="2xl" shadow="lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <VStack spacing={4}>
                            <Textarea placeholder="e.g., chest tightness and heart racing since morning..." value={symptoms} onChange={(e) => setSymptoms(e.target.value)} minH="120px" />
                            <Button colorScheme="brand" size="lg" isLoading={loading} onClick={handleSubmit} w="100%">🔮 Analyze Symptoms</Button>
                        </VStack>
                    </MotionBox>

                    {result && result.ok && <ResultCard result={result.result} />}

                    <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">⚠️ Not medical advice — use this for guidance and seek a doctor for urgent issues.</Text>
                </VStack>
            </Container>
        </Box>
    );
}
