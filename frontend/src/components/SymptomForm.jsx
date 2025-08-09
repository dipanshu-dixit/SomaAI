import React, { useState } from "react";
import {
    Box,
    Input,
    InputGroup,
    InputRightElement,
    IconButton,
    Button,
    Text,
    VStack,
    Spinner
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import axios from "axios";

export default function SymptomForm() {
    const [symptom, setSymptom] = useState("");
    const [result, setResult] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!symptom) return;
        setLoading(true);
        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/analyze`,
                { symptom }
            );
            setResult(data.result || "No result found.");
        } catch (error) {
            setResult("Error connecting to backend.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <VStack spacing={4}>
            <InputGroup>
                <Input
                    placeholder="Enter your symptom"
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                />
                <InputRightElement>
                    <IconButton
                        aria-label="Analyze"
                        icon={<SearchIcon />}
                        onClick={handleSubmit}
                    />
                </InputRightElement>
            </InputGroup>

            <Button
                colorScheme="teal"
                width="full"
                onClick={handleSubmit}
                isDisabled={loading}
            >
                {loading ? <Spinner size="sm" /> : "Analyze"}
            </Button>

            {result && (
                <Box p={4} bg="gray.50" borderRadius="md" width="full">
                    <Text>{result}</Text>
                </Box>
            )}
        </VStack>
    );
}
