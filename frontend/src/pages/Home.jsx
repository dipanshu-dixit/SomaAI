// frontend/src/pages/Home.jsx
import { useState } from "react";
import { Container, Heading } from "@chakra-ui/react";
import SymptomForm from "../components/SymptomForm";
import ResultCard from "../components/ResultCard";

export default function Home() {
    const [result, setResult] = useState(null);

    return (
        <Container maxW="800px" py={10}>
            <Heading mb={6}>AI Symptom Analyzer</Heading>
            <SymptomForm onResult={setResult} />
            {result && <ResultCard result={result} />}
        </Container>
    );
}