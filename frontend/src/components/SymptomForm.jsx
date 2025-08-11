import React, { useState } from 'react';
import { Box, Textarea, Button } from '@chakra-ui/react';
export default function SymptomForm({ onAnalyze, loading }) {
    const [text, setText] = useState('');
    return (
        <Box>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe symptoms..." minH="120px" />
            <Button mt={3} colorScheme="brand" onClick={() => onAnalyze(text)} isLoading={loading}>Analyze</Button>
        </Box>
    );
}
