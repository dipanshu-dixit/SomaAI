import React, { useState } from "react";
import {
    Box,
    Heading,
    Text,
    Input,
    InputGroup,
    InputRightElement,
    IconButton,
    Button,
    VStack,
    Spinner,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import axios from "axios";

export default function Home() {
    const [symptom, setSymptom] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!symptom.trim()) return;
        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/analyze`,
                { symptom }
            );
            setResult(response.data.result || "No result from AI");
        } catch (error) {
            setResult("Error connecting to server.");
        }
        setLoading(false);
    };

    return (
        <Box minH="100vh" bg="gray.900" color="white" p={8}>
            <VStack spacing={6} maxW="600px" mx="auto">
                <Heading>Symptom AI</Heading>

                <InputGroup>
                    <Input
                        placeholder="Enter your symptom..."
                        value={symptom}
                        onChange={(e) => setSymptom(e.target.value)}
                        bg="white"
                        color="black"
                    />
                    <InputRightElement>
                        <IconButton
                            aria-label="Analyze"
                            icon={<SearchIcon />}
                            onClick={handleAnalyze}
                        />
                    </InputRightElement>
                </InputGroup>

                {loading ? (
                    <Spinner size="lg" />
                ) : (
                    result && <Text>{result}</Text>
                )}

                <Button onClick={handleAnalyze} colorScheme="teal">
                    Analyze
                </Button>
            </VStack>
        </Box>
    );
}
