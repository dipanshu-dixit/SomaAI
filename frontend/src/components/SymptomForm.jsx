// frontend/src/components/SymptomForm.jsx
import { useState } from "react";
import { Box, Textarea, Button, Alert, AlertIcon } from "@chakra-ui/react";
import { analyze } from "../api/api";

export default function SymptomForm({ onResult }) {
    const [symptoms, setSymptoms] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await analyze(symptoms);
            if (res.ok) {
                onResult(res.result); // Pass structured object up
            } else {
                setError(res.error || "Something went wrong");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit} mb={6}>
            <Textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms..."
                rows={4}
                mb={4}
                resize="vertical"
            />
            <Button 
                type="submit" 
                isLoading={loading}
                loadingText="Analyzing..."
                colorScheme="blue"
                size="lg"
                isDisabled={!symptoms.trim()}
            >
                Analyze Symptoms
            </Button>
            {error && (
                <Alert status="error" mt={4}>
                    <AlertIcon />
                    {error}
                </Alert>
            )}
        </Box>
    );
}